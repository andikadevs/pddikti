// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { text } from '@/lib/format'
import type { ToolParameter } from './types'

interface ToolParametersTableProps {
  parameters: [string, ToolParameter][]
  required: ReadonlySet<string>
}

/** Parameter reference for one MCP tool: name, type, requirement, and allowed values. */
export function ToolParametersTable({ parameters, required }: ToolParametersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Parameter</TableHead>
          <TableHead>Tipe</TableHead>
          <TableHead>Keterangan</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {parameters.map(([name, param]) => (
          <TableRow key={name} className="align-top">
            <TableCell>
              <code className="font-mono text-xs font-medium">{name}</code>
              {required.has(name) ? <span className="ml-1.5 text-xs text-destructive">wajib</span> : null}
            </TableCell>
            <TableCell className="text-muted-foreground">{text(param.type)}</TableCell>
            <TableCell className="whitespace-normal">
              <p>{text(param.description)}</p>
              {param.enum ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {param.enum.map((value) => (
                    <Badge key={String(value)} variant="secondary" className="font-mono">
                      {String(value)}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
