// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useEffect, useState } from 'react'
import { legacyHashPath, NAVIGATE_EVENT, parseRoute, type Route } from '@/lib/navigation'
import { withViewTransition } from '@/lib/view-transition'

function currentRoute(): Route {
  // Old shared links used hash routes; rewrite them to the equivalent path in place.
  const legacy = legacyHashPath(location.hash)
  if (legacy) history.replaceState(null, '', legacy)
  return parseRoute(location.pathname)
}

/** Current route from the URL path; updates on back/forward and in-app navigation. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(currentRoute)
  useEffect(() => {
    const onChange = () =>
      withViewTransition(() => {
        setRoute(currentRoute())
        window.scrollTo({ top: 0 })
      })
    window.addEventListener('popstate', onChange)
    window.addEventListener(NAVIGATE_EVENT, onChange)
    return () => {
      window.removeEventListener('popstate', onChange)
      window.removeEventListener(NAVIGATE_EVENT, onChange)
    }
  }, [])
  return route
}
