import { beforeEach, describe, expect, test } from 'bun:test'
import { readFileSync, rmSync } from 'node:fs'
import { buildApp } from '../src/app.ts'
import { getUpstream, setUpstream } from '../src/lib/client.ts'
import { loadRuntimeConfig, resolveUpstreamOptions, saveRuntimeConfig } from '../src/lib/runtime-config.ts'
import { applyEnv, TEST_STORE_PATH } from './helpers.ts'

const FORM = { 'content-type': 'application/x-www-form-urlencoded' }
const body = (fields: Record<string, string>) => new URLSearchParams(fields).toString()

/** Log in and return the pddikti_config cookie value for reuse. */
async function login(app: ReturnType<typeof buildApp>, password = 'pw'): Promise<string> {
  const res = await app.request('/config/login', { method: 'POST', headers: FORM, body: body({ password }) })
  const setCookie = res.headers.get('set-cookie') ?? ''
  const m = /pddikti_config=[^;]+/.exec(setCookie)
  if (!m) throw new Error('no config cookie set')
  return m[0]
}

beforeEach(() => {
  rmSync(TEST_STORE_PATH, { force: true })
  setUpstream(undefined)
})

describe('config page — disabled without password', () => {
  test('GET /config and POST /config/login return 404', async () => {
    applyEnv() // CONFIG_PASSWORD empty
    const app = buildApp()
    expect((await app.request('/config')).status).toBe(404)
    expect((await app.request('/config/login', { method: 'POST', headers: FORM, body: body({ password: 'x' }) })).status).toBe(404)
  })
})

describe('config page — auth gate', () => {
  beforeEach(() => applyEnv({ CONFIG_PASSWORD: 'pw' }))

  test('unauthenticated GET shows the login form, not the config form', async () => {
    const app = buildApp()
    const html = await (await app.request('/config')).text()
    expect(html).toContain('name="password"')
    expect(html).not.toContain('name="cfClearance"')
  })

  test('wrong password sets no cookie', async () => {
    const app = buildApp()
    const res = await app.request('/config/login', { method: 'POST', headers: FORM, body: body({ password: 'nope' }) })
    expect(res.status).toBe(401)
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  test('correct password mints a cookie and unlocks the config form', async () => {
    const app = buildApp()
    const cookie = await login(app)
    const html = await (await app.request('/config', { headers: { cookie } })).text()
    expect(html).toContain('name="cfClearance"')
  })

  test('POST /config without a cookie is rejected', async () => {
    const app = buildApp()
    const res = await app.request('/config', { method: 'POST', headers: FORM, body: body({ userAgent: 'X' }) })
    expect(res.status).toBe(401)
  })

  test('responses are marked noindex', async () => {
    const app = buildApp()
    expect((await app.request('/config')).headers.get('x-robots-tag')).toBe('noindex, nofollow')
  })
})

describe('config page — save, persist, merge, rebuild', () => {
  beforeEach(() => applyEnv({ CONFIG_PASSWORD: 'pw' }))

  test('saved values merge over env and persist to disk', async () => {
    const app = buildApp()
    const cookie = await login(app)
    const res = await app.request('/config', {
      method: 'POST',
      headers: { ...FORM, cookie },
      body: body({ baseUrl: 'https://new.test/api', userAgent: 'UA-1', cfClearance: 'CLR-1', timeoutMs: '5000' }),
    })
    expect(res.status).toBe(200)

    const opts = resolveUpstreamOptions()
    expect(opts.baseUrl).toBe('https://new.test/api')
    expect(opts.timeoutMs).toBe(5000)
    expect(opts.headers['User-Agent']).toBe('UA-1')
    expect(opts.headers['Cookie']).toBe('cf_clearance=CLR-1')
    // env header still present (shallow-merged)
    expect(opts.headers['X-Api-Key']).toBe('test')

    const onDisk = JSON.parse(readFileSync(TEST_STORE_PATH, 'utf8'))
    expect(onDisk.baseUrl).toBe('https://new.test/api')
    expect(onDisk.headers.Cookie).toBe('cf_clearance=CLR-1')
  })

  test('save resets the upstream singleton (new instance built next call)', async () => {
    const before = getUpstream()
    saveRuntimeConfig({ headers: { 'User-Agent': 'UA-2' } })
    expect(getUpstream()).not.toBe(before)
  })

  test('empty cfClearance submit preserves the stored secret', async () => {
    const app = buildApp()
    const cookie = await login(app)
    await app.request('/config', { method: 'POST', headers: { ...FORM, cookie }, body: body({ cfClearance: 'KEEP-ME', userAgent: 'UA-A' }) })
    await app.request('/config', { method: 'POST', headers: { ...FORM, cookie }, body: body({ userAgent: 'UA-B' }) })
    const rc = loadRuntimeConfig()
    expect(rc.headers?.['Cookie']).toBe('cf_clearance=KEEP-ME')
    expect(rc.headers?.['User-Agent']).toBe('UA-B')
  })

  test('cf_clearance is masked (never rendered in full)', async () => {
    const app = buildApp()
    const cookie = await login(app)
    await app.request('/config', { method: 'POST', headers: { ...FORM, cookie }, body: body({ cfClearance: 'abcdefSECRET' }) })
    const html = await (await app.request('/config', { headers: { cookie } })).text()
    expect(html).not.toContain('abcdefSECRET')
    expect(html).toContain('saved (…SECRET)')
  })

  test('a pasted cURL command yields cf_clearance + user-agent', async () => {
    const app = buildApp()
    const cookie = await login(app)
    const curl = `curl 'https://pddikti.kemdiktisaintek.go.id/api/beranda' -b '_ga=1; cf_clearance=FROMCURL; x=2' -H 'user-agent: MyUA/9.9'`
    await app.request('/config', { method: 'POST', headers: { ...FORM, cookie }, body: body({ curl }) })
    const rc = loadRuntimeConfig()
    expect(rc.headers?.['Cookie']).toBe('cf_clearance=FROMCURL')
    expect(rc.headers?.['User-Agent']).toBe('MyUA/9.9')
  })

  test('invalid timeout is rejected (422) and store unchanged', async () => {
    const app = buildApp()
    const cookie = await login(app)
    const res = await app.request('/config', { method: 'POST', headers: { ...FORM, cookie }, body: body({ timeoutMs: '-1' }) })
    expect(res.status).toBe(422)
    expect(loadRuntimeConfig()).toEqual({})
  })

  test('logout clears the cookie', async () => {
    const app = buildApp()
    const cookie = await login(app)
    const res = await app.request('/config/logout', { method: 'POST', headers: { cookie } })
    expect(res.status).toBe(303)
    expect(res.headers.get('set-cookie') ?? '').toContain('pddikti_config=;')
  })
})
