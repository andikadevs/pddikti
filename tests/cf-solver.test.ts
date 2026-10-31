// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { beforeEach, describe, expect, test } from 'bun:test'
import { getFreshClearance, parseSolverResponse } from '../src/lib/cf-solver.ts'
import type { FetchLike } from '../src/types.ts'
import { applyEnv } from './helpers.ts'

const okResponse = {
  status: 'ok',
  solution: {
    status: 200,
    userAgent: 'Mozilla/5.0 SolvedUA',
    cookies: [
      { name: '_ga', value: 'x' },
      { name: 'cf_clearance', value: 'FRESH-CLR' },
    ],
  },
}

describe('parseSolverResponse', () => {
  test('extracts cf_clearance + userAgent from an ok solution', () => {
    expect(parseSolverResponse(okResponse)).toEqual({ cfClearance: 'FRESH-CLR', userAgent: 'Mozilla/5.0 SolvedUA' })
  })

  test('throws when not solved', () => {
    expect(() => parseSolverResponse({ status: 'error', message: 'timeout' })).toThrow(/timeout/)
  })

  test('throws when no cf_clearance cookie', () => {
    expect(() => parseSolverResponse({ status: 'ok', solution: { userAgent: 'UA', cookies: [] } })).toThrow(/cf_clearance/)
  })

  test('throws when no userAgent', () => {
    expect(() =>
      parseSolverResponse({ status: 'ok', solution: { cookies: [{ name: 'cf_clearance', value: 'c' }] } }),
    ).toThrow(/userAgent/)
  })
})

describe('getFreshClearance', () => {
  beforeEach(() => applyEnv({ SOLVER_ENABLED: 'true', SOLVER_URL: 'http://solver.test/v1' }))

  test('POSTs to the solver and returns the clearance', async () => {
    const seen: Array<{ url: string; body: unknown }> = []
    const stub: FetchLike = (url, init) => {
      seen.push({ url: String(url), body: JSON.parse(String(init?.body ?? '{}')) })
      return Promise.resolve(new Response(JSON.stringify(okResponse), { headers: { 'Content-Type': 'application/json' } }))
    }
    const clearance = await getFreshClearance(stub)
    expect(clearance.cfClearance).toBe('FRESH-CLR')
    expect(seen).toHaveLength(1)
    expect(seen[0]?.url).toBe('http://solver.test/v1')
    expect((seen[0]?.body as { cmd: string }).cmd).toBe('request.get')
  })

  test('de-duplicates concurrent solves onto one request', async () => {
    let calls = 0
    const stub: FetchLike = () => {
      calls += 1
      return new Promise((resolve) =>
        setTimeout(
          () => resolve(new Response(JSON.stringify(okResponse), { headers: { 'Content-Type': 'application/json' } })),
          20,
        ),
      )
    }
    const [a, b] = await Promise.all([getFreshClearance(stub), getFreshClearance(stub)])
    expect(calls).toBe(1)
    expect(a).toEqual(b)
  })
})
