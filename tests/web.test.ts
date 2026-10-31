// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { beforeEach, describe, expect, test } from 'bun:test'
import { appNoUpstream, applyEnv } from './helpers.ts'

describe('web SPA routes', () => {
  beforeEach(() => applyEnv())

  test.each(['/', '/mcp/docs', '/config', '/pt/abc%3D%3D'])('serves the HTML shell at %s', async (path) => {
    const res = await appNoUpstream().request(path)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
    expect(await res.text()).toContain('<div id="root">')
  })

  test('keeps the JSON APIs that share a prefix with SPA paths', async () => {
    const app = appNoUpstream()
    expect((await app.request('/config/state')).headers.get('content-type')).toContain('application/json')
    expect((await app.request('/mcp/tools')).headers.get('content-type')).toContain('application/json')
  })

  test('mounts the live-reload endpoint only under DEBUG', async () => {
    expect((await appNoUpstream().request('/__dev/reload.js')).status).toBe(404)
  })
})
