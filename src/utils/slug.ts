/**
 * URL slug for an album title: ASCII lowercase words joined by single
 * dashes, matching the style of the existing slugs (e.g. "san-cristobal-2019").
 */
export function slugify(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug)
}
