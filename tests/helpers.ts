import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { buildApp } from '../src/app.ts'
import { resetConfig } from '../src/config.ts'
import { setUpstream } from '../src/lib/client.ts'
import { resetRuntimeConfig } from '../src/lib/runtime-config.ts'
import { UpstreamClient } from '../src/lib/upstream.ts'
import type { FetchLike } from '../src/types.ts'

/** Per-run scratchpad path for the runtime-config store (never the real file). */
export const TEST_STORE_PATH = join(tmpdir(), 'pddikti-test-runtime-config.json')

const BASE_ENV: Record<string, string> = {
  PORT: '3000',
  PUBLIC_BASE_URL: 'http://localhost:3000',
  UPSTREAM_BASE_URL: 'https://upstream.test',
  UPSTREAM_HEADERS: '{"X-Api-Key":"test"}',
  UPSTREAM_TIMEOUT_MS: '1000',
  API_AVAILABILITY: 'true',
  API_KEY: '',
  API_VERSION: '1.0.0',
  CREDIT_LINE: 'Data © PDDikti',
  SUPPORT_EMAIL: 'support@test',
  SUPPORT_URL: 'https://support.test',
  CONFIG_PASSWORD: '',
  CONFIG_STORE_PATH: TEST_STORE_PATH,
  // Neutralize any ambient .env Bun auto-loads, so tests stay hermetic.
  REDIS_URL: '',
}

/** Apply base env plus overrides, resetting the config + runtime-config caches. */
export function applyEnv(overrides: Record<string, string> = {}): void {
  for (const [key, value] of Object.entries({ ...BASE_ENV, ...overrides })) {
    process.env[key] = value
  }
  resetConfig()
  resetRuntimeConfig()
}

/** Build the app with a stubbed upstream fetch returning the given response. */
export function appWithUpstream(fetchImpl: FetchLike) {
  setUpstream(
    new UpstreamClient({
      baseUrl: 'https://upstream.test',
      headers: { 'X-Api-Key': 'test' },
      timeoutMs: 1000,
      fetchImpl,
    }),
  )
  return buildApp()
}

/** Build the app without any upstream stub (overview/docs/seo only). */
export function appNoUpstream() {
  setUpstream(undefined)
  return buildApp()
}

/** A stub fetch that returns JSON with the given status. */
export function jsonFetch(body: unknown, status = 200): FetchLike {
  return () =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
}
