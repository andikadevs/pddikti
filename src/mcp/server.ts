// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { loadConfig } from '../config.ts'
import { registerTools } from './tools.ts'

/** Server-level guidance sent in `initialize`: how the tools fit together. */
const INSTRUCTIONS = [
  'Read-only access to PDDikti, the Indonesian national higher-education database:',
  'universities (PT), study programs (prodi), lecturers (dosen), students (mahasiswa),',
  'and national statistics. No tool changes any data.',
  'Workflow: call search_pddikti first to turn a name, NIM, or NIDN into an opaque id,',
  'then pass that id to the matching get_* tool. Ids are never guessable; do not invent them.',
  'Semester codes are YYYYS, where S is 1 (odd/ganjil) or 2 (even/genap), e.g. "20241".',
  'Every result is JSON with a "credit" field; errors come back with isError and an',
  'upstream status "code" (404 not found, 403/503 upstream unavailable, 408 timeout).',
].join(' ')

/**
 * Build the PDDikti MCP server. Transport-agnostic: the same instance backs the
 * stdio entry (`mcp/stdio.ts`) and the stateless Streamable HTTP mount
 * (`mcp/http.ts`). Tools call `getUpstream()` in-process — identical egress,
 * cache, and error handling as the REST routes; no second HTTP hop.
 */
export function buildMcpServer(): McpServer {
  const config = loadConfig()
  const server = new McpServer(
    {
      name: 'pddikti',
      title: 'PDDikti',
      version: config.API_VERSION,
      websiteUrl: 'https://github.com/andikadevs/pddikti',
    },
    { instructions: INSTRUCTIONS },
  )
  registerTools(server)
  return server
}
