import { describe, expect, it } from 'vitest'
import { publicPageHeaders } from '@/utils/cacheControl'
import { withPageCacheHeaders } from './cache'

function page(
  path: string,
  requestInit?: RequestInit,
  responseInit?: ResponseInit,
) {
  const headers = new Headers(publicPageHeaders())
  headers.set('content-type', 'text/html; charset=utf-8')
  new Headers(responseInit?.headers).forEach((value, name) => {
    headers.set(name, value)
  })
  return withPageCacheHeaders(
    new Request(`https://photos.example${path}`, requestInit),
    new Response('<html>Photos</html>', {
      ...responseInit,
      headers,
    }),
  )
}

describe('page cache headers', () => {
  it('honors public route headers regardless of the URL', async () => {
    const response = page('/any-public-route')
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=0, s-maxage=60, must-revalidate',
    )
    expect(response.headers.get('vary')).toBe('Cookie, Authorization')
    expect(await response.text()).toBe('<html>Photos</html>')
  })

  it('defaults to no-store when a route does not opt into caching', () => {
    const response = withPageCacheHeaders(
      new Request('https://photos.example/'),
      new Response('<html>Photos</html>', {
        headers: { 'content-type': 'text/html' },
      }),
    )
    expect(response.headers.get('cache-control')).toBe('private, no-store')
  })

  it.each([
    { cookie: 'photos_session=admin' },
    { cookie: 'photos_session=expired' },
    { cookie: 'other=value' },
    { authorization: 'Bearer token' },
  ])('does not store personalized requests: %j', (headers) => {
    expect(
      page('/albums/draft', { headers }).headers.get('cache-control'),
    ).toBe('private, no-store')
  })

  it('does not store responses that set cookies, even with existing public headers', () => {
    const response = page('/', undefined, {
      headers: {
        'set-cookie': 'photos_session=new',
        'cache-control': 'public',
      },
    })
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(response.headers.get('set-cookie')).toBe('photos_session=new')
  })

  it.each([302, 404, 500])('does not store status %s', (status) => {
    expect(page('/', undefined, { status }).headers.get('cache-control')).toBe(
      'private, no-store',
    )
  })

  it('does not cache mutations or non-HTML responses', () => {
    expect(page('/', { method: 'POST' }).headers.get('cache-control')).toBe(
      'private, no-store',
    )
    expect(
      page('/', undefined, {
        headers: { 'content-type': 'application/json' },
      }).headers.get('cache-control'),
    ).toBe('private, no-store')
  })

  it('handles HEAD and preserves existing restrictive cache and Vary headers', () => {
    const response = page(
      '/',
      { method: 'HEAD' },
      {
        headers: {
          'cache-control': 'no-store',
          vary: 'Accept-Encoding, Cookie',
        },
      },
    )
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('vary')).toBe(
      'Accept-Encoding, Cookie, Authorization',
    )
  })

  it('preserves redirect status and location', () => {
    const response = withPageCacheHeaders(
      new Request('https://photos.example/login'),
      Response.redirect('https://photos.example/admin'),
    )
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe(
      'https://photos.example/admin',
    )
    expect(response.headers.get('cache-control')).toBe('private, no-store')
  })
})
