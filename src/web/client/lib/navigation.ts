// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { APP_PATHS } from '../../nav.ts'

/** The SPA's current view, derived from the URL path. */
export type Route =
  | { name: 'home' }
  | { name: 'profile'; id: string }
  | { name: 'mcp' }
  | { name: 'config' }

const { home: HOME_PATH, mcpDocs: MCP_DOCS_PATH, config: CONFIG_PATH, profilePrefix: PROFILE_PREFIX } = APP_PATHS

/** Event dispatched after a client-side navigation, so route listeners can update. */
export const NAVIGATE_EVENT = 'app:navigate'

function decode(raw: string): string {
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

/** Parse a URL path into a route. Unknown paths fall back to home. */
export function parseRoute(pathname: string): Route {
  const path = pathname.replace(/\/+$/, '') || HOME_PATH
  if (path === MCP_DOCS_PATH) return { name: 'mcp' }
  if (path === CONFIG_PATH) return { name: 'config' }
  if (path.startsWith(PROFILE_PREFIX) && path.length > PROFILE_PREFIX.length) {
    return { name: 'profile', id: decode(path.slice(PROFILE_PREFIX.length)) }
  }
  return { name: 'home' }
}

/** Path of a university profile. */
export function profilePath(id: string): string {
  return `${PROFILE_PREFIX}${encodeURIComponent(id)}`
}

/** The nav link that represents a route, used to mark the active link. */
export function routePath(route: Route): string {
  if (route.name === 'mcp') return MCP_DOCS_PATH
  if (route.name === 'config') return CONFIG_PATH
  return HOME_PATH
}

/** True when the SPA renders `href` itself (as opposed to server pages like `/api/docs`). */
export function isAppPath(href: string): boolean {
  return href === HOME_PATH || href === MCP_DOCS_PATH || href === CONFIG_PATH || href.startsWith(PROFILE_PREFIX)
}

/** Navigate within the SPA without a page load. */
export function navigate(href: string): void {
  if (href === location.pathname) return
  history.pushState(null, '', href)
  window.dispatchEvent(new Event(NAVIGATE_EVENT))
}

/** Map a pre-history-routing hash URL (`#/pt/<id>`, `#/mcp`, `#/config`) to its path. */
export function legacyHashPath(hash: string): string | null {
  if (hash === '#/mcp') return MCP_DOCS_PATH
  if (hash === '#/config') return CONFIG_PATH
  if (hash.startsWith('#/pt/') && hash.length > 5) return `${PROFILE_PREFIX}${hash.slice(5)}`
  return null
}
