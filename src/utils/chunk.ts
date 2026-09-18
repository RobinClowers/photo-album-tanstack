/**
 * Consecutive slices of at most `size` items (the last may be shorter), for
 * APIs with a per-call cap: Queues sendBatch, S3 DeleteObjects, D1 bound
 * parameters.
 */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError(`chunk size must be a positive integer, got ${size}`)
  }
  const slices: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    slices.push(items.slice(i, i + size))
  }
  return slices
}
