import { afterEach, describe, expect, test } from 'bun:test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { buildMcpServer } from '../src/mcp/server.ts'
import { setUpstream } from '../src/lib/client.ts'
import { UpstreamClient } from '../src/lib/upstream.ts'
import type { FetchLike } from '../src/types.ts'
import { appWithUpstream, applyEnv, jsonFetch } from './helpers.ts'

/** Stub upstream fetch that records requested URLs. */
function recordingFetch(body: unknown, status = 200): { impl: FetchLike; urls: string[] } {
  const urls: string[] = []
  const impl: FetchLike = (input) => {
    urls.push(String(input))
    return Promise.resolve(
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
    )
  }
  return { impl, urls }
}

/** Connect an in-memory MCP client to a fresh server (stubbed upstream already set). */
async function connectClient() {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const server = buildMcpServer()
  await server.connect(serverTransport)
  const client = new Client({ name: 'test', version: '1.0.0' })
  await client.connect(clientTransport)
  return client
}

function textOf(result: { content: unknown }): string {
  const blocks = result.content as Array<{ type: string; text?: string }>
  return blocks.map((b) => b.text ?? '').join('')
}

afterEach(() => {
  setUpstream(undefined)
})

describe('mcp tools', () => {
  test('lists all consolidated tools', async () => {
    applyEnv()
    setUpstream(new UpstreamClient({ baseUrl: 'https://upstream.test', headers: {}, timeoutMs: 1000, fetchImpl: jsonFetch({}) }))
    const client = await connectClient()
    const { tools } = await client.listTools()
    const names = tools.map((t) => t.name).sort()
    expect(names).toEqual(
      [
        'get_lecturer',
        'get_statistics',
        'get_student',
        'get_study_program',
        'get_study_program_lecturers',
        'get_university',
        'get_university_lecturers',
        'get_university_study_programs',
        'list_study_programs_by_field',
        'search_pddikti',
      ].sort(),
    )
  })

  test('GET /mcp/tools exposes the tool catalog as JSON', async () => {
    const app = appWithUpstream(jsonFetch({}))
    const res = await app.request('/mcp/tools')
    expect(res.status).toBe(200)
    const tools = (await res.json()) as Array<{ name: string; inputSchema?: unknown }>
    expect(tools.map((t) => t.name)).toContain('search_pddikti')
    expect(tools.length).toBeGreaterThan(5)
    expect(tools[0]).toHaveProperty('inputSchema')
  })

  test('search_pddikti hits the right upstream and injects credit', async () => {
    applyEnv()
    const rec = recordingFetch([{ nama: 'Institut Teknologi Bandung' }])
    setUpstream(new UpstreamClient({ baseUrl: 'https://upstream.test', headers: {}, timeoutMs: 1000, fetchImpl: rec.impl }))
    const client = await connectClient()
    const result = await client.callTool({
      name: 'search_pddikti',
      arguments: { entity: 'pt', keyword: 'institut' },
    })
    expect(rec.urls[0]).toBe('https://upstream.test/pencarian/pt/institut')
    expect(result.isError).toBeFalsy()
    expect(textOf(result as { content: unknown })).toContain('Institut Teknologi Bandung')
  })

  test('statistics tool resolves the metric to its upstream', async () => {
    applyEnv()
    const rec = recordingFetch({ code: 200, total: 4321 })
    setUpstream(new UpstreamClient({ baseUrl: 'https://upstream.test', headers: {}, timeoutMs: 1000, fetchImpl: rec.impl }))
    const client = await connectClient()
    const result = await client.callTool({ name: 'get_statistics', arguments: { metric: 'pt-count' } })
    expect(rec.urls[0]).toBe('https://upstream.test/pt/count')
    expect(textOf(result as { content: unknown })).toContain('Data © PDDikti')
  })

  test('upstream error envelope surfaces as isError', async () => {
    applyEnv()
    setUpstream(new UpstreamClient({ baseUrl: 'https://upstream.test', headers: {}, timeoutMs: 1000, fetchImpl: jsonFetch({ message: 'nope' }, 404) }))
    const client = await connectClient()
    const result = await client.callTool({ name: 'get_student', arguments: { id_mhs: 'missing' } })
    expect(result.isError).toBe(true)
  })
})

describe('mcp http mount', () => {
  test('initialize handshake returns server info', async () => {
    const app = appWithUpstream(jsonFetch({}))
    const res = await app.request('/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'test', version: '1.0.0' },
        },
      }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as { result?: { serverInfo?: { name?: string } } }
    expect(json.result?.serverInfo?.name).toBe('pddikti')
  })

  test('stays public even when API_KEY is configured', async () => {
    applyEnv({ API_KEY: 'secret' })
    const app = appWithUpstream(jsonFetch({}))
    const res = await app.request('/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'test', version: '1.0.0' },
        },
      }),
    })
    expect(res.status).toBe(200)
  })
})
