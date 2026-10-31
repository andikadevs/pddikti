// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { beforeEach, describe, expect, test } from 'bun:test'
import { appNoUpstream, appWithUpstream, applyEnv, jsonFetch } from './helpers.ts'
import type { FetchLike } from '../src/types.ts'

describe('overview', () => {
  beforeEach(() => applyEnv())

  test('serves metadata without any upstream', async () => {
    const app = appNoUpstream()
    const res = await app.request('/api/')
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect(body['service']).toBeDefined()
    expect(body['credit']).toBe('Data © PDDikti')
  })

  test('is reachable at /api and /api/', async () => {
    const app = appNoUpstream()
    expect((await app.request('/api')).status).toBe(200)
    expect((await app.request('/api/')).status).toBe(200)
  })

  test('credit header is latin-1 safe', async () => {
    const app = appNoUpstream()
    const res = await app.request('/api/')
    expect(res.headers.get('x-project-credit')).toBe('Data (C) PDDikti')
  })
})

describe('availability gating', () => {
  test('returns 503 envelope for /api/* when disabled, overview stays open', async () => {
    applyEnv({ API_AVAILABILITY: 'false' })
    const app = appWithUpstream(jsonFetch({ code: 200, data: [] }))

    const blocked = await app.request('/api/search/all/informatika/')
    expect(blocked.status).toBe(503)
    const body = (await blocked.json()) as Record<string, unknown>
    expect(body['success']).toBe(false)
    expect((body['status'] as Record<string, unknown>)['code']).toBe('API_TEMPORARILY_UNAVAILABLE')

    expect((await app.request('/api/')).status).toBe(200)
    expect((await app.request('/api/docs')).status).toBe(200)
  })
})

describe('proxy responses', () => {
  beforeEach(() => applyEnv())

  test('injects credit into upstream object payloads', async () => {
    const app = appWithUpstream(jsonFetch({ code: 200, data: { hello: 'world' } }))
    const res = await app.request('/api/search/all/informatika/')
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect(body['credit']).toBe('Data © PDDikti')
    expect((body['data'] as Record<string, unknown>)['hello']).toBe('world')
  })

  test('maps upstream HTTP error to that status', async () => {
    const app = appWithUpstream(jsonFetch({ message: 'gone' }, 404))
    const res = await app.request('/api/pt/detail/PT-x/')
    expect(res.status).toBe(404)
    const body = (await res.json()) as Record<string, unknown>
    expect(body['code']).toBe(404)
    expect(body['error']).toBe('HTTP error occurred')
  })

  test('maps connection failure to 503', async () => {
    const failing: FetchLike = () => Promise.reject(new Error('Unable to connect'))
    const app = appWithUpstream(failing)
    const res = await app.request('/api/stats/mhs-count/')
    expect(res.status).toBe(503)
    const body = (await res.json()) as Record<string, unknown>
    expect(body['code']).toBe(503)
  })

  test('maps timeout (abort) to 408', async () => {
    const aborting: FetchLike = () => {
      const err = new Error('aborted')
      err.name = 'AbortError'
      return Promise.reject(err)
    }
    const app = appWithUpstream(aborting)
    const res = await app.request('/api/stats/dosen-count/')
    expect(res.status).toBe(408)
    expect(((await res.json()) as Record<string, unknown>)['code']).toBe(408)
  })

  test('forwards client identity headers upstream', async () => {
    let seen: Headers | undefined
    const spy: FetchLike = (_input, init) => {
      seen = new Headers(init?.headers)
      return Promise.resolve(new Response(JSON.stringify({ code: 200 }), { status: 200 }))
    }
    const app = appWithUpstream(spy)
    await app.request('/api/search/all/x/', {
      headers: { 'x-forwarded-for': '203.0.113.7', 'user-agent': 'client/1.0' },
    })
    expect(seen?.get('x-forwarded-for')).toBe('203.0.113.7')
    expect(seen?.get('x-original-user-agent')).toBe('client/1.0')
    expect(seen?.get('x-api-key')).toBe('test')
  })
})

describe('lecturers aggregate', () => {
  beforeEach(() => applyEnv())

  test('merges dosen across active prodi and dedupes by id_sdm', async () => {
    const router: FetchLike = (input) => {
      const url = String(input)
      if (url.includes('/pt/prodi/')) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              { id_sms: 'A', nama_prodi: 'P1', jenjang_prodi: 'S1', status_prodi: 'Aktif' },
              { id_sms: 'B', nama_prodi: 'P2', jenjang_prodi: 'S1', status_prodi: 'Aktif' },
              { id_sms: 'C', nama_prodi: 'P3', jenjang_prodi: 'D3', status_prodi: 'Tutup' },
            ]),
            { status: 200 },
          ),
        )
      }
      if (url.includes('/dosen/homebase/A')) {
        return Promise.resolve(
          new Response(JSON.stringify([{ id_sdm: '1', nama_dosen: 'X' }, { id_sdm: '2', nama_dosen: 'Y' }]), { status: 200 }),
        )
      }
      if (url.includes('/dosen/homebase/B')) {
        return Promise.resolve(
          new Response(JSON.stringify([{ id_sdm: '2', nama_dosen: 'Y' }, { id_sdm: '3', nama_dosen: 'Z' }]), { status: 200 }),
        )
      }
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
    }
    const app = appWithUpstream(router)
    const res = await app.request('/api/pt/lecturers/PT1/20251/')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { count: number; dosen: { id_sdm: string; nama_prodi: string }[] }
    expect(body.count).toBe(3)
    expect(body.dosen.map((d) => d.id_sdm).sort()).toEqual(['1', '2', '3'])
    expect(body.dosen[0]?.nama_prodi).toBe('P1')
  })
})

describe('image route', () => {
  beforeEach(() => applyEnv())

  test('returns raw image bytes with content-type', async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47])
    const imageFetch: FetchLike = () =>
      Promise.resolve(new Response(png, { status: 200, headers: { 'Content-Type': 'image/png' } }))
    const app = appWithUpstream(imageFetch)
    const res = await app.request('/api/pt/logo/PT-x/')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('image/png')
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(png)
  })
})

describe('seo', () => {
  beforeEach(() => applyEnv())

  test('robots.txt references the sitemap', async () => {
    const app = appNoUpstream()
    const res = await app.request('/robots.txt')
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('Sitemap: http://localhost:3000/sitemap.xml')
  })

  test('sitemap.xml lists public pages', async () => {
    const app = appNoUpstream()
    const res = await app.request('/sitemap.xml')
    expect(res.status).toBe(200)
    const xml = await res.text()
    expect(xml).toContain('<loc>http://localhost:3000/api/</loc>')
  })
})

describe('openapi', () => {
  beforeEach(() => applyEnv())

  test('exposes a generated spec with all route groups', async () => {
    const app = appNoUpstream()
    const res = await app.request('/api/openapi.json')
    expect(res.status).toBe(200)
    const spec = (await res.json()) as { paths: Record<string, unknown> }
    const paths = Object.keys(spec.paths)
    expect(paths).toContain('/search/all/{keyword}/')
    expect(paths).toContain('/pt/logo/{id_pt}/')
    expect(paths.length).toBeGreaterThan(50)
  })
})
