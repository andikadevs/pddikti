// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { randomUUID } from 'node:crypto'
import { Hono } from 'hono'
import type { Context } from 'hono'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { buildMcpServer } from './server.ts'
import type { AppEnv } from '../types.ts'

/**
 * Streamable HTTP transport for remote MCP clients, mounted at `/mcp` on the
 * main app (one Bun process serves REST + SPA + MCP).
 *
 * Uses the SDK's Web-Standard transport, which consumes a Web `Request` and
 * returns a Web `Response` — a native fit for Hono on Bun (no `Bun.serve`, no
 * `@hono/node-server`, no Node req/res shim). Sessions are tracked by
 * `Mcp-Session-Id` so the standard initialize → notifications/initialized →
 * tools/* handshake works across the separate HTTP requests real clients
 * (Claude, MCP Inspector) make. Responses are plain JSON (`enableJsonResponse`).
 * The session map is in-process, so a horizontally-scaled deploy needs sticky
 * sessions (a single replica is fine).
 */
const mcp = new Hono<AppEnv>()

const transports = new Map<string, WebStandardStreamableHTTPServerTransport>()

function rpcError(c: Context<AppEnv>, status: 400, message: string) {
  return c.json({ jsonrpc: '2.0', error: { code: -32000, message }, id: null }, status)
}

mcp.post('/', async (c) => {
  const body = await c.req.json()
  const sessionId = c.req.header('mcp-session-id')

  let transport: WebStandardStreamableHTTPServerTransport
  if (sessionId && transports.has(sessionId)) {
    transport = transports.get(sessionId)!
  } else if (!sessionId && isInitializeRequest(body)) {
    transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      enableJsonResponse: true,
      onsessioninitialized: (sid) => {
        transports.set(sid, transport)
      },
    })
    transport.onclose = () => {
      if (transport.sessionId) transports.delete(transport.sessionId)
    }
    await buildMcpServer().connect(transport)
  } else {
    return rpcError(c, 400, 'No valid session ID, or first request is not an initialize request.')
  }

  return transport.handleRequest(c.req.raw, { parsedBody: body })
})

/** GET (server→client SSE) and DELETE (end session) both need an existing session. */
async function withSession(c: Context<AppEnv>) {
  const sessionId = c.req.header('mcp-session-id')
  if (!sessionId || !transports.has(sessionId)) {
    return rpcError(c, 400, 'Missing or unknown Mcp-Session-Id.')
  }
  return transports.get(sessionId)!.handleRequest(c.req.raw)
}

mcp.get('/', withSession)
mcp.delete('/', withSession)

export default mcp
