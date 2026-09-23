/** Browsers revalidate; shared caches can reuse public pages for one minute.
 * No stale serving, so publishing/unpublishing has a bounded delay.
 * The server response policy disables caching for authenticated requests.
 */
export function publicPageHeaders() {
  return {
    'Cache-Control': 'public, max-age=0, s-maxage=60, must-revalidate',
  }
}
