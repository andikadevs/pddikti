/**
 * Encode a single URL path segment.
 * Decodes first so an already-encoded value is not double-encoded, then encodes
 * fully (no characters left "safe"), matching the legacy quote(unquote(v), safe="").
 */
export function quoteSegment(value: string): string {
  let decoded = value
  try {
    decoded = decodeURIComponent(value)
  } catch {
    // value was not valid percent-encoding; encode it as-is
    decoded = value
  }
  return encodeURIComponent(decoded)
}
