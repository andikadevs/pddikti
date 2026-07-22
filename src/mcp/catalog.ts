import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { buildMcpServer } from './server.ts'

/**
 * The MCP tool catalog — each tool's name, title, description, and JSON-Schema input,
 * exactly as an MCP client sees it. Built by listing tools over an in-memory transport
 * (no network, no upstream), then cached: the tool set is static per process.
 *
 * Backs `GET /mcp/tools` and the React "MCP Docs" view, the MCP analogue of the REST
 * OpenAPI spec / Swagger UI.
 */

let cached: Promise<unknown[]> | undefined

async function build(): Promise<unknown[]> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const server = buildMcpServer()
  const client = new Client({ name: 'pddikti-docs', version: '1.0.0' })
  await server.connect(serverTransport)
  await client.connect(clientTransport)
  try {
    const { tools } = await client.listTools()
    return tools as unknown[]
  } finally {
    await client.close()
    await server.close()
  }
}

export function getToolCatalog(): Promise<unknown[]> {
  if (!cached) {
    cached = build().catch((err) => {
      cached = undefined // let the next request retry a failed build
      throw err
    })
  }
  return cached
}
