// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { beforeEach, describe, expect, test } from 'bun:test'
import { readFileSync, rmSync } from 'node:fs'
import { buildApp } from '../src/app.ts'
import { getUpstream, setUpstream } from '../src/lib/client.ts'
import { loadRuntimeConfig, resolveUpstreamOptions, saveRuntimeConfig } from '../src/lib/runtime-config.ts'
import { applyEnv, TEST_STORE_PATH } from './helpers.ts'

/** Build a JSON POST RequestInit, optionally carrying a cookie. */
function post(body?: unknown, cookie?: string): RequestInit {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  }
}

async function login(app: ReturnType<typeof buildApp>, password = 'pw'): Promise<string> {
  const res = await app.request('/config/login', post({ password }))
  const m = /pddikti_config=[^;]+/.exec(res.headers.get('set-cookie') ?? '')
  if (!m) throw new Error('no config cookie set')
  return m[0]
}

beforeEach(() => {
  rmSync(TEST_STORE_PATH, { force: true })
  setUpstream(undefined)
})

describe('config API — disabled without password', () => {
  test('state reports disabled; login is 404', async () => {
    applyEnv()
    const app = buildApp()
    expect(await (await app.request('/config/state')).json()).toEqual({ enabled: false })
    expect((await app.request('/config/login', post({ password: 'x' }))).status).toBe(404)
  })
})

describe('config API — auth gate', () => {
  beforeEach(() => applyEnv({ CONFIG_PASSWORD: 'pw' }))

  test('state: enabled but not authed', async () => {
    const app = buildApp()
    expect(await (await app.request('/config/state')).json()).toEqual({ enabled: true, authed: false })
  })

  test('wrong password → 401, no cookie', async () => {
    const app = buildApp()
    const res = await app.request('/config/login', post({ password: 'nope' }))
    expect(res.status).toBe(401)
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  test('correct password → cookie unlocks state', async () => {
    const app = buildApp()
    const cookie = await login(app)
    const state = (await (await app.request('/config/state', { headers: { cookie } })).json()) as {
      authed: boolean
      config?: unknown
    }
    expect(state.authed).toBe(true)
    expect(state.config).toBeDefined()
  })

  test('save without cookie → 401', async () => {
    const app = buildApp()
    expect((await app.request('/config/save', post({ userAgent: 'X' }))).status).toBe(401)
  })
})

describe('config API — save, persist, merge', () => {
  beforeEach(() => applyEnv({ CONFIG_PASSWORD: 'pw' }))

  test('saved values merge over env and persist', async () => {
    const app = buildApp()
    const cookie = await login(app)
    const res = await app.request(
      '/config/save',
      post({ baseUrl: 'https://new.test/api', userAgent: 'UA-1', cfClearance: 'CLR-1', timeoutMs: '5000' }, cookie),
    )
    expect(res.status).toBe(200)
    expect(((await res.json()) as { ok: boolean }).ok).toBe(true)

    const opts = resolveUpstreamOptions()
    expect(opts.baseUrl).toBe('https://new.test/api')
    expect(opts.timeoutMs).toBe(5000)
    expect(opts.headers['User-Agent']).toBe('UA-1')
    expect(opts.headers['Cookie']).toBe('cf_clearance=CLR-1')
    expect(opts.headers['X-Api-Key']).toBe('test') // env baseline preserved

    expect(JSON.parse(readFileSync(TEST_STORE_PATH, 'utf8')).headers.Cookie).toBe('cf_clearance=CLR-1')
  })

  test('save resets the upstream singleton', () => {
    const before = getUpstream()
    saveRuntimeConfig({ headers: { 'User-Agent': 'UA-2' } })
    expect(getUpstream()).not.toBe(before)
  })

  test('empty cfClearance preserves the stored secret; masked in state', async () => {
    const app = buildApp()
    const cookie = await login(app)
    await app.request('/config/save', post({ cfClearance: 'abcdefSECRET', userAgent: 'UA-A' }, cookie))
    await app.request('/config/save', post({ userAgent: 'UA-B' }, cookie))
    const rc = loadRuntimeConfig()
    expect(rc.headers?.['Cookie']).toBe('cf_clearance=abcdefSECRET')
    expect(rc.headers?.['User-Agent']).toBe('UA-B')

    const state = (await (await app.request('/config/state', { headers: { cookie } })).json()) as {
      config: { cfMasked: string }
    }
    expect(state.config.cfMasked).not.toContain('abcdefSECRET')
    expect(state.config.cfMasked).toContain('SECRET')
  })

  test('cURL paste yields cf_clearance + user-agent', async () => {
    const app = buildApp()
    const cookie = await login(app)
    const curl = `curl 'https://pddikti.kemdiktisaintek.go.id/api/beranda' -b '_ga=1; cf_clearance=FROMCURL; x=2' -H 'user-agent: MyUA/9.9'`
    await app.request('/config/save', post({ curl }, cookie))
    const rc = loadRuntimeConfig()
    expect(rc.headers?.['Cookie']).toBe('cf_clearance=FROMCURL')
    expect(rc.headers?.['User-Agent']).toBe('MyUA/9.9')
  })

  test('invalid timeout → 422, store unchanged', async () => {
    const app = buildApp()
    const cookie = await login(app)
    const res = await app.request('/config/save', post({ timeoutMs: '-1' }, cookie))
    expect(res.status).toBe(422)
    expect(loadRuntimeConfig()).toEqual({})
  })

  test('logout clears the cookie', async () => {
    const app = buildApp()
    const cookie = await login(app)
    const res = await app.request('/config/logout', post(undefined, cookie))
    expect(((await res.json()) as { ok: boolean }).ok).toBe(true)
    expect(res.headers.get('set-cookie') ?? '').toContain('pddikti_config=;')
  })
})
