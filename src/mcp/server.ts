// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { loadConfig } from '../config.ts'
import { registerTools } from './tools.ts'

/**
 * Build the PDDikti MCP server. Transport-agnostic: the same instance backs the
 * stdio entry (`mcp/stdio.ts`) and the stateless Streamable HTTP mount
 * (`mcp/http.ts`). Tools call `getUpstream()` in-process — identical egress,
 * cache, and error handling as the REST routes; no second HTTP hop.
 */
export function buildMcpServer(): McpServer {
  const config = loadConfig()
  const server = new McpServer({
    name: 'pddikti',
    version: config.API_VERSION,
  })
  registerTools(server)
  return server
}
