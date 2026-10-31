// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ExternalLinkIcon } from 'lucide-react'
import { AsyncContent } from '@/components/common/async-content'
import { PageContainer } from '@/components/layout/page-container'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { useEndpoint } from '@/hooks/use-endpoint'
import { MCP_TOOLS_PATH } from '@/lib/api-paths'
import { McpToolCard } from './mcp-tool-card'
import type { McpTool } from './types'

/** Reference for the tools the MCP server exposes, fed by the live tool catalog. */
export function McpDocsPage() {
  const state = useEndpoint<McpTool[]>(MCP_TOOLS_PATH)
  return (
    <PageContainer className="space-y-8 pt-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
            Tools MCP
            {state.data ? <Badge variant="secondary">{state.data.length}</Badge> : null}
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Tools yang tersedia di server MCP lewat <code className="font-mono text-sm">POST /mcp</code> (Streamable HTTP)
            atau stdio. Cara menghubungkan klien ada di README.
          </p>
        </div>
        <a href={MCP_TOOLS_PATH} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline' })}>
          Katalog JSON
          <ExternalLinkIcon data-icon="inline-end" />
        </a>
      </div>
      <AsyncContent state={state} isEmpty={(tools) => tools.length === 0}>
        {(tools) => (
          <div className="grid gap-6">
            {tools.map((tool) => (
              <McpToolCard key={tool.name} tool={tool} />
            ))}
          </div>
        )}
      </AsyncContent>
    </PageContainer>
  )
}
