# PDDikti API

Bun + Hono API providing structured access to Indonesia higher-education data (PDDikti):
universities, study programs, lecturers, students, and aggregate statistics.

This service is a typed proxy in front of a private upstream PDDikti data source, with
auto-generated OpenAPI docs.

## Requirements

- [Bun](https://bun.com) ≥ 1.3

## Setup

```sh
bun install
cp .env.example .env   # fill UPSTREAM_BASE_URL and UPSTREAM_HEADERS
```

## Run

```sh
bun run dev     # hot reload
bun run start   # production
```

Open http://localhost:3000

## Web UI

- `GET /` — flat React **PT profile explorer**: search a university, pick one, and see its
  profile, stats, cost, study duration, study programs, **all lecturers**, **student
  search**, facilities, and name history. The selected university is carried in the URL hash
  (`#/pt/<id>`). Bundled natively with `Bun.build` (JS) + Tailwind v4 CLI (CSS), no Vite.
  Requires a configured upstream (below) to show live data.

## Docs

- Overview: `GET /api/`
- Swagger UI: `/api/docs`
- ReDoc: `/api/redoc`
- OpenAPI spec: `/api/openapi.json` (live)
- Static spec: [`openapi.json`](./openapi.json) in the repo, for offline agent
  reference. Regenerate after route changes with `bun run openapi:export`
  (set `PUBLIC_BASE_URL` to stamp the `servers` URL, e.g.
  `PUBLIC_BASE_URL=https://<host> bun run openapi:export`).

## MCP (AI agent access)

The same data is exposed to AI agents over the **Model Context Protocol**. Tools are
consolidated and enum-driven (~10): `search_pddikti`, `get_university`,
`get_university_study_programs`, `get_university_lecturers`, `get_study_program`,
`get_study_program_lecturers`, `get_lecturer`, `get_student`, `get_statistics`,
`list_study_programs_by_field`. Each routes through the same proxy egress, cache, and
credit envelope as the REST API.

Two transports:

- **stdio** — `bun run mcp` (runs `src/mcp/stdio.ts`). For local clients.
- **Streamable HTTP** — `POST /mcp` on the running server. For remote/hosted clients.
  Always public (no API key) — even when `/api/*` is gated by `API_KEY` — so browser
  clients like Claude.ai, which can't send a static `X-API-Key`, can connect.

### Claude Code (CLI)

Local (stdio) — from the repo root, env comes from `.env`:

```sh
claude mcp add pddikti -- bun run /abs/path/to/pddikti/src/mcp/stdio.ts
```

Or commit a project-scoped `.mcp.json` (already included — fill the env):

```json
{
  "mcpServers": {
    "pddikti": {
      "command": "bun",
      "args": ["run", "./src/mcp/stdio.ts"],
      "env": {
        "UPSTREAM_BASE_URL": "https://api-pddikti.kemdiktisaintek.go.id",
        "UPSTREAM_HEADERS": "{\"X-User-IP\":\"1.1.1.1\",\"Origin\":\"https://pddikti.kemdiktisaintek.go.id\",\"Referer\":\"https://pddikti.kemdiktisaintek.go.id/\"}"
      }
    }
  }
}
```

Remote (HTTP) against a deployed instance:

```sh
claude mcp add --transport http pddikti https://<host>/mcp
```

### Claude Desktop

Edit `claude_desktop_config.json` (Settings → Developer → Edit Config) — same shape as
`.mcp.json` above under `mcpServers`. Restart the app; tools appear under the 🔌 menu.

### Claude.ai (web)

Settings → **Connectors** → *Add custom connector* → URL `https://<host>/mcp`. The web UI
cannot send a static `X-API-Key`/Basic-auth header, so `/mcp` is intentionally public (no
key) regardless of `API_KEY` — the web connector works out of the box. Only the `/api/*`
REST surface is key-gated.

### Quick test

```sh
bun run mcp:inspect    # MCP Inspector against the stdio server

# Or hit the HTTP endpoint directly (initialize handshake):
curl -s https://<host>/mcp -X POST \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"probe","version":"1"}}}'
```

## Upstream config

This API proxies the official public PDDikti backend. Set in `.env`:

```
UPSTREAM_BASE_URL=https://api-pddikti.kemdiktisaintek.go.id
UPSTREAM_HEADERS={"X-User-IP":"1.1.1.1","Origin":"https://pddikti.kemdiktisaintek.go.id","Referer":"https://pddikti.kemdiktisaintek.go.id/"}
```

Without `UPSTREAM_BASE_URL`, `/api/*` returns a clean `503` envelope (no data).

## Scripts

| Script | Purpose |
|---|---|
| `bun run dev` | Hot-reloading dev server |
| `bun run start` | Run server |
| `bun run mcp` | Run the MCP server over stdio |
| `bun run mcp:dev` | MCP server (stdio) with hot reload |
| `bun run mcp:inspect` | Launch MCP Inspector against the stdio server |
| `bun test` | Run tests |
| `bun run typecheck` | `tsc --noEmit` |

## Project conventions

See [CLAUDE.md](./CLAUDE.md).
