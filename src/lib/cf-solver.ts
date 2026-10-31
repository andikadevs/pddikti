// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { loadConfig } from '../config.ts'
import type { FetchLike } from '../types.ts'

/**
 * Cloudflare clearance auto-solver backed by FlareSolverr — a headless-browser
 * service (run as a sidecar container) that clears the "Just a moment" challenge and
 * returns a fresh `cf_clearance` cookie + User-Agent. This is server-deployable: the
 * browser lives inside FlareSolverr (its own virtual display), not in this process.
 *
 * See docker-compose.yml. Point SOLVER_URL at the FlareSolverr `/v1` endpoint.
 */

export interface Clearance {
  cfClearance: string
  userAgent: string
}

interface FlareSolverrResponse {
  status?: string
  message?: string
  solution?: {
    url?: string
    status?: number
    userAgent?: string
    cookies?: Array<{ name: string; value: string }>
  }
}

/** Where FlareSolverr should point its browser: SOLVER_TARGET_URL, else the upstream origin. */
function targetUrl(): string {
  const config = loadConfig()
  if (config.SOLVER_TARGET_URL !== '') return config.SOLVER_TARGET_URL
  try {
    return new URL(config.UPSTREAM_BASE_URL).origin
  } catch {
    return config.UPSTREAM_BASE_URL
  }
}

/** Extract clearance from a FlareSolverr `/v1` response, or throw with a clear reason. */
export function parseSolverResponse(json: unknown): Clearance {
  const res = json as FlareSolverrResponse
  if (res.status !== 'ok' || !res.solution) {
    throw new Error(`FlareSolverr did not solve: ${res.message ?? res.status ?? 'unknown'}`)
  }
  const cf = res.solution.cookies?.find((c) => c.name === 'cf_clearance')
  if (!cf?.value) throw new Error('FlareSolverr response had no cf_clearance cookie')
  const userAgent = res.solution.userAgent ?? ''
  if (userAgent === '') throw new Error('FlareSolverr response had no userAgent')
  return { cfClearance: cf.value, userAgent }
}

async function runSolve(fetchImpl: FetchLike): Promise<Clearance> {
  const config = loadConfig()
  if (config.SOLVER_URL === '') throw new Error('SOLVER_URL is not set')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), config.SOLVER_TIMEOUT_MS)
  try {
    const response = await fetchImpl(new URL(config.SOLVER_URL), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cmd: 'request.get',
        url: targetUrl(),
        maxTimeout: config.SOLVER_TIMEOUT_MS,
      }),
      signal: controller.signal,
    })
    return parseSolverResponse(await response.json())
  } finally {
    clearTimeout(timer)
  }
}

let inflight: Promise<Clearance> | null = null

/**
 * Obtain a fresh clearance, de-duplicating concurrent callers onto one solve (many
 * in-flight 403s must not fan out into many FlareSolverr requests). `fetchImpl` is
 * injectable for tests.
 */
export function getFreshClearance(fetchImpl: FetchLike = fetch): Promise<Clearance> {
  if (inflight) return inflight
  inflight = runSolve(fetchImpl).finally(() => {
    inflight = null
  })
  return inflight
}
