// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, test } from 'bun:test'
import { UpstreamClient } from '../src/lib/upstream.ts'
import type { FetchLike } from '../src/types.ts'

/** A fetch stub scripted per call; records the headers it saw. */
function scriptedFetch(statuses: number[]) {
  const seen: Array<Record<string, string>> = []
  let i = 0
  const impl: FetchLike = (_url, init) => {
    seen.push({ ...((init?.headers as Record<string, string> | undefined) ?? {}) })
    const status = statuses[Math.min(i, statuses.length - 1)] ?? 200
    i += 1
    const body = status === 200 ? { status: 'success', data: { ok: true } } : { status: 'error', message: 'blocked' }
    return Promise.resolve(
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
    )
  }
  return { impl, seen }
}

const base = { baseUrl: 'https://upstream.test', headers: { Cookie: 'cf_clearance=OLD' }, timeoutMs: 1000 }

describe('upstream 403 auto-refresh', () => {
  test('403 then refresh → retries once with fresh headers and succeeds', async () => {
    const fetchStub = scriptedFetch([403, 200])
    let refreshed = 0
    const client = new UpstreamClient({
      ...base,
      fetchImpl: fetchStub.impl,
      refreshOnForbidden: async () => {
        refreshed += 1
        return { Cookie: 'cf_clearance=NEW', 'User-Agent': 'UA/1' }
      },
    })
    const result = (await client.get('x')) as { ok?: boolean }
    expect(refreshed).toBe(1)
    expect(fetchStub.seen).toHaveLength(2)
    expect(fetchStub.seen[0]?.['Cookie']).toBe('cf_clearance=OLD')
    expect(fetchStub.seen[1]?.['Cookie']).toBe('cf_clearance=NEW')
    expect(result.ok).toBe(true) // unwrapped 200 payload
  })

  test('no hook → 403 surfaces as an error envelope, single attempt', async () => {
    const fetchStub = scriptedFetch([403, 200])
    const client = new UpstreamClient({ ...base, fetchImpl: fetchStub.impl })
    const result = (await client.get('x')) as { code?: number }
    expect(fetchStub.seen).toHaveLength(1)
    expect(result.code).toBe(403)
  })

  test('hook returns null → no retry', async () => {
    const fetchStub = scriptedFetch([403, 200])
    const client = new UpstreamClient({ ...base, fetchImpl: fetchStub.impl, refreshOnForbidden: async () => null })
    const result = (await client.get('x')) as { code?: number }
    expect(fetchStub.seen).toHaveLength(1)
    expect(result.code).toBe(403)
  })

  test('retry still failing → error envelope (no infinite loop)', async () => {
    const fetchStub = scriptedFetch([403, 403])
    let refreshed = 0
    const client = new UpstreamClient({
      ...base,
      fetchImpl: fetchStub.impl,
      refreshOnForbidden: async () => {
        refreshed += 1
        return { Cookie: 'cf_clearance=NEW' }
      },
    })
    const result = (await client.get('x')) as { code?: number }
    expect(refreshed).toBe(1)
    expect(fetchStub.seen).toHaveLength(2)
    expect(result.code).toBe(403)
  })
})
