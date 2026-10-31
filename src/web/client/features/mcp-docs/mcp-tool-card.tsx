// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ToolParametersTable } from './tool-parameters-table'
import type { McpTool } from './types'

/** Reference card for one MCP tool. */
export function McpToolCard({ tool }: { tool: McpTool }) {
  const parameters = Object.entries(tool.inputSchema?.properties ?? {})
  const required = new Set(tool.inputSchema?.required ?? [])
  return (
    <Card id={tool.name} className="scroll-mt-20">
      <CardHeader>
        <CardTitle className="font-mono">{tool.name}</CardTitle>
        {tool.description ? <CardDescription className="whitespace-pre-line">{tool.description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        {parameters.length > 0 ? (
          <ToolParametersTable parameters={parameters} required={required} />
        ) : (
          <p className="text-sm text-muted-foreground">Tanpa parameter.</p>
        )}
      </CardContent>
    </Card>
  )
}
