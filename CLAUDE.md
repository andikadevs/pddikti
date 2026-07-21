# CLAUDE.md — PDDikti API (Bun + Hono)

Guidance for any agent or contributor working in this repo. Follow it exactly; it
overrides default habits. When a rule here conflicts with something you'd normally do,
this file wins.

## What this is

A **read-only proxy API** in front of a private upstream PDDikti data source (Indonesian
higher-education data: universities `pt`, study programs `prodi`, lecturers `dosen`,
students `mahasiswa`, plus aggregate `stats`). The client calls *this* API; this API
forwards to the upstream with auth headers, normalizes errors, injects a credit line, and
serves OpenAPI docs.

Stack: **Bun** (runtime, package manager, test runner) + **Hono** (`OpenAPIHono`) +
**Zod** (validation & OpenAPI generation). No database. Inbound auth is **optional**: when
`API_KEY` is set, `/api/*` data endpoints require it via an `X-API-Key` header (or the
`pddikti_session` httpOnly cookie the SPA gets from `GET /`); overview + docs stay public,
and an empty `API_KEY` leaves it a public gateway (see `middleware/api-key.ts`).

## Data flow

```
client → Hono middleware (identity → availability → headers)
       → route handler (validates params via Zod)
       → UpstreamClient.get*(...)  (fetch + auth headers + timeout)
       → asJson() (credit injection, code>=400 → HTTP status)
       → client
```

## Project layout

```
src/
  index.ts          entry — `export default { fetch, port }` (Bun serves it)
  app.ts            buildApp(): OpenAPIHono, middleware order, mounts /api, docs, seo
  config.ts         loadConfig(): zod-validated env, cached singleton — ONLY place env is read
  types.ts          AppEnv: Hono Env bindings (Variables: clientIp, userAgent)
  lib/
    upstream.ts     UpstreamClient — the single HTTP egress point
    cache.ts        Cache (Redis-backed or no-op) — getCache() singleton
    response.ts     asJson(), error envelope builders
    encoding.ts     quoteSegment()
    user-agents.ts  random UA pool
  middleware/       request-identity.ts, availability.ts, headers.ts
  schemas/common.ts shared Zod params + response/error envelopes
  routes/           one file per group; each exports an OpenAPIHono sub-app
  web/seo.ts        robots.txt + sitemap.xml
  web/client-bundle.ts  single Bun.build (JS + Tailwind CSS via bun-plugin-tailwind), cached
  web/client/       React SPA — index.html, index.tsx (createRoot+StrictMode), App.tsx,
                    components/ (UI + views), hooks/ (use-endpoint, use-selected-pt,
                    use-debounced-value), lib/ (constants, format, theme), styles.css
tests/              *.test.ts (bun:test)
```

## Web client (root `/`)

- Root serves a **React SPA** (a generic PT profile explorer: search → pick → profile,
  selection carried in the URL hash `#/pt/<id>`), all native, no Vite:
  `GET /` returns the HTML shell, `GET /app.js` the **`Bun.build`** browser bundle, and
  `GET /app.css` the **Tailwind v4** stylesheet — both produced by a **single `Bun.build`**
  with **`bun-plugin-tailwind`** (the `index.tsx` entry imports `styles.css`; no separate
  Tailwind CLI process), in `web/client-bundle.ts`. Both are cached and rebuilt per request
  when `DEBUG`. Do not add `Bun.serve`, Vite, or a `dist/` build step.
- Organize the client: **`components/`** (UI primitives in `ui.tsx`, plus view components),
  **`hooks/`** (React hooks — `use-endpoint`, `use-selected-pt`, `use-debounced-value`;
  kebab-case, one hook concern per file), **`lib/`** (pure non-React utils — `constants`,
  `format` the shared `text`/`year`/`num` helpers, `theme`). Don't re-inline shared helpers
  into components.
- Styling is **Tailwind v4, CSS-first** (`styles.css`: `@import "tailwindcss"`, palette in
  `@theme`, `@source "./**/*.tsx"`). The design is **flat** — radius tokens are `0` and no
  `rounded-*` utilities are used. Keep it that way.
- `web/client/` is **React JSX** (`jsx: react-jsx`, `jsxImportSource: react` in tsconfig).
  Server code uses no JSX. The client only talks to this API's own `/api/*` routes — never
  the upstream directly — and reads upstream fields defensively (shapes are not guaranteed).
