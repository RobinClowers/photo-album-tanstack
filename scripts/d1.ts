/**
 * Run SQL or migrations against one of the app's D1 databases without ever
 * typing a database id.
 *
 *   bun run db local   "select count(*) from albums"
 *   bun run db staging "select count(*) from albums"
 *   bun run db prod    "select count(*) from albums"
 *   bun run db staging --write "delete from photos where album_id = 5"
 *   bun run db staging --file ./fixup.sql
 *   bun run db staging --migrate     (what `bun run db:migrate:staging` runs)
 *
 * The environment is the first argument and is required; there is no
 * default. `cf d1` only accepts database ids, so the wrapper looks the id up
 * in config/d1.ts, the same table cloudflare.config.ts binds as
 * `photo_album`, and prints it before running. Statements that write
 * (insert, update, delete, drop, alter, create, replace, pragma) need
 * `--write`, and a production write or migration pauses first so a wrong
 * environment can be caught.
 *
 * SQL is split into statements and sent with `cf d1 raw --batch @file`, in
 * batches of about 90 KB (D1's per-query limit is 100 KB), so a whole dump
 * works and every statement's rows are shown. Each batch is its own
 * transaction: a failure stops the run but leaves earlier batches applied.
 *
 * `local` is the database `vite dev` uses: the production id inside
 * .wrangler/state (the Vite plugin's persist directory, which `cf --local`
 * reads via `--persist-to`; cf's own default is ~/.config/cloudflare/state).
 */
import { spawn } from 'node:child_process'
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { D1_DATABASES, D1_MIGRATIONS_DIR } from '../config/d1'
import { batchStatements, splitSqlStatements } from './sql'

const ENVIRONMENTS = {
  local: {
    label: 'local (.wrangler/state)',
    database: D1_DATABASES.production,
    args: ['--local', '--persist-to', '.wrangler/state'],
  },
  staging: { label: 'staging', database: D1_DATABASES.staging, args: [] },
  prod: { label: 'PRODUCTION', database: D1_DATABASES.production, args: [] },
} as const
type EnvName = keyof typeof ENVIRONMENTS

const WRITE_STATEMENT =
  /\b(insert|update|delete|drop|alter|create|replace|truncate|pragma|vacuum)\b/i
const MAX_BATCH_BYTES = 90_000
// .env.example's placeholder; Bun auto-loads a copied .env into cf's env.
const PLACEHOLDER_ACCOUNT_ID = 'your_account_id_here'

/** One entry of `cf d1 raw`'s JSON output (one per statement run). */
interface RawResult {
  success: boolean
  results?: { columns: string[]; rows: unknown[][] }
  meta?: { changes?: number }
}

function usage(message?: string): never {
  if (message) console.error(`error: ${message}\n`)
  console.error(
    'usage: bun run db <local|staging|prod> [--write] [--json] (<sql> | --file <path> | --migrate)',
  )
  process.exit(2)
}

const [envName, ...rest] = process.argv.slice(2)
if (!envName || !(envName in ENVIRONMENTS)) {
  usage(`first argument must be one of ${Object.keys(ENVIRONMENTS).join(', ')}`)
}
const environment = ENVIRONMENTS[envName as EnvName]
const isLocal = envName === 'local'

let write = false
let json = false
let migrate = false
let file: string | undefined
const positional: string[] = []
for (let i = 0; i < rest.length; i++) {
  const arg = rest[i] as string
  if (arg === '--write') write = true
  else if (arg === '--json') json = true
  else if (arg === '--migrate') migrate = true
  else if (arg === '--file') file = rest[++i]
  else positional.push(arg)
}

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')
const cf = join(repo, 'node_modules', '.bin', 'cf')
if (!existsSync(cf)) usage('cf is not installed; run bun install')

const { name, id } = environment.database
console.error(`${environment.label}: ${name} (${id})`)

async function pauseForProduction(what: string) {
  // CI deploys production unattended; the pause is for people.
  if (envName !== 'prod' || process.env.CI) return
  console.error(`${what} PRODUCTION in 5 seconds; Ctrl-C to abort.`)
  await new Promise((done) => setTimeout(done, 5000))
}

function cfEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, CF_QUIET: '1' }
  if (env.CLOUDFLARE_ACCOUNT_ID === PLACEHOLDER_ACCOUNT_ID) {
    delete env.CLOUDFLARE_ACCOUNT_ID
  }
  return env
}

function isCompleteJson(text: string): boolean {
  try {
    JSON.parse(text)
    return true
  } catch {
    return false
  }
}

