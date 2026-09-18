/**
 * A route param that must be a positive integer database id.
 *
 * `Number()` alone accepts '0', '-1', '1e300', '0x10' and ' 1 ', which either
 * alias a real row or blow up in the server's zod validation (rendering a raw
 * ZodError instead of the not-found page). Only plain digits without a leading
 * zero are a valid id.
 */
export function parseRecordId(raw: string): number | null {
  if (!/^[1-9][0-9]*$/.test(raw)) return null
  const id = Number(raw)
  return Number.isSafeInteger(id) ? id : null
}
