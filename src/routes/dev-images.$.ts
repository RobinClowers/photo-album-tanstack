import { env } from 'cloudflare:workers'
import { createFileRoute } from '@tanstack/react-router'

const PRODUCTION_IMAGES = 'https://img.robinclowers.com/'

/**
 * Development only: serve photo objects from the emulated R2 bucket so that
 * photos imported or reprocessed locally show up in the admin and public
 * pages, which otherwise point at the production image domain. Keys the
 * local bucket does not have (every legacy photo) are redirected there, so
 * the rest of the site keeps rendering. `.env.development` sets
 * VITE_PHOTO_BASE_URL to this route; deployed builds never do, and the
 * handler refuses to serve anything outside dev regardless.
 */
export const Route = createFileRoute('/dev-images/$')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!import.meta.env.DEV) return new Response(null, { status: 404 })
        const key = params._splat ?? ''
        if (!key || key.includes('..')) {
          return new Response(null, { status: 400 })
        }
        const object = await env.PHOTOS.get(key)
        if (!object) {
          return new Response(null, {
            status: 302,
            headers: { location: `${PRODUCTION_IMAGES}${key}` },
          })
        }
        const headers = new Headers()
        object.writeHttpMetadata(headers)
        headers.set('content-length', String(object.size))
        headers.set('etag', object.httpEtag)
        // Variants are rewritten in place by a reprocess; do not cache in dev.
        headers.set('cache-control', 'no-store')
        return new Response(object.body, { headers })
      },
    },
  },
})
