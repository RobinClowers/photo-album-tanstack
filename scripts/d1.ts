/**
 * Run SQL against one of the app's D1 databases without ever typing a
 * database name.
 *
 *   bun run db local   "select count(*) from albums"
 *   bun run db staging "select count(*) from albums"
 *   bun run db prod    "select count(*) from albums"
 *   bun run db staging --write "delete from photos where album_id = 5"
 *   bun run db staging --file ./fixup.sql
 *
 * The environment is the first argument and is required; there is no
 * default. Every environment binds its database as `photo_album`, so the
 * wrapper passes the binding name plus `--env` and lets wrangler resolve it,
 * which is how deploys pick their environment too; wrangler prints the
 * database it resolved, with its id. Statements that write (insert, update,
 * delete, drop, alter, create, replace, pragma) need `--write`, and a
 * production write pauses first so a wrong environment can be caught.
 * Wrangler's own confirmation prompts stay in place.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ENVIRONMENTS = {
  local: { label: 'local (.wrangler/state)', args: ['--local'] },
  staging: { label: 'staging', args: ['--env', 'staging', '--remote'] },
  prod: { label: 'PRODUCTION', args: ['--remote'] },
} as const
type EnvName = keyof typeof ENVIRONMENTS

const BINDING = 'photo_album'
const WRITE_STATEMENT =
  /\b(insert|update|delete|drop|alter|create|replace|truncate|pragma|vacuum)\b/i

function usage(message?: string): never {
  if (message) console.error(`error: ${message}\n`)
  console.error(
    'usage: bun run db <local|staging|prod> [--write] [--json] (<sql> | --file <path>)',
  )
  process.exit(2)
}

const [envName, ...rest] = process.argv.slice(2)
if (!envName || !(envName in ENVIRONMENTS)) {
  usage(`first argument must be one of ${Object.keys(ENVIRONMENTS).join(', ')}`)
}
const environment = ENVIRONMENTS[envName as EnvName]

let write = false
let json = false
let file: string | undefined
const positional: string[] = []
for (let i = 0; i < rest.length; i++) {
  const arg = rest[i] as string
  if (arg === '--write') write = true
  else if (arg === '--json') json = true
  else if (arg === '--file') file = rest[++i]
  else positional.push(arg)
}
// Wrangler is spawned with the repo as its cwd, so a relative path given from
// elsewhere has to be made absolute before both sides read it.
if (file !== undefined) file = resolve(file)
const sql = file ? readFileSync(file, 'utf8') : positional.join(' ')
if (!sql.trim()) usage('no SQL given')

if (WRITE_STATEMENT.test(sql) && !write) {
  usage(
    `that SQL writes to the ${environment.label} database; add --write if you mean it`,
  )
}

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')
const wrangler = join(repo, 'node_modules', '.bin', 'wrangler')
if (!existsSync(wrangler)) usage('wrangler is not installed; run bun install')

// Bun auto-loads .env.development, whose placeholder CLOUDFLARE_ACCOUNT_ID
// would otherwise send wrangler to account "your_account_id_here".
const env = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key, value]) => value !== undefined && !key.startsWith('CLOUDFLARE_'),
  ),
) as NodeJS.ProcessEnv

// Wrangler itself prints "Executing on remote database <binding> (<id>)".
if (write && envName === 'prod') {
  console.error('WRITING TO PRODUCTION in 5 seconds; Ctrl-C to abort.')
  spawnSync('sleep', ['5'], { stdio: 'inherit' })
}

const result = spawnSync(
  wrangler,
  [
    'd1',
    'execute',
    BINDING,
    ...environment.args,
    ...(json ? ['--json'] : []),
    ...(file ? ['--file', file] : ['--command', sql]),
  ],
  { cwd: repo, env, stdio: 'inherit' },
)
process.exit(result.status ?? 1)
