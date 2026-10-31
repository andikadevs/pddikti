# Architecture

PDDikti API is a read-only proxy in front of the official PDDikti backend. It adds input
validation, error normalization, caching, generated docs, and an MCP server for AI agents.
It has no database.

## Overview

```text
                 ┌──────────────── this service ────────────────┐
REST client ───► │ Hono middleware ─► /api/* routes ─┐           │
                 │                                   ├─► lib/ ───┼─► Redis cache (optional)
MCP client  ───► │ /mcp (HTTP) or stdio ─► MCP tools ┘    │      │
                 │                                        └──────┼─► PDDikti upstream
Browser     ───► │ React SPA (/, /app.js, /app.css)              │      (behind Cloudflare)
                 └───────────────────────────────────────────────┘
                                           FlareSolverr sidecar ◄── on 403 (optional)
```

## Principles

- **Single egress.** Every upstream call goes through `src/lib/upstream.ts`. It adds headers,
  applies the timeout, unwraps the `{status,data}` envelope, maps errors, and refreshes
  Cloudflare clearance on a `403`. Nothing else calls `fetch`.
- **Two frontends, one core.** The REST routes and the MCP tools both call `src/lib/`
  in-process. They share the same egress, cache, error mapping, and credit envelope. There
  is no second HTTP hop.
- **Zod first.** One schema drives request validation and the OpenAPI document. The spec is
  generated, never hand-written.
- **Generated catalogs.** MCP tool enums derive from the route catalogs, and the MCP tool docs
  derive from the live server. Nothing is listed twice.
- **Config in one place.** `src/config.ts` is the only module that reads the environment.

## Request flow

```text
client
  → middleware: request identity → response headers → availability → API key
  → route handler: validates params with Zod
  → UpstreamClient.get*(): cache lookup, fetch with timeout, envelope unwrap
  → asJson(): injects `credit`, maps `code >= 400` to the HTTP status
  → client
```

## Source layout

```text
src/
  index.ts        entry point: `export default { fetch, port }`
  app.ts          buildApp(): middleware order, route mounting, docs, SEO
  config.ts       loadConfig(): Zod-validated environment, cached
  lib/            upstream client, cache, Cloudflare solver, runtime config, helpers
  middleware/     request identity, availability, API key, response headers
  routes/         one OpenAPIHono sub-app per route group
  schemas/        shared Zod parameters and envelopes
  mcp/            MCP server, tools, stdio and HTTP transports, tool catalog
  web/            SPA bundler, SEO files, React client
tests/            bun:test suites, no network
scripts/          maintenance scripts such as the OpenAPI export
```

## Upstream access

The upstream sits behind Cloudflare bot management. A request needs a `cf_clearance`
cookie and the exact `User-Agent` it was issued to. The service gets them in two ways:

1. **Config page.** An operator pastes the cookie and User-Agent at `/#/config`. The values
   are saved to `CONFIG_STORE_PATH` and applied without a restart.
2. **Auto-solver.** With `SOLVER_ENABLED=true`, a `403` triggers a call to a FlareSolverr
   sidecar. The service stores the fresh clearance and retries the request once.

## Caching

The cache is optional and uses Bun's native Redis client. Keys are the resolved upstream URL
only, because the data is public. Only successful JSON responses are cached. Redis errors
degrade to a cache miss, so the cache changes latency, never correctness.

## Web client

The SPA is React, bundled by a single `Bun.build` call with `bun-plugin-tailwind`. Hono
serves the HTML shell, the JS bundle, and the CSS. There is no Vite and no `dist/` step.
The client talks only to this service's `/api/*` routes.

## MCP server

`src/mcp/server.ts` registers about ten enum-driven tools. Two transports expose them:

- **stdio** (`bun run mcp`) for local clients. stdout is the JSON-RPC channel, so logs go
  to stderr.
- **Streamable HTTP** (`POST /mcp`) for remote clients. It is always public, because browser
  connectors cannot send a static API key.

`GET /mcp/tools` returns the tool catalog as JSON, and the SPA renders it at `/#/mcp`.
