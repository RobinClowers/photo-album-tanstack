import { defineConfig } from 'drizzle-kit'

/**
 * `drizzle-kit generate` only needs the schema, so credentials are attached
 * lazily: commands that talk to D1 over HTTP (`db:studio`, `push`, `pull`)
 * require the three variables below (see .env.example), everything else runs
 * offline.
 */
function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

const hasD1Credentials = Boolean(
  process.env.CLOUDFLARE_ACCOUNT_ID &&
    process.env.D1_DATABASE_ID &&
    process.env.CLOUDFLARE_D1_TOKEN,
)

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'd1-http',
  ...(hasD1Credentials
    ? {
        dbCredentials: {
          accountId: requireEnv('CLOUDFLARE_ACCOUNT_ID'),
          databaseId: requireEnv('D1_DATABASE_ID'),
          token: requireEnv('CLOUDFLARE_D1_TOKEN'),
        },
      }
    : {}),
  verbose: true,
  strict: true,
})
