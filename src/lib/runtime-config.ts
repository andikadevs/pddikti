// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { z } from '@hono/zod-openapi'
import { loadConfig } from '../config.ts'
import { setUpstream } from './client.ts'
import type { UpstreamOptions } from '../types.ts'

/**
 * Runtime overrides for the upstream connection, edited via the `/config` page and
 * persisted to a JSON file (`CONFIG_STORE_PATH`). Kept separate from `config.ts`
 * (which stays strictly env-only): env is the baseline, runtime overrides win.
 *
 * The upstream sits behind Cloudflare — its `cf_clearance` cookie + User-Agent expire
 * frequently, so an operator refreshes them here without editing `.env` or restarting.
 *
 * File I/O is synchronous so `resolveUpstreamOptions()` (hence `getUpstream()`) stays
 * synchronous; the store is a tiny single-operator file read once and cached.
 */

const runtimeConfigSchema = z
  .object({
    baseUrl: z
      .string()
      .url()
      .transform((v) => v.replace(/\/+$/, ''))
      .optional(),
    timeoutMs: z.coerce.number().int().positive().optional(),
    headers: z.record(z.string(), z.string()).optional(),
  })
  .strict()

export type RuntimeConfig = z.infer<typeof runtimeConfigSchema>

let cached: RuntimeConfig | undefined

function storePath(): string {
  return loadConfig().CONFIG_STORE_PATH
}

/**
 * Load persisted runtime overrides (cached). Missing file or invalid content →
 * `{}` (degrade to env; never throw). Errors are logged only under DEBUG.
 */
export function loadRuntimeConfig(): RuntimeConfig {
  if (cached) return cached
  const path = storePath()
  if (!existsSync(path)) {
    cached = {}
    return cached
  }
  try {
    const raw = readFileSync(path, 'utf8').trim()
    if (raw === '') {
      cached = {}
      return cached
    }
    const parsed = runtimeConfigSchema.safeParse(JSON.parse(raw))
    cached = parsed.success ? parsed.data : {}
  } catch (err) {
    if (loadConfig().DEBUG) console.error('runtime-config: failed to read store:', err)
    cached = {}
  }
  return cached
}

/**
 * Merge `patch` over the current runtime config, persist it, then reset the upstream
 * singleton so the next `getUpstream()` rebuilds with the new values. Write happens
 * first: a failed write leaves the cache and singleton on the last-good config.
 */
export function saveRuntimeConfig(patch: RuntimeConfig): RuntimeConfig {
  const current = loadRuntimeConfig()
  const merged = runtimeConfigSchema.parse({
    ...current,
    ...patch,
    headers: { ...current.headers, ...patch.headers },
  })
  writeFileSync(storePath(), `${JSON.stringify(merged, null, 2)}\n`)
  cached = merged
  setUpstream(undefined)
  return merged
}

/** Wipe all runtime overrides (revert to pure env). */
export function clearRuntimeConfig(): void {
  writeFileSync(storePath(), '{}\n')
  cached = {}
  setUpstream(undefined)
}

/**
 * The single merge point: env baseline (from `config.ts`) with runtime overrides on
 * top. `headers` are shallow-merged key-by-key; scalar fields are replaced when set.
 */
export function resolveUpstreamOptions(): Pick<
  UpstreamOptions,
  'baseUrl' | 'headers' | 'timeoutMs'
> {
  const config = loadConfig()
  const runtime = loadRuntimeConfig()
  return {
    baseUrl: runtime.baseUrl ?? config.UPSTREAM_BASE_URL,
    timeoutMs: runtime.timeoutMs ?? config.UPSTREAM_TIMEOUT_MS,
    headers: { ...config.UPSTREAM_HEADERS, ...runtime.headers },
  }
}

/** Reset the cache. Test-only (mirrors resetConfig). */
export function resetRuntimeConfig(): void {
  cached = undefined
}
