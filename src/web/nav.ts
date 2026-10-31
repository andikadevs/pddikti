// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Single source of truth for the top-bar brand + nav links, shared by the React SPA
 * header (`web/client/components/Layout.tsx`) and the server-rendered config page
 * (`routes/config.ts`) so navigation is identical everywhere. Pure data, no JSX — safe
 * to import from both client and server code.
 */

export const BRAND = 'PDDikti'

export interface NavLink {
  href: string
  label: string
}

export const NAV_LINKS: readonly NavLink[] = [
  { href: '/', label: 'Beranda' },
  { href: '/api/docs', label: 'API Docs' },
  // Absolute hashes so they load the SPA then route to the view from any page.
  { href: '/#/mcp', label: 'MCP Docs' },
  { href: '/api/', label: 'Overview' },
  { href: '/#/config', label: 'Konfigurasi' },
]
