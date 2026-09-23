/** Apply the page policy after Start has merged route and session headers. */
export function withPageCacheHeaders(request: Request, response: Response) {
  const isHtml = response.headers
    .get('content-type')
    ?.toLowerCase()
    .startsWith('text/html')
  const canCache =
    response.headers.has('cache-control') &&
    isHtml &&
    (request.method === 'GET' || request.method === 'HEAD') &&
    response.status === 200 &&
    !request.headers.has('cookie') &&
    !request.headers.has('authorization') &&
    !response.headers.has('set-cookie')

  // Keep the body streaming and copy headers (redirect responses can be immutable).
  const result = new Response(response.body, response)
  if (!canCache) {
    // Includes draft previews, auth/admin pages, server functions and errors.
    result.headers.set('cache-control', 'private, no-store')
  }

  if (isHtml) {
    const vary = result.headers.get('vary')
    const fields = vary?.split(',').map((field) => field.trim().toLowerCase())
    if (!fields?.includes('*')) {
      for (const field of ['Cookie', 'Authorization']) {
        if (!fields?.includes(field.toLowerCase())) {
          result.headers.append('vary', field)
        }
      }
    }
  }
  return result
}
