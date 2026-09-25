import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'
import { withPageCacheHeaders } from '@/server/cache'
import {
  handlePhotoQueue,
  type PhotoQueueMessage,
} from '@/server/pipeline/queue'
import { sweepStaleItems } from '@/server/pipeline/sweeper'

/**
 * Worker entry. TanStack Start's default entry only exports `fetch`; the
 * image pipeline also needs the Queues consumer and the cron sweeper, so this
 * file replaces it (wrangler.jsonc `main`). TanStack picks it up as the
 * server entry by its `src/server.ts` location.
 */
const startFetch = createStartHandler(defaultStreamHandler)

export default {
  // Start's handler takes (request, opts); Workers pass (request, env, ctx).
  fetch: async (request: Request) =>
    withPageCacheHeaders(request, await startFetch(request)),
  queue: (batch: MessageBatch<PhotoQueueMessage>, env: Env) =>
    handlePhotoQueue(batch, env),
  scheduled: (_controller: ScheduledController, env: Env) =>
    sweepStaleItems(env),
} satisfies ExportedHandler<Env, PhotoQueueMessage>
