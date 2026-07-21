import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { buildMcpServer } from './server.ts'

/**
 * stdio entry point for local MCP clients (Claude Desktop / Claude Code).
 * Run with `bun run src/mcp/stdio.ts`.
 *
 * stdout is the JSON-RPC channel — all diagnostics MUST go to stderr
 * (`console.error`); a stray `console.log` would corrupt the protocol stream.
 */
const server = buildMcpServer()
const transport = new StdioServerTransport()
await server.connect(transport)
console.error('[mcp] pddikti server ready on stdio')
