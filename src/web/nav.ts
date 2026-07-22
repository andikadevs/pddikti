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
  { href: '/api/', label: 'Overview' },
  // Absolute so it loads the SPA then routes to the config view from any page.
  { href: '/#/config', label: 'Konfigurasi' },
]
