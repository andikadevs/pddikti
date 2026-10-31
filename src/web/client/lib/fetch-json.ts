// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

/** Error raised when an API call fails, carrying the HTTP status when known. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface ErrorEnvelope {
  code: number
  error?: string
  message?: unknown
}

function isErrorEnvelope(value: unknown): value is ErrorEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { code?: unknown }).code === 'number' &&
    (value as ErrorEnvelope).code >= 400
  )
}

function messageOf(envelope: ErrorEnvelope): string {
  if (typeof envelope.message === 'string') return envelope.message
  return envelope.error ?? 'Request failed'
}

async function request(path: string): Promise<unknown> {
  const res = await fetch(path)
  const body: unknown = await res.json().catch(() => null)
  if (isErrorEnvelope(body)) throw new ApiError(messageOf(body), res.status)
  if (!res.ok) throw new ApiError(`HTTP ${res.status}`, res.status)
  return body
}

/** In-flight and settled successful requests, keyed by path, for this page session. */
const cache = new Map<string, Promise<unknown>>()

/**
 * GET a JSON endpoint of this API. Concurrent and repeated calls for the same path share
 * one request; failures are evicted so a later call retries.
 */
export function fetchJson<T>(path: string): Promise<T> {
  let pending = cache.get(path)
  if (!pending) {
    pending = request(path)
    pending.catch(() => cache.delete(path))
    cache.set(path, pending)
  }
  return pending as Promise<T>
}
