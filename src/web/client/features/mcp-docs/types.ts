// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

/** JSON Schema of one tool parameter, as listed by `GET /mcp/tools`. */
export interface ToolParameter {
  type?: string
  description?: string
  enum?: unknown[]
}

/** One MCP tool from the catalog. */
export interface McpTool {
  name: string
  title?: string
  description?: string
  inputSchema?: {
    properties?: Record<string, ToolParameter>
    required?: string[]
  }
}
