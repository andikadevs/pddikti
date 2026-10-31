// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useEffect, useState } from 'react'

/** The SPA's current view, derived from the URL hash. */
export type Route =
  | { name: 'config' }
  | { name: 'mcp' }
  | { name: 'profile'; id: string }
  | { name: 'landing' }

const PT_PREFIX = '#/pt/'

function readRoute(): Route {
  const h = typeof location === 'undefined' ? '' : location.hash
  if (h === '#/config') return { name: 'config' }
  if (h === '#/mcp') return { name: 'mcp' }
  if (h.startsWith(PT_PREFIX)) {
    const raw = h.slice(PT_PREFIX.length)
    if (raw !== '') {
      try {
        return { name: 'profile', id: decodeURIComponent(raw) }
      } catch {
        return { name: 'profile', id: raw }
      }
    }
  }
  return { name: 'landing' }
}

/** Current hash route; re-renders on `hashchange`. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(readRoute)
  useEffect(() => {
    const onChange = () => setRoute(readRoute())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
