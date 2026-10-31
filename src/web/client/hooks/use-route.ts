// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useEffect, useState } from 'react'
import { parseRoute, type Route } from '@/lib/navigation'
import { withViewTransition } from '@/lib/view-transition'

/** Current hash route; re-renders on `hashchange`, animated with a View Transition. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(location.hash))
  useEffect(() => {
    const onChange = () =>
      withViewTransition(() => {
        setRoute(parseRoute(location.hash))
        window.scrollTo({ top: 0 })
      })
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
