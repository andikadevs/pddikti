// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Encode a single URL path segment.
 * Decodes first so an already-encoded value is not double-encoded, then encodes.
 * `=` is kept literal: the upstream's opaque ids are base64url with `=` padding and
 * the API rejects the percent-encoded form (`%3D`) as an "invalid id". `=` is a legal
 * path character (RFC 3986), and browsers send these ids raw.
 */
export function quoteSegment(value: string): string {
  let decoded = value
  try {
    decoded = decodeURIComponent(value)
  } catch {
    // value was not valid percent-encoding; encode it as-is
    decoded = value
  }
  return encodeURIComponent(decoded).replace(/%3D/g, '=')
}
