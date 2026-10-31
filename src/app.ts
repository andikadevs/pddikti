// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { setCookie } from 'hono/cookie'
import { loadConfig } from './config.ts'
import { apiKey, SESSION_COOKIE } from './middleware/api-key.ts'
import { availability } from './middleware/availability.ts'
import { seoHeaders } from './middleware/headers.ts'
import { requestIdentity } from './middleware/request-identity.ts'
import { signSession } from './lib/session.ts'
import mcpHttp from './mcp/http.ts'
import { getToolCatalog } from './mcp/catalog.ts'
import configApi from './routes/config.ts'
import dosen from './routes/dosen.ts'
import mahasiswa from './routes/mahasiswa.ts'
import overview from './routes/overview.ts'
import prodiBidangIlmu from './routes/prodi-bidang-ilmu.ts'
import prodi from './routes/prodi.ts'
import pt from './routes/pt.ts'
import search from './routes/search.ts'
import stats from './routes/stats.ts'
import { getClientFavicon, getClientHtml, getClientScript, getClientStyles } from './web/client-bundle.ts'
import seo from './web/seo.ts'
import type { AppEnv } from './types.ts'

const OPENAPI_PATH = '/openapi.json'
const REDOC_HTML = `<!doctype html>
<html>
  <head>
    <title>PDDikti API — ReDoc</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>body { margin: 0; }</style>
  </head>
  <body>
    <redoc spec-url="/api/openapi.json"></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  </body>
</html>`

/** Build the API sub-app (mounted at /api): all route groups + docs. */
function buildApiApp(): OpenAPIHono<AppEnv> {
  const config = loadConfig()
  const api = new OpenAPIHono<AppEnv>()

  api.route('/', overview)
  api.route('/', search)
  api.route('/', pt)
  api.route('/', prodi)
  api.route('/', dosen)
  api.route('/', mahasiswa)
  api.route('/', stats)
  api.route('/', prodiBidangIlmu)

  // Expose an X-API-Key scheme so Swagger UI shows an "Authorize" button. The key
  // is sent in the X-API-Key header (see middleware/api-key.ts). Require it globally
  // only when auth is enabled; docs/overview ignore it regardless.
  api.openAPIRegistry.registerComponent('securitySchemes', 'ApiKeyAuth', {
    type: 'apiKey',
    in: 'header',
    name: 'X-API-Key',
  })

  api.doc(OPENAPI_PATH, {
    openapi: '3.1.0',
    info: {
      title: 'PDDikti API',
      version: config.API_VERSION,
      description:
        'Structured proxy API for Indonesia higher-education data (PDDikti): ' +
        'universities, study programs, lecturers, students, and statistics.',
    },
    servers: [{ url: `${config.PUBLIC_BASE_URL}/api` }],
    ...(config.API_KEY !== '' ? { security: [{ ApiKeyAuth: [] }] } : {}),
  })

  api.get('/docs', swaggerUI({ url: '/api/openapi.json' }))
  api.get('/redoc', (c) => c.html(REDOC_HTML))

  return api
}

/** Build the root application with middleware, /api mount, and SEO routes. */
export function buildApp(): OpenAPIHono<AppEnv> {
  const app = new OpenAPIHono<AppEnv>()

  app.use('*', logger())
  app.use('*', requestId())
  app.use('*', cors())
  app.use('*', secureHeaders())
  app.use('*', prettyJSON())
  app.use('*', requestIdentity)
  app.use('*', seoHeaders)
  app.use('*', availability)
  app.use('*', apiKey)

  // React SPA (PT profile explorer) at the root, bundled natively via Bun.build. When auth
  // is on, mint an httpOnly session cookie so the same-origin SPA can call /api/*
  // without ever holding the API key in JS.
  app.get('/', async (c) => {
    const config = loadConfig()
    if (config.API_KEY !== '') {
      const exp = Math.floor(Date.now() / 1000) + config.SESSION_TTL_S
      setCookie(c, SESSION_COOKIE, signSession(exp, config.API_KEY), {
        httpOnly: true,
        sameSite: 'Lax',
        path: '/',
        maxAge: config.SESSION_TTL_S,
        secure: config.PUBLIC_BASE_URL.startsWith('https'),
      })
    }
    return c.html(await getClientHtml())
  })
  app.get('/app.js', async (c) => {
    const script = await getClientScript()
    return c.body(script, 200, { 'Content-Type': 'text/javascript; charset=utf-8' })
  })
  app.get('/app.css', async (c) => {
    const styles = await getClientStyles()
    return c.body(styles, 200, { 'Content-Type': 'text/css; charset=utf-8' })
  })
  app.get('/favicon.ico', async (c) =>
    c.body(await getClientFavicon(), 200, {
      'Content-Type': 'image/x-icon',
      'Cache-Control': 'public, max-age=86400',
    }),
  )

  app.route('/api', buildApiApp())
  // Hono mounts a sub-app's "/" route at "/api" (no trailing slash); also serve
  // the documented "/api/" overview URL by mounting the overview module there.
  app.route('/api/', overview)
  // MCP tool catalog (JSON) — the MCP analogue of /api/openapi.json; backs the docs view.
  app.get('/mcp/tools', async (c) => c.json(await getToolCatalog()))
  // Stateless MCP (Streamable HTTP) for AI agents; self-gated by X-API-Key.
  app.route('/mcp', mcpHttp)
  // JSON config API (password-gated); the UI is a React view at /#/config.
  app.route('/config', configApi)
  app.route('/', seo)

  return app
}
