// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Hono } from 'hono'
import { loadConfig } from '../config.ts'
import type { AppEnv } from '../types.ts'

const seo = new Hono<AppEnv>()

/** Public, indexable pages listed in the sitemap. */
const SITEMAP_PATHS = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/api/', priority: '0.9', changefreq: 'daily' },
  { path: '/api/docs', priority: '0.8', changefreq: 'weekly' },
  { path: '/api/redoc', priority: '0.7', changefreq: 'weekly' },
] as const

seo.get('/robots.txt', (c) => {
  const { PUBLIC_BASE_URL } = loadConfig()
  const body = ['User-agent: *', 'Allow: /', '', `Sitemap: ${PUBLIC_BASE_URL}/sitemap.xml`, ''].join('\n')
  return c.text(body, 200, { 'Content-Type': 'text/plain; charset=utf-8' })
})

seo.get('/sitemap.xml', (c) => {
  const config = loadConfig()
  const lastmod = config.LAST_UPDATE.split('T')[0] ?? config.LAST_UPDATE
  const urls = SITEMAP_PATHS.map(
    ({ path, priority, changefreq }) =>
      `  <url>\n` +
      `    <loc>${config.PUBLIC_BASE_URL}${path}</loc>\n` +
      `    <lastmod>${lastmod}</lastmod>\n` +
      `    <changefreq>${changefreq}</changefreq>\n` +
      `    <priority>${priority}</priority>\n` +
      `  </url>`,
  ).join('\n')
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  return c.text(xml, 200, { 'Content-Type': 'application/xml; charset=utf-8' })
})

export default seo
