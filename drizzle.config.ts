import { defineConfig } from 'drizzle-kit'

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: requireEnv('CLOUDFLARE_ACCOUNT_ID'),
    databaseId: requireEnv('D1_DATABASE_ID'),
    token: requireEnv('CLOUDFLARE_D1_TOKEN'),
  },
  verbose: true,
  strict: true,
})
