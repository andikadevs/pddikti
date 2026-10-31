// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { SiteLayout } from '@/components/layout/site-layout'
import { ConfigPage } from '@/features/config/config-page'
import { HomePage } from '@/features/home/home-page'
import { McpDocsPage } from '@/features/mcp-docs/mcp-docs-page'
import { PtProfilePage } from '@/features/pt-profile/pt-profile-page'
import { useRoute } from '@/hooks/use-route'
import { routePath, type Route } from '@/lib/navigation'

function RouteView({ route }: { route: Route }) {
  switch (route.name) {
    case 'profile':
      // Keyed by id so switching universities resets every section's state.
      return <PtProfilePage key={route.id} id={route.id} />
    case 'mcp':
      return <McpDocsPage />
    case 'config':
      return <ConfigPage />
    case 'home':
      return <HomePage />
  }
}

/** Root component: the shared layout around the view for the current route. */
export function App() {
  const route = useRoute()
  return (
    <SiteLayout activeHref={routePath(route)}>
      <RouteView route={route} />
    </SiteLayout>
  )
}
