// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { loadConfig } from '../config.ts'
import { getCache } from './cache.ts'
import { getUpstream } from './client.ts'
import { mapLimit } from './pool.ts'
import type { RequestIdentity } from '../types.ts'

/**
 * Aggregated cross-prodi lookups that have no single upstream endpoint.
 *
 * Egress still goes through {@link getUpstream}; results are deduped, cached
 * in-memory (via {@link getCache}), and returned as a plain proxy result so both
 * the HTTP route and the MCP tool can finalize them identically.
 */

// Fan out per-prodi dosen lookups widely — most universities have well under this many
// active study programs, so the whole aggregation resolves in a single concurrent wave.
const LECTURERS_CONCURRENCY = 16

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * List every lecturer of a university for a semester by fanning out
 * `dosen/homebase` across the university's active study programs, deduping by
 * `id_sdm`/`nidn`. Returns the upstream error envelope unchanged when the prodi
 * lookup fails.
 */
export async function aggregateUniversityLecturers(
  idPt: string,
  semester: string,
  identity?: RequestIdentity,
): Promise<unknown> {
  const cache = getCache()
  const key = `lecturers:${idPt}:${semester}`

  const cached = await cache.get(key)
  if (cached !== undefined) return cached

  const upstream = getUpstream()

  const prodiList = await upstream.getWithIdAndSemester('pt/prodi', idPt, semester, identity)
  if (!Array.isArray(prodiList)) {
    return prodiList // upstream error envelope — pass through
  }

  const activeProdi = prodiList.filter(
    (p): p is Record<string, unknown> =>
      isRecord(p) && p['status_prodi'] === 'Aktif' && typeof p['id_sms'] === 'string',
  )

  const perProdi = await mapLimit(activeProdi, LECTURERS_CONCURRENCY, async (p) => {
    const res = await upstream.getWithIdAndParamSemester(
      'dosen/homebase',
      p['id_sms'] as string,
      semester,
      identity,
    )
    if (!Array.isArray(res)) return []
    return res.filter(isRecord).map(
      (d): Record<string, unknown> => ({
        ...d,
        nama_prodi: p['nama_prodi'],
        jenjang_prodi: p['jenjang_prodi'],
      }),
    )
  })

  const seen = new Set<string>()
  const dosen: Record<string, unknown>[] = []
  for (const list of perProdi) {
    for (const d of list) {
      const dedupeKey = String(d['id_sdm'] ?? d['nidn'] ?? d['nama_dosen'] ?? Math.random())
      if (seen.has(dedupeKey)) continue
      seen.add(dedupeKey)
      dosen.push(d)
    }
  }

  const data = { code: 200, semester, count: dosen.length, dosen }
  await cache.set(key, data, loadConfig().CACHE_TTL_S)
  return data
}
