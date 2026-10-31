// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { text } from '../lib/format.ts'
import { useEndpoint } from '../hooks/use-endpoint.ts'
import { CONTAINER, Header } from './Layout.tsx'
import { Async, Section, Table, Td, Th } from './ui.tsx'

interface JsonSchemaProp {
  type?: string
  description?: string
  enum?: unknown[]
}
interface McpTool {
  name: string
  title?: string
  description?: string
  inputSchema?: {
    properties?: Record<string, JsonSchemaProp>
    required?: string[]
  }
}

/** Human-readable MCP tool reference, fed by GET /mcp/tools (the MCP analogue of the API docs). */
export function McpDocs() {
  const state = useEndpoint<McpTool[]>('/mcp/tools')
  return (
    <>
      <Header />
      <main className="pb-16">
        <div className={`${CONTAINER} pt-8`}>
          <Section title={`Tools MCP${state.data ? ` (${state.data.length})` : ''}`}>
            <p className="mb-4 text-sm text-muted">
              Tools yang diekspos server MCP di <code>POST /mcp</code>. Hubungkan klien (Claude
              Desktop/Code, Claude.ai) — lihat README. Spesifikasi mentah:{' '}
              <a className="text-secondary hover:underline" href="/mcp/tools">/mcp/tools</a>.
            </p>
            <Async state={state} isEmpty={(v) => v.length === 0}>
              {(tools) => (
                <div className="grid gap-5">
                  {tools.map((tool) => {
                    const props = tool.inputSchema?.properties ?? {}
                    const required = new Set(tool.inputSchema?.required ?? [])
                    const params = Object.entries(props)
                    return (
                      <div key={tool.name} className="border border-line bg-surface p-4">
                        <div className="font-mono text-sm font-bold text-primary">{tool.name}</div>
                        {tool.description ? (
                          <p className="mt-1 whitespace-pre-line text-sm text-muted">{tool.description}</p>
                        ) : null}
                        {params.length > 0 ? (
                          <div className="mt-3">
                            <Table
                              head={
                                <>
                                  <Th>Parameter</Th>
                                  <Th>Tipe</Th>
                                  <Th>Wajib</Th>
                                  <Th>Keterangan</Th>
                                </>
                              }
                            >
                              {params.map(([key, prop]) => (
                                <tr key={key} className="hover:bg-bg align-top">
                                  <Td>
                                    <span className="font-mono text-xs">{key}</span>
                                  </Td>
                                  <Td>{text(prop.type)}</Td>
                                  <Td>{required.has(key) ? 'ya' : '—'}</Td>
                                  <Td>
                                    {text(prop.description)}
                                    {prop.enum ? (
                                      <div className="mt-1 flex flex-wrap gap-1">
                                        {prop.enum.map((v) => (
                                          <span key={String(v)} className="bg-secondary/10 px-1.5 py-0.5 font-mono text-xs text-secondary">
                                            {String(v)}
                                          </span>
                                        ))}
                                      </div>
                                    ) : null}
                                  </Td>
                                </tr>
                              ))}
                            </Table>
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-muted">Tanpa parameter.</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </Async>
          </Section>
        </div>
      </main>
    </>
  )
}
