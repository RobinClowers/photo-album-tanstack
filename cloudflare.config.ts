/**
 * Cloudflare (cf CLI) configuration, loaded by @cloudflare/vite-plugin and cf.
 *
 * Two modes, selected by Vite's `--mode` at build time (`cf deploy --mode`
 * does not work with Vite; deploys are `vite build` + `cf deploy --prebuilt`):
 *   - default (production, and `vite dev`): served at photos.robinclowers.com
 *   - "staging": deployed with `bun run deploy:staging` to a workers.dev URL,
 *     backed by its own D1 database (a copy of production data).
 *
 * Both modes are built by `workerConfig`, so bindings, vars and secrets are
 * declared once and only the resource names differ. Secrets are declared with
 * `bindings.secret()`, set per deployed Worker (`cf workers secrets`), and
 * read locally from .dev.vars.
 *
 * D1 migrations are not part of this config: `cf d1 migrations apply` takes
 * the database id and `--dir drizzle` (see the `db:*` scripts and
 * `D1_DATABASES` in config/d1.ts).
 */
import { bindings, defineConfig, triggers } from 'cf/config'
import { D1_DATABASES, type D1Environment } from './config/d1.ts'

interface Resources {
  name: string
  database: D1Environment
  bucket: string
  queue: string
}

const RESOURCES = {
  production: {
    name: 'photo-album-tanstack',
    database: 'production',
    bucket: 'robin-photos',
    queue: 'photo-album-photos',
  },
  staging: {
    name: 'photo-album-tanstack-staging',
    database: 'staging',
    bucket: 'robin-photos-staging',
    queue: 'photo-album-photos-staging',
  },
} satisfies Record<string, Resources>

function workerConfig(resources: Resources) {
  return {
    name: resources.name,
    compatibilityDate: '2025-09-02',
    compatibilityFlags: ['nodejs_compat'],
    // Custom entry: TanStack Start's fetch handler plus the queue consumer and
    // cron sweeper for the image pipeline (see src/server.ts).
    entrypoint: './src/server.ts',
    observability: {
      logs: { enabled: true, invocationLogs: true },
      traces: { enabled: false },
    },
    triggers: [
      // Sweeper: re-enqueue items whose queue message was lost or expired.
      triggers.scheduled({ schedule: '*/10 * * * *' }),
      // One message per import item. Consumer runs one message at a time
      // with modest concurrency so a run stays within the free-plan CPU
      // allowance (see README, "Image pipeline"). Retries are driven from D1
      // state (import_items.attempts), so the platform retry count is a
      // backstop.
      triggers.queue({
        name: resources.queue,
        maxBatchSize: 1,
        maxBatchTimeout: 0,
        maxRetries: 5,
        maxConcurrency: 2,
        deadLetterQueue: `${resources.queue}-dlq`,
      }),
    ],
    env: {
      ADMIN_EMAILS: bindings.text('robin.clowers@gmail.com'),
      GOOGLE_CLIENT_ID: bindings.secret(),
      GOOGLE_CLIENT_SECRET: bindings.secret(),
      SESSION_SECRET: bindings.secret(),
      TOKEN_ENCRYPTION_KEY: bindings.secret(),
      photo_album: bindings.d1(D1_DATABASES[resources.database]),
      // Photo objects, <album-slug>/<size>/<filename>. Served publicly
      // through the bucket's custom domain (VITE_PHOTO_BASE_URL); the Worker
      // writes via the binding.
      PHOTOS: bindings.r2({ name: resources.bucket }),
      PHOTO_QUEUE: bindings.queue({ name: resources.queue }),
      // Cloudflare Images: resizes variants in Cloudflare's image service,
      // not in the Worker's CPU budget. Local dev is low fidelity (resize
      // only).
      IMAGES: bindings.images({}),
    },
  }
}

export default defineConfig((ctx) => {
  switch (ctx.mode) {
    case 'staging':
      // No custom domain: staging must never claim photos.robinclowers.com.
      return {
        worker: { ...workerConfig(RESOURCES.staging), workersDev: true },
      }
    default:
      return {
        worker: {
          ...workerConfig(RESOURCES.production),
          domains: ['photos.robinclowers.com'],
        },
      }
  }
})
