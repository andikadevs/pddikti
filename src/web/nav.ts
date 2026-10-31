// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Single source of truth for the top-bar brand + nav links used by the SPA header
 * (`web/client/components/layout/site-header.tsx`). SPA paths (`/`, `/mcp/docs`,
 * `/config`) navigate in-app; the others are server pages. Pure data, no JSX.
 */

export const BRAND = 'PDDikti'

/** Paths the SPA renders. The server serves the HTML shell on each; the client routes on them. */
export const APP_PATHS = {
  home: '/',
  mcpDocs: '/mcp/docs',
  config: '/config',
  profilePrefix: '/pt/',
} as const

export interface NavLink {
  href: string
  label: string
}

export const NAV_LINKS: readonly NavLink[] = [
  { href: APP_PATHS.home, label: 'Beranda' },
  { href: '/api/docs', label: 'API Docs' },
  { href: APP_PATHS.mcpDocs, label: 'MCP Docs' },
  { href: '/api/', label: 'Overview' },
  { href: APP_PATHS.config, label: 'Konfigurasi' },
]
