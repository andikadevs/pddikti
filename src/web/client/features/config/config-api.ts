// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ConfigState, UpstreamInput } from './types'

interface ActionResult {
  ok?: boolean
  error?: string
  code?: number
}

async function post(path: string, body?: unknown): Promise<{ httpOk: boolean; result: ActionResult }> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const result = (await res.json().catch(() => ({}))) as ActionResult
  return { httpOk: res.ok, result }
}

/** Client for the password-protected `/config/*` JSON API. */
export const configApi = {
  async state(): Promise<ConfigState> {
    const res = await fetch('/config/state')
    return (await res.json()) as ConfigState
  },

  /** Returns an error message, or null on success. */
  async login(password: string): Promise<string | null> {
    const { httpOk, result } = await post('/config/login', { password })
    return httpOk ? null : (result.error ?? 'Login gagal.')
  },

  /** Returns an error message, or null on success. */
  async save(input: UpstreamInput): Promise<string | null> {
    const { httpOk, result } = await post('/config/save', input)
    return httpOk && result.ok ? null : (result.error ?? 'Gagal menyimpan.')
  },

  /** Probes the upstream and returns its HTTP status, or null when unknown. */
  async test(): Promise<number | null> {
    const { result } = await post('/config/test')
    return result.code ?? null
  },

  async logout(): Promise<void> {
    await post('/config/logout')
  },
}
