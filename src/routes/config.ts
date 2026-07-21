import { OpenAPIHono } from '@hono/zod-openapi'
import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { loadConfig } from '../config.ts'
import { getUpstream } from '../lib/client.ts'
import {
  loadRuntimeConfig,
  resolveUpstreamOptions,
  saveRuntimeConfig,
} from '../lib/runtime-config.ts'
import { constantTimeEqual, signSession, verifySession } from '../lib/session.ts'
import type { AppEnv } from '../types.ts'

/**
 * Operator config page at `/config`, gated by CONFIG_PASSWORD. Lets an operator paste
 * fresh upstream settings (Cloudflare `cf_clearance` + User-Agent, base URL, timeout)
 * that override env at runtime and persist to CONFIG_STORE_PATH. Server-rendered HTML,
 * no JSX, no client JS (native form POST). Disabled (404) when CONFIG_PASSWORD is empty.
 */

const CONFIG_COOKIE = 'pddikti_config'

function nowS(): number {
  return Math.floor(Date.now() / 1000)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function isAuthed(c: Context<AppEnv>): boolean {
  const password = loadConfig().CONFIG_PASSWORD
  if (password === '') return false
  const cookie = getCookie(c, CONFIG_COOKIE)
  return cookie !== undefined && verifySession(cookie, password, nowS())
}

/** Reject cross-origin POSTs (defense-in-depth atop sameSite=Lax). */
function sameOrigin(c: Context<AppEnv>): boolean {
  const base = loadConfig().PUBLIC_BASE_URL
  const origin = c.req.header('origin')
  if (origin !== undefined) return origin === base
  const referer = c.req.header('referer')
  if (referer !== undefined) return referer.startsWith(`${base}/`)
  return true // no Origin/Referer (e.g. tests / curl) — allowed
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
  return `•••• saved (…${tail})`
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

const PAGE_CSS = `
  *{box-sizing:border-box}body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;background:#F7F9FC;color:#1A2433}
  .bar{background:#0B2A5B;color:#fff;padding:14px 20px;font-weight:700;letter-spacing:.03em}
  .wrap{max-width:720px;margin:28px auto;padding:0 20px}
  .card{background:#fff;border:1px solid #e3e9f2;padding:24px}
  h1{font-size:20px;margin:0 0 4px}.sub{color:#5b6b82;font-size:13px;margin:0 0 20px}
  label{display:block;font-size:13px;font-weight:600;margin:16px 0 6px}
  .hint{font-weight:400;color:#5b6b82}
  input[type=text],input[type=password],textarea{width:100%;padding:10px;border:1px solid #e3e9f2;background:#fff;font-size:13px;font-family:inherit;outline:none}
  input:focus,textarea:focus{border-color:#1E4D8C}
  textarea{min-height:90px;resize:vertical}
  button{margin-top:20px;background:#0B2A5B;color:#fff;border:0;padding:11px 20px;font-size:14px;font-weight:600;cursor:pointer}
  button:hover{background:#1E4D8C}
  .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  .note{padding:10px 12px;font-size:13px;margin-bottom:16px;border-left:3px solid}
  .ok{background:#eefaf0;border-color:#2e7d4f;color:#1c5233}
  .err{background:#fdecea;border-color:#9a3b2f;color:#7a2b22}
  .muted{color:#5b6b82;font-size:12px;margin-top:4px}
  form.inline{display:inline}
`

function shell(title: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex, nofollow"/>
<title>${escapeHtml(title)}</title><style>${PAGE_CSS}</style></head>
<body><div class="bar">PDDikti · Konfigurasi</div><div class="wrap"><div class="card">${body}</div></div></body></html>`
}

function loginPage(error?: string): string {
  const note = error ? `<div class="note err">${escapeHtml(error)}</div>` : ''
  return shell(
    'Login · Konfigurasi',
    `<h1>Masuk</h1><p class="sub">Masukkan kata sandi untuk mengelola konfigurasi upstream.</p>
${note}
<form method="post" action="/config/login">
  <label>Kata sandi</label>
  <input type="password" name="password" autofocus autocomplete="current-password"/>
  <button type="submit">Masuk</button>
</form>`,
  )
}

function configPage(opts: {
  baseUrl: string
  userAgent: string
  timeoutMs: number
  cfMasked: string
  message?: { kind: 'ok' | 'err'; text: string }
}): string {
  const note = opts.message
    ? `<div class="note ${opts.message.kind}">${escapeHtml(opts.message.text)}</div>`
    : ''
  const cfPlaceholder = opts.cfMasked === '' ? 'cf_clearance=… (belum diatur)' : opts.cfMasked
  return shell(
    'Konfigurasi Upstream',
    `<h1>Konfigurasi Upstream</h1>
<p class="sub">Upstream PDDikti di balik Cloudflare. Tempel <code>cf_clearance</code> + User-Agent yang cocok. Nilai kosong = tidak diubah.</p>
${note}
<form method="post" action="/config">
  <label>Base URL <span class="hint">(kosong = pakai default env)</span></label>
  <input type="text" name="baseUrl" value="${escapeHtml(opts.baseUrl)}" placeholder="https://pddikti.kemdiktisaintek.go.id/api"/>

  <label>User-Agent</label>
  <input type="text" name="userAgent" value="${escapeHtml(opts.userAgent)}" placeholder="Mozilla/5.0 …"/>

  <label>cf_clearance <span class="hint">(kosong = pertahankan yang tersimpan)</span></label>
  <input type="password" name="cfClearance" placeholder="${escapeHtml(cfPlaceholder)}" autocomplete="off"/>
  <div class="muted">${escapeHtml(opts.cfMasked || 'Belum ada token tersimpan.')}</div>

  <label>Timeout (ms)</label>
  <input type="text" name="timeoutMs" value="${escapeHtml(String(opts.timeoutMs))}"/>

  <label>Atau tempel "Copy as cURL" <span class="hint">(otomatis ambil cf_clearance + UA)</span></label>
  <textarea name="curl" placeholder="curl 'https://pddikti.kemdiktisaintek.go.id/api/...' -b 'cf_clearance=…' -H 'user-agent: …'"></textarea>

  <div class="row">
    <button type="submit">Simpan</button>
  </div>
</form>
<form class="inline" method="post" action="/config/test"><button type="submit" style="background:#1E4D8C">Tes koneksi</button></form>
<form class="inline" method="post" action="/config/logout"><button type="submit" style="background:#5b6b82">Keluar</button></form>`,
  )
}

function currentView(message?: { kind: 'ok' | 'err'; text: string }): string {
  const opts = resolveUpstreamOptions()
  return configPage({
    baseUrl: opts.baseUrl,
    userAgent: opts.headers['User-Agent'] ?? '',
    timeoutMs: opts.timeoutMs,
    cfMasked: maskSecret(cfClearanceOf(opts.headers['Cookie'])),
    message,
  })
}

const config = new OpenAPIHono<AppEnv>()

// `/config` responses are marked noindex by seoHeaders (see middleware/headers.ts).

config.get('/', (c) => {
  if (loadConfig().CONFIG_PASSWORD === '') return c.notFound()
  return c.html(isAuthed(c) ? currentView() : loginPage())
})

config.post('/login', async (c) => {
  const password = loadConfig().CONFIG_PASSWORD
  if (password === '') return c.notFound()
  if (!sameOrigin(c)) return c.text('Forbidden', 403)
  const body = await c.req.parseBody()
  const supplied = typeof body['password'] === 'string' ? body['password'] : ''
  if (!constantTimeEqual(supplied, password)) {
    return c.html(loginPage('Kata sandi salah.'), 401)
  }
  const exp = nowS() + loadConfig().SESSION_TTL_S
  setCookie(c, CONFIG_COOKIE, signSession(exp, password), {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/config',
    maxAge: loadConfig().SESSION_TTL_S,
    secure: loadConfig().PUBLIC_BASE_URL.startsWith('https'),
  })
  return c.redirect('/config', 303)
})

config.post('/logout', (c) => {
  if (loadConfig().CONFIG_PASSWORD === '') return c.notFound()
  deleteCookie(c, CONFIG_COOKIE, { path: '/config' })
  return c.redirect('/config', 303)
})

config.post('/', async (c) => {
  if (loadConfig().CONFIG_PASSWORD === '') return c.notFound()
  if (!isAuthed(c)) return c.html(loginPage(), 401)
  if (!sameOrigin(c)) return c.text('Forbidden', 403)

  const body = await c.req.parseBody()
  const str = (k: string): string => (typeof body[k] === 'string' ? (body[k] as string).trim() : '')

  const curl = str('curl')
  const parsed = curl ? parseCurl(curl) : {}
  const userAgent = str('userAgent') || parsed.userAgent || ''
  const cfClearance = str('cfClearance') || parsed.cfClearance || ''
  const baseUrl = str('baseUrl')
  const timeoutRaw = str('timeoutMs')

  const patch: {
    baseUrl?: string
    timeoutMs?: number
    headers?: Record<string, string>
  } = {}
  const headers: Record<string, string> = {}
  if (userAgent) headers['User-Agent'] = userAgent
  if (cfClearance) headers['Cookie'] = `cf_clearance=${cfClearance}`
  if (Object.keys(headers).length > 0) patch.headers = headers
  if (baseUrl) patch.baseUrl = baseUrl
  if (timeoutRaw) {
    const n = Number(timeoutRaw)
    if (!Number.isInteger(n) || n <= 0) {
      return c.html(currentView({ kind: 'err', text: 'Timeout harus bilangan bulat positif.' }), 422)
    }
    patch.timeoutMs = n
  }

  try {
    saveRuntimeConfig(patch)
  } catch (err) {
    const text = err instanceof Error ? err.message : 'Gagal menyimpan konfigurasi.'
    return c.html(currentView({ kind: 'err', text }), 422)
  }
  return c.html(currentView({ kind: 'ok', text: 'Konfigurasi tersimpan.' }))
})

config.post('/test', async (c) => {
  if (loadConfig().CONFIG_PASSWORD === '') return c.notFound()
  if (!isAuthed(c)) return c.html(loginPage(), 401)
  if (!sameOrigin(c)) return c.text('Forbidden', 403)

  const result = await getUpstream().get('beranda', { content_limit: '1' })
  const code =
    typeof result === 'object' && result !== null && typeof (result as { code?: unknown }).code === 'number'
      ? (result as { code: number }).code
      : 200
  const msg =
    code === 200
      ? { kind: 'ok' as const, text: 'Koneksi upstream OK (200).' }
      : {
          kind: 'err' as const,
          text: `Upstream mengembalikan ${code}. ${code === 403 ? 'cf_clearance kemungkinan kedaluwarsa — perbarui.' : 'Periksa base URL / ketersediaan.'}`,
        }
  return c.html(currentView(msg))
})

export default config
