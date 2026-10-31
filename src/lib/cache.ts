// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { RedisClient } from 'bun'
import { loadConfig, type Config } from '../config.ts'

/**
 * Optional cache layer for the proxy. The proxy serves public, non-personalized
 * upstream data, so cached values are keyed by URL alone and shared across callers.
 *
 * When caching is disabled (`CACHE_ENABLED=false`) the singleton is a {@link NoopCache}.
 * Redis failures never propagate: every operation degrades to a miss/no-op so the
 * request falls through to the upstream (passthrough). This is the only place that
 * constructs a Redis client.
 */
export interface Cache {
  /** Return the cached value, or `undefined` on miss/error. */
  get(key: string): Promise<unknown | undefined>
  /** Store a JSON-serializable value with a TTL in seconds. Never throws. */
  set(key: string, value: unknown, ttlS: number): Promise<void>
}

/** No-op cache used when caching is disabled — every read misses. */
export class NoopCache implements Cache {
  get(_key: string): Promise<unknown | undefined> {
    return Promise.resolve(undefined)
  }
  set(_key: string, _value: unknown, _ttlS: number): Promise<void> {
    return Promise.resolve()
  }
}

/** Redis-backed cache. JSON-serializes values; swallows all client errors. */
export class RedisCache implements Cache {
  private readonly client: RedisClient
  private readonly debug: boolean

  constructor(client: RedisClient, debug = false) {
    this.client = client
    this.debug = debug
    this.client.onclose = (err) => {
      if (this.debug) console.error('[cache] redis connection closed:', err.message)
    }
  }

  async get(key: string): Promise<unknown | undefined> {
    try {
      const raw = await this.client.get(key)
      if (raw === null) return undefined
      return JSON.parse(raw) as unknown
    } catch (err) {
      if (this.debug) console.error('[cache] get failed:', (err as Error).message)
      return undefined
    }
  }

  async set(key: string, value: unknown, ttlS: number): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlS)
    } catch (err) {
      if (this.debug) console.error('[cache] set failed:', (err as Error).message)
    }
  }
}

/**
 * Build the Redis connection URL. `REDIS_URL` wins verbatim when set; otherwise the
 * discrete `REDIS_*` fields are assembled, URL-encoding credentials and omitting the
 * auth section when both username and password are blank.
 */
export function buildRedisUrl(config: Config): string {
  if (config.REDIS_URL !== '') return config.REDIS_URL

  let auth = ''
  if (config.REDIS_USERNAME !== '' || config.REDIS_PASSWORD !== '') {
    const user = encodeURIComponent(config.REDIS_USERNAME)
    const pass = encodeURIComponent(config.REDIS_PASSWORD)
    auth = `${user}:${pass}@`
  }
  return `redis://${auth}${config.REDIS_HOST}:${config.REDIS_PORT}/${config.REDIS_DB}`
}

let cache: Cache | undefined

/** Lazily built cache singleton: Redis when enabled, otherwise a no-op. */
export function getCache(): Cache {
  if (!cache) {
    const config = loadConfig()
    if (!config.CACHE_ENABLED) {
      cache = new NoopCache()
    } else {
      const client = new RedisClient(buildRedisUrl(config), {
        connectionTimeout: config.UPSTREAM_TIMEOUT_MS,
        autoReconnect: true,
      })
      cache = new RedisCache(client, config.DEBUG)
    }
  }
  return cache
}

/** Override the singleton. Test-only (inject a fake cache). */
export function setCache(override: Cache | undefined): void {
  cache = override
}

/** Reset the singleton. Test-only. */
export function closeCache(): void {
  cache = undefined
}
