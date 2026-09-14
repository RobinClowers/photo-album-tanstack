/**
 * Letters that NFKD leaves alone because they have no canonical
 * decomposition, so stripping combining marks would drop them entirely
 * ('Ærø' -> 'r', 'Straße' -> 'stra-e'). Keys are lowercase; slugify
 * lowercases before looking them up, which covers Æ/Ø/Ł/Đ/Œ/Þ/ẞ too.
 */
const TRANSLITERATIONS: Record<string, string> = {
  æ: 'ae',
  œ: 'oe',
  ø: 'o',
  ß: 'ss',
  ł: 'l',
  đ: 'd',
  ð: 'd',
  þ: 'th',
  ħ: 'h',
  ŧ: 't',
  ı: 'i',
  ŋ: 'ng',
}

const TRANSLITERATION_PATTERN = new RegExp(
  `[${Object.keys(TRANSLITERATIONS).join('')}]`,
  'g',
)

/**
 * URL slug for an album title: ASCII lowercase words joined by single
 * dashes, matching the style of the existing slugs (e.g. "san-cristobal-2019").
 */
export function slugify(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics
    .toLowerCase()
    .replace(TRANSLITERATION_PATTERN, (char) => TRANSLITERATIONS[char] ?? char)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug)
}
