import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import type { RedisClient } from 'bun'
import { buildApp } from '../src/app.ts'
import { loadConfig } from '../src/config.ts'
import { buildRedisUrl, NoopCache, RedisCache, setCache, type Cache } from '../src/lib/cache.ts'
import { setUpstream } from '../src/lib/client.ts'
import { UpstreamClient } from '../src/lib/upstream.ts'
import { applyEnv } from './helpers.ts'
import type { FetchLike } from '../src/types.ts'

/** Map-backed fake cache that counts writes. */
class FakeCache implements Cache {
  readonly store = new Map<string, unknown>()
  setCalls = 0
  get(key: string): Promise<unknown | undefined> {
    return Promise.resolve(this.store.has(key) ? this.store.get(key) : undefined)
  }
  set(key: string, value: unknown): Promise<void> {
    this.setCalls += 1
    this.store.set(key, value)
    return Promise.resolve()
  }
}

/** Stub fetch returning JSON, counting invocations. */
function countingFetch(body: unknown, status = 200): { impl: FetchLike; calls: () => number } {
  let calls = 0
  const impl: FetchLike = () => {
    calls += 1
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  }
  return { impl, calls: () => calls }
}

function clientWith(fetchImpl: FetchLike, cache?: Cache, cacheTtlS = 0): void {
  setUpstream(
    new UpstreamClient({
      baseUrl: 'https://upstream.test',
      headers: { 'X-Api-Key': 'test' },
      timeoutMs: 1000,
      fetchImpl,
      cache,
      cacheTtlS,
    }),
  )
}

describe('buildRedisUrl', () => {
  beforeEach(() => applyEnv())

  test('assembles discrete fields with defaults', () => {
    applyEnv()
    expect(buildRedisUrl(loadConfig())).toBe('redis://localhost:6379/0')
  })

  test('URL-encodes credentials when present', () => {
    applyEnv({ REDIS_USERNAME: 'u@', REDIS_PASSWORD: 'p:', REDIS_HOST: 'cache', REDIS_DB: '2' })
    expect(buildRedisUrl(loadConfig())).toBe('redis://u%40:p%3A@cache:6379/2')
  })

  test('REDIS_URL wins verbatim', () => {
    applyEnv({ REDIS_URL: 'redis://x:y@h:1/3', REDIS_HOST: 'ignored' })
    expect(buildRedisUrl(loadConfig())).toBe('redis://x:y@h:1/3')
  })
})

describe('upstream cache', () => {
  beforeEach(() => applyEnv())
  afterEach(() => {
    setUpstream(undefined)
    setCache(undefined)
  })

  test('serves a second identical request from cache (one upstream fetch)', async () => {
    const fetch = countingFetch({ code: 200, data: { x: 1 } })
    const cache = new FakeCache()
    clientWith(fetch.impl, cache, 600)
    const app = buildApp()

    const first = await app.request('/api/pt/detail/PT-x/')
    const second = await app.request('/api/pt/detail/PT-x/')

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(fetch.calls()).toBe(1)
    expect(cache.setCalls).toBe(1)
    expect(((await second.json()) as Record<string, unknown>)['credit']).toBe('Data © PDDikti')
  })

  test('passthrough (no cache) fetches every time', async () => {
    const fetch = countingFetch({ code: 200, data: { x: 1 } })
    clientWith(fetch.impl) // no cache, cacheTtlS 0
    const app = buildApp()

    await app.request('/api/pt/detail/PT-x/')
    await app.request('/api/pt/detail/PT-x/')

    expect(fetch.calls()).toBe(2)
  })

  test('does not cache error envelopes', async () => {
    const fetch = countingFetch({ message: 'gone' }, 404)
    const cache = new FakeCache()
    clientWith(fetch.impl, cache, 600)
    const app = buildApp()

    const res = await app.request('/api/pt/detail/PT-x/')
    expect(res.status).toBe(404)
    expect(cache.setCalls).toBe(0)
  })
})

describe('cache implementations', () => {
  test('NoopCache always misses', async () => {
    const cache = new NoopCache()
    await cache.set('k', 'v', 60)
    expect(await cache.get('k')).toBeUndefined()
  })

  test('RedisCache swallows client errors (graceful passthrough)', async () => {
    const throwing = {
      onclose: null,
      get: () => Promise.reject(new Error('down')),
      set: () => Promise.reject(new Error('down')),
    } as unknown as RedisClient
    const cache = new RedisCache(throwing)

    expect(await cache.get('k')).toBeUndefined()
    await expect(cache.set('k', 'v', 60)).resolves.toBeUndefined()
  })
})