- Aggregation endpoints (e.g. `GET /api/pt/lecturers/{id}/{smt}/` fanning out `dosen/homebase`
  across active prodi) still route all egress through `getUpstream()`, cap concurrency
  (`lib/pool.ts` `mapLimit`), dedupe, and cache in-memory. Students have no list endpoint
  upstream — only keyword search (`/api/search/mhs/...`).

One route group = one file = one mounted sub-app. Do not split a group across files or
merge groups.

## MCP server (`src/mcp/`)

A **second frontend on top of `src/lib/`** that lets AI agents reach the same data over the
**Model Context Protocol**. It is *not* a network client of this API — the tools call
`getUpstream().get*()` **in-process**, so they reuse the exact egress, Redis cache, error
mapping, and `withCredit` envelope as the REST routes. No second HTTP hop.

- `mcp/server.ts` — `buildMcpServer()`: transport-agnostic `McpServer`, registers all tools.
- `mcp/tools.ts` — **~10 consolidated, enum-driven tools** (`search_pddikti`, `get_university`,
  `get_lecturer`, `get_statistics`, …). The enum values + descriptions are **derived from the
  exported route catalog arrays** (`ENTITIES`, `BY_ID`, `ROUTES`, `FIELDS`, …) so there is one
  source of truth — never hand-list endpoints here. `toToolResult()` mirrors the HTTP layer:
  credit injection, `isError` for `code >= 400`, base64 image content for logos.
- `mcp/stdio.ts` — stdio entry (`bun run src/mcp/stdio.ts`); for local clients (Claude
  Desktop/Code). **stdout is the JSON-RPC channel — log only via `console.error`.**
- `mcp/http.ts` — Streamable HTTP via the SDK's `WebStandardStreamableHTTPServerTransport`
  (consumes a Web `Request`, returns a Web `Response` — native Hono/Bun fit, no `Bun.serve` /
  `@hono/node-server` / Node-shim), mounted at **`POST /mcp`** on the main app. Session-tracked
  via `Mcp-Session-Id` (in-process map; single replica or sticky sessions). **Always public**
  (no `X-API-Key` gate) regardless of `API_KEY`, so browser connectors like claude.ai — which
  can't send a static header — can reach it; only the `/api/*` REST surface stays key-gated.

Cross-prodi aggregations with no single upstream (e.g. all university lecturers) live in
`lib/aggregate.ts` and are shared by both the HTTP route and the MCP tool.

## Bun conventions

- Run/dev/test with Bun only: `bun install`, `bun run dev`, `bun test`, `bun run start`.
- The app is exported as `export default { port, fetch: app.fetch }` from `src/index.ts`;
  Bun serves the default export. Do **not** add `@hono/node-server` or `Bun.serve` by hand.
- Tests use `bun:test` (`import { describe, expect, test } from "bun:test"`).
- Bun does not type-check. Run `bun run typecheck` (`tsc --noEmit`) before declaring done.
- Read env through `config.ts` only. Never touch `process.env` / `Bun.env` elsewhere.

## Hono conventions

- Use `OpenAPIHono` (from `@hono/zod-openapi`) everywhere, not bare `Hono` — every route is
  declared with `createRoute` so OpenAPI stays generated, never hand-maintained.
- **Write handlers inline** in `app.openapi(route, handler)` for correct param type
  inference. No separate "controller" modules.
- Organize by feature with `app.route('/api', group)`. Each `routes/*.ts` exports a
  configured `OpenAPIHono` instance.
- Prefer Hono built-in middleware over hand-rolled: `hono/logger`, `hono/cors`,
  `hono/pretty-json`, `hono/secure-headers`, `hono/request-id`. Only write custom
  middleware for behavior they don't cover (identity capture, availability gating, the
  extra SEO/credit headers).
- Pass data between middleware and handlers via typed `c.set()` / `c.get()` (see `AppEnv`).
- Set the OpenAPI doc at `/api/openapi.json` (`app.doc`), Swagger UI at `/api/docs`,
  ReDoc at `/api/redoc`.

## TypeScript conventions