/**
 * Run cf with stdout captured (stderr passes through). cf's `--local`
 * commands (1.0.0-beta.5) often print their result and then never exit, so
 * for local runs the process tree is killed once stdout holds a complete
 * JSON document and has been quiet for a second: the work is done by the
 * time cf prints it.
 */
function runCf(args: string[]): Promise<{ status: number; stdout: string }> {
  return new Promise((done) => {
    // cf is spawned with the repo as its cwd, so relative paths in its args
    // (.wrangler/state, drizzle) resolve against the repo from anywhere.
    // Locally, cf gets its own process group so the whole tree can be
    // killed: it re-executes itself, and the hung process is the grandchild.
    const child = spawn(cf, args, {
      cwd: repo,
      env: cfEnv(),
      stdio: ['inherit', 'pipe', 'inherit'],
      detached: isLocal,
    })
    const killTree = () => {
      if (child.pid === undefined || child.exitCode !== null) return
      try {
        process.kill(-child.pid, 'SIGKILL')
      } catch {
        // Already gone.
      }
    }
    // A detached group does not get the terminal's Ctrl-C; pass it on.
    if (isLocal) {
      process.once('SIGINT', () => {
        killTree()
        process.exit(130)
      })
    }
    let stdout = ''
    let settled = false
    let idle: ReturnType<typeof setTimeout> | undefined
    const finish = (status: number) => {
      if (settled) return
      settled = true
      clearTimeout(idle)
      done({ status, stdout })
    }
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk
      if (!isLocal) return
      clearTimeout(idle)
      idle = setTimeout(() => {
        if (!isCompleteJson(stdout)) return
        child.stdout.destroy()
        killTree()
        finish(0)
      }, 1000)
    })
    child.on('error', (error) => {
      console.error(`error: could not run cf: ${error.message}`)
      finish(1)
    })
    child.on('close', (code) => finish(code ?? 1))
  })
}

if (migrate) {
  if (positional.length > 0 || file) usage('--migrate takes no SQL')
  await pauseForProduction('MIGRATING')
  const result = await runCf([
    'd1',
    'migrations',
    'apply',
    id,
    '--dir',
    D1_MIGRATIONS_DIR,
    ...environment.args,
  ])
  process.stdout.write(result.stdout)
  process.exit(result.status)
}

// Resolve a relative --file against the caller's cwd, not the repo.
const sql = file ? readFileSync(resolve(file), 'utf8') : positional.join(' ')
const statements = splitSqlStatements(sql)
if (statements.length === 0) usage('no SQL given')

if (WRITE_STATEMENT.test(sql) && !write) {
  usage(
    `that SQL writes to the ${environment.label} database; add --write if you mean it`,
  )
}
if (write) await pauseForProduction('WRITING TO')

const batches = batchStatements(statements, MAX_BATCH_BYTES)
const scratch = mkdtempSync(join(tmpdir(), 'd1-batch-'))
const results: RawResult[] = []
try {
  for (const [index, batch] of batches.entries()) {
    if (batches.length > 1) {
      console.error(
        `batch ${index + 1}/${batches.length} (${batch.length} statements)`,
      )
    }
    const batchFile = join(scratch, `batch-${index}.json`)
    writeFileSync(batchFile, JSON.stringify(batch.map((s) => ({ sql: s }))))
    const result = await runCf([
      'd1',
      'raw',
      id,
      '--batch',
      `@${batchFile}`,
      ...environment.args,
    ])
    if (result.status !== 0) {
      process.stdout.write(result.stdout)
      if (index > 0)
        console.error(`batches 1-${index} were applied before the failure`)
      process.exit(result.status)
    }
    results.push(...(JSON.parse(result.stdout) as RawResult[]))
  }
} finally {
  rmSync(scratch, { recursive: true, force: true })
}

if (json) {
  console.log(JSON.stringify(results, null, 2))
} else if (file) {
  // A dump is thousands of statements; a summary is more useful than tables.
  const changes = results.reduce((sum, r) => sum + (r.meta?.changes ?? 0), 0)
  console.log(`ok: ${results.length} statements, ${changes} changes`)
} else {
  for (const statement of results) {
    const { columns = [], rows = [] } = statement.results ?? {}
    if (columns.length === 0) {
      console.log(`ok (${statement.meta?.changes ?? 0} changes)`)
    } else if (rows.length === 0) {
      console.log(`(0 rows) ${columns.join(', ')}`)
    } else {
      console.table(
        rows.map((row) =>
          Object.fromEntries(columns.map((column, i) => [column, row[i]])),
        ),
      )
    }
  }
}
process.exit(0)
