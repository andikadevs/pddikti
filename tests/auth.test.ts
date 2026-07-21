import { beforeEach, describe, expect, test } from 'bun:test'
import { signSession, verifySession } from '../src/lib/session.ts'
import { appNoUpstream, appWithUpstream, applyEnv, jsonFetch } from './helpers.ts'

const OK = { code: 200, data: [] }

describe('api-key auth', () => {
  test('disabled by default (empty API_KEY) — data endpoint stays public', async () => {
    applyEnv()
    const app = appWithUpstream(jsonFetch(OK))
    expect((await app.request('/api/search/all/x/')).status).toBe(200)
  })

  describe('enabled (API_KEY set)', () => {
    beforeEach(() => applyEnv({ API_KEY: 'secret' }))

    test('rejects request with no credential', async () => {
      const app = appWithUpstream(jsonFetch(OK))
      const res = await app.request('/api/search/all/x/')
      expect(res.status).toBe(401)
      const body = (await res.json()) as Record<string, unknown>
      expect((body['status'] as Record<string, unknown>)['code']).toBe('API_KEY_REQUIRED')
    })

    test('accepts correct X-API-Key, rejects wrong one', async () => {
      const app = appWithUpstream(jsonFetch(OK))
      const ok = await app.request('/api/search/all/x/', { headers: { 'x-api-key': 'secret' } })
      expect(ok.status).toBe(200)
      const bad = await app.request('/api/search/all/x/', { headers: { 'x-api-key': 'nope' } })
      expect(bad.status).toBe(401)
    })

    test('overview and docs stay public without a key', async () => {
      const app = appNoUpstream()
      expect((await app.request('/api/')).status).toBe(200)
      expect((await app.request('/api/docs')).status).toBe(200)
      expect((await app.request('/api/openapi.json')).status).toBe(200)
    })

    test('SPA cookie minted at / authorizes /api/*', async () => {
      const app = appWithUpstream(jsonFetch(OK))
      const home = await app.request('/')
      const setCookie = home.headers.get('set-cookie') ?? ''
      expect(setCookie).toContain('pddikti_session=')
      const value = setCookie.split('pddikti_session=')[1]?.split(';')[0] ?? ''
      const res = await app.request('/api/search/all/x/', {
        headers: { Cookie: `pddikti_session=${value}` },
      })
      expect(res.status).toBe(200)
    })
  })
})

describe('session token', () => {
  test('sign then verify succeeds before expiry', () => {
    const token = signSession(1_000, 'secret')
    expect(verifySession(token, 'secret', 999)).toBe(true)
  })

  test('rejects expired token', () => {
    const token = signSession(1_000, 'secret')
    expect(verifySession(token, 'secret', 1_000)).toBe(false)
    expect(verifySession(token, 'secret', 1_001)).toBe(false)
  })

  test('rejects tampered signature or wrong secret', () => {
    const token = signSession(9_999, 'secret')
    expect(verifySession(`${token}x`, 'secret', 0)).toBe(false)
    expect(verifySession(token, 'other', 0)).toBe(false)
  })
})