- `strict` + `noUncheckedIndexedAccess` are on. Honor them.
- **No `any`.** The one sanctioned exception: upstream response **payloads** are typed
  `z.unknown()` — this proxy must not constrain arbitrary upstream JSON. Validate inputs
  strictly; pass bodies through opaquely.
- Derive types from schemas with `z.infer`; don't redeclare a shape that a Zod schema
  already defines.
- Use `satisfies` for config/catalog literals to keep literal types without losing checking.
- Use `as const` for static catalogs (e.g. the sitemap path list, bidang-ilmu fields).
- Type the Hono context once as `AppEnv` in `types.ts`; thread it through generics.

## Upstream client contract (`lib/upstream.ts`)

- The **only** place that performs network egress. Routes never call `fetch` directly.
- Built on native `fetch` + `AbortController` for `UPSTREAM_TIMEOUT_MS`.
- Sends configured `UPSTREAM_HEADERS`, a random `User-Agent`, and forwards caller identity
  (`X-Forwarded-For`, `X-Real-IP`, `X-Original-User-Agent`) taken from the request context
  passed in by the handler — no global mutable state.
- Path segments are encoded with `quoteSegment()` (decode-then-`encodeURIComponent`).
- Error mapping (return a plain object with numeric `code`): timeout → 408,
  connection/network error → 503, unexpected → 500, upstream HTTP `>=400` → passthrough
  that status. Image responses (`pt/logo`) return raw bytes + content-type, not JSON.
- Method shapes: `get(endpoint, params?)`, `getWithKeyword(endpoint, kw)`,
  `getWithIdAndSemester(endpoint, id, smt)` (path), `getWithIdAndParamSemester(endpoint,
  id, smt)` (query `?semester=`), `getImage(endpoint, id)`.

## Caching (`lib/cache.ts`)

- Optional Redis cache via **Bun's native `RedisClient`** (no extra dependency). `getCache()`
  returns a `NoopCache` when `CACHE_ENABLED=false`, else a `RedisCache`. Mirrors the
  `getUpstream()`/`setUpstream()` singleton + test-override pattern (`setCache`, `closeCache`).
- Data is **public**, so cache keys are the resolved upstream URL only (`up:<url>`); caller
  identity is never part of the key. Images and error envelopes (`code >= 400`) are not cached;
  only `resolveStatus === 200` results are stored, with `CACHE_TTL_S` TTL.
- **Graceful by design**: Redis errors are swallowed (logged only under `DEBUG`) and degrade to
  a cache miss → passthrough to the upstream. Caching never changes correctness, only latency.
- Connection config (read only via `config.ts`): `REDIS_URL` wins verbatim; otherwise
  `REDIS_HOST/PORT/USERNAME/PASSWORD/DB` are assembled (credentials URL-encoded).

## Response & error conventions

- All JSON object responses get a `credit` field (from `CREDIT_LINE`) via `asJson()`.
- If an upstream/proxy result is an object with numeric `code >= 400`, `asJson()` sets the
  HTTP status to that code. Otherwise 200.
- The availability middleware returns a fixed 503 envelope for `/api/*` (except overview &
  docs) when `API_AVAILABILITY=false`.
- Never invent fields the client didn't ask for beyond `credit` and documented envelopes.

## Naming

- Files: kebab-case (`prodi-bidang-ilmu.ts`, `request-identity.ts`).
- Inbound paths keep the original public surface (English-ish): `/api/search/...`,
  `/api/pt/...`, `/api/stats/...`. Upstream endpoint strings stay in the upstream's own
  vocabulary (`pencarian/...`, `visualisasi/...`).
- Operation IDs in OpenAPI: `camelCase`, descriptive (`searchAll`, `ptDetail`, `mhsCountByGender`).

## Testing

- `bun test`. Cover: overview works without upstream, availability gating, param
  validation rejects empties, error mapping, and that `asJson` injects credit.
- Use `hono/testing` `testClient` or `app.request()` — no live server, no real upstream.
  Inject a stub fetch / stub UpstreamClient; never hit the network in tests.

## Definition of done (run before every "done")

1. `bun run typecheck` — clean.
2. `bun test` — green.

## Commits

Conventional Commits, imperative, lower-case scope: `feat(api): add dosen routes`,
`feat(upstream): fetch-based proxy client`, `chore:`, `test:`, `docs:`, `fix:`.
Commit per logical unit (one route group per commit). Never `git add .env`.
