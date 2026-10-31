// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ProxyStatus } from '../types.ts'

/**
 * Proxy response normalization.
 *
 * Upstream/proxy results are plain JSON. When a result is an object carrying a
 * numeric `code >= 400`, the proxy surfaces it as that HTTP status; otherwise 200.
 * Every object response also gets a `credit` field injected.
 */

const ALLOWED_ERROR_STATUSES = new Set<ProxyStatus>([400, 404, 408, 422, 500, 502, 503])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Inject the credit line into object responses (arrays/scalars pass through). */
export function withCredit(data: unknown, creditLine: string): unknown {
  if (isRecord(data) && data['credit'] === undefined) {
    return { ...data, credit: creditLine }
  }
  return data
}

/** Resolve the HTTP status for a proxy result. Unknown upstream errors → 502. */
export function resolveStatus(data: unknown): ProxyStatus {
  if (isRecord(data) && typeof data['code'] === 'number' && data['code'] >= 400) {
    const code = data['code'] as ProxyStatus
    return ALLOWED_ERROR_STATUSES.has(code) ? code : 502
  }
  return 200
}

/**
 * Build an error envelope object. `code` is stored verbatim (any HTTP code the
 * upstream returned); the HTTP layer status is later derived via resolveStatus.
 */
export function errorBody(
  code: number,
  error: string,
  message: unknown,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return { code, error, message, ...extra }
}
