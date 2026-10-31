// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { OpenAPIHono } from '@hono/zod-openapi'
import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { loadConfig } from '../config.ts'
import { getUpstream } from '../lib/client.ts'
import { resolveUpstreamOptions, saveRuntimeConfig } from '../lib/runtime-config.ts'
import { constantTimeEqual, signSession, verifySession } from '../lib/session.ts'
import type { AppEnv } from '../types.ts'

/**
 * JSON config API at `/config/*`, gated by CONFIG_PASSWORD. The UI is a React view at
 * `/config`; these endpoints are its backend. Lets an operator (manually — the
 * FlareSolverr auto-solver is the primary path) set upstream `cf_clearance` + User-Agent,
 * base URL, and timeout, persisted to CONFIG_STORE_PATH and overriding env at runtime.
 * Every route returns JSON; disabled (404) when CONFIG_PASSWORD is empty.
 */

const CONFIG_COOKIE = 'pddikti_config'

function nowS(): number {
  return Math.floor(Date.now() / 1000)
}

function isAuthed(c: Context<AppEnv>): boolean {
  const password = loadConfig().CONFIG_PASSWORD
  if (password === '') return false
  const cookie = getCookie(c, CONFIG_COOKIE)
  return cookie !== undefined && verifySession(cookie, password, nowS())
}

/** Extract the `cf_clearance` value from a full `Cookie` header string, if present. */
function cfClearanceOf(cookieHeader: string | undefined): string {
  if (!cookieHeader) return ''
  const m = /(?:^|;\s*)cf_clearance=([^;]+)/.exec(cookieHeader)
  return m?.[1] ?? ''
}

function maskSecret(value: string): string {
  if (value === '') return ''
  const tail = value.length <= 6 ? value : value.slice(-6)
  return `•••• …${tail}`
}

/** Parse cf_clearance + user-agent out of a pasted "Copy as cURL" command. */
function parseCurl(curl: string): { cfClearance?: string; userAgent?: string } {
  const out: { cfClearance?: string; userAgent?: string } = {}
  const cookie = /(?:-b|--cookie)\s+'([^']*)'/.exec(curl) ?? /(?:-b|--cookie)\s+"([^"]*)"/.exec(curl)
  const cf = cfClearanceOf(cookie?.[1])
  if (cf) out.cfClearance = cf
  const ua =
    /-H\s+'user-agent:\s*([^']*)'/i.exec(curl) ?? /-H\s+"user-agent:\s*([^"]*)"/i.exec(curl)
  if (ua?.[1]) out.userAgent = ua[1].trim()
  return out
}

/** Effective upstream settings for display (secret masked). */
function currentConfig() {
  const opts = resolveUpstreamOptions()
  return {
    baseUrl: opts.baseUrl,
    userAgent: opts.headers['User-Agent'] ?? '',
    cfMasked: maskSecret(cfClearanceOf(opts.headers['Cookie'])),
    timeoutMs: opts.timeoutMs,
  }
}

async function readBody(c: Context<AppEnv>): Promise<Record<string, unknown>> {
  try {
    const body = (await c.req.json()) as unknown
    return typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

const str = (body: Record<string, unknown>, k: string): string =>
  typeof body[k] === 'string' ? (body[k] as string).trim() : ''

const config = new OpenAPIHono<AppEnv>()

config.get('/state', (c) => {
  const cfg = loadConfig()
  if (cfg.CONFIG_PASSWORD === '') return c.json({ enabled: false })
  if (!isAuthed(c)) return c.json({ enabled: true, authed: false })
  return c.json({ enabled: true, authed: true, solverEnabled: cfg.SOLVER_ENABLED, config: currentConfig() })
})

config.post('/login', async (c) => {
  const password = loadConfig().CONFIG_PASSWORD
  if (password === '') return c.notFound()
  const supplied = str(await readBody(c), 'password')
  if (!constantTimeEqual(supplied, password)) {
    return c.json({ ok: false, error: 'Kata sandi salah.' }, 401)
  }
  setCookie(c, CONFIG_COOKIE, signSession(nowS() + loadConfig().SESSION_TTL_S, password), {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/config',
    maxAge: loadConfig().SESSION_TTL_S,
    secure: loadConfig().PUBLIC_BASE_URL.startsWith('https'),
  })
  return c.json({ ok: true })
})

config.post('/logout', (c) => {
  deleteCookie(c, CONFIG_COOKIE, { path: '/config' })
  return c.json({ ok: true })
})

config.post('/save', async (c) => {
  if (loadConfig().CONFIG_PASSWORD === '') return c.notFound()
  if (!isAuthed(c)) return c.json({ ok: false, error: 'Tidak diizinkan.' }, 401)

  const body = await readBody(c)
  const curl = str(body, 'curl')
  const parsed = curl ? parseCurl(curl) : {}
  const userAgent = str(body, 'userAgent') || parsed.userAgent || ''
  const cfClearance = str(body, 'cfClearance') || parsed.cfClearance || ''
  const baseUrl = str(body, 'baseUrl')
  const timeoutRaw = str(body, 'timeoutMs')

  const patch: { baseUrl?: string; timeoutMs?: number; headers?: Record<string, string> } = {}
  const headers: Record<string, string> = {}
  if (userAgent) headers['User-Agent'] = userAgent
  if (cfClearance) headers['Cookie'] = `cf_clearance=${cfClearance}`
  if (Object.keys(headers).length > 0) patch.headers = headers
  if (baseUrl) patch.baseUrl = baseUrl
  if (timeoutRaw) {
    const n = Number(timeoutRaw)
    if (!Number.isInteger(n) || n <= 0) {
      return c.json({ ok: false, error: 'Timeout harus bilangan bulat positif.' }, 422)
    }
    patch.timeoutMs = n
  }

  try {
    saveRuntimeConfig(patch)
  } catch (err) {
    return c.json({ ok: false, error: err instanceof Error ? err.message : 'Gagal menyimpan.' }, 422)
  }
  return c.json({ ok: true, config: currentConfig() })
})

config.post('/test', async (c) => {
  if (loadConfig().CONFIG_PASSWORD === '') return c.notFound()
  if (!isAuthed(c)) return c.json({ ok: false, error: 'Tidak diizinkan.' }, 401)

  const result = await getUpstream().get('beranda', { content_limit: '1' })
  const code =
    typeof result === 'object' && result !== null && typeof (result as { code?: unknown }).code === 'number'
      ? (result as { code: number }).code
      : 200
  return c.json({ ok: code === 200, code })
})

export default config
