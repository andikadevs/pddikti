// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

/** The SPA's current view, derived from the URL hash. */
export type Route =
  | { name: 'home' }
  | { name: 'profile'; id: string }
  | { name: 'mcp' }
  | { name: 'config' }

const PROFILE_PREFIX = '#/pt/'

function decode(raw: string): string {
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

/** Parse a location hash into a route. Unknown hashes fall back to home. */
export function parseRoute(hash: string): Route {
  if (hash === '#/mcp') return { name: 'mcp' }
  if (hash === '#/config') return { name: 'config' }
  if (hash.startsWith(PROFILE_PREFIX) && hash.length > PROFILE_PREFIX.length) {
    return { name: 'profile', id: decode(hash.slice(PROFILE_PREFIX.length)) }
  }
  return { name: 'home' }
}

/** Hash link to a university profile. */
export function profileHref(id: string): string {
  return `${PROFILE_PREFIX}${encodeURIComponent(id)}`
}

/** The nav link that represents a route, used to mark the active link. */
export function routeHref(route: Route): string {
  if (route.name === 'mcp') return '/#/mcp'
  if (route.name === 'config') return '/#/config'
  return '/'
}
