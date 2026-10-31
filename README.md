# PDDikti API

[![CI](https://github.com/andikadevs/pddikti/actions/workflows/ci.yml/badge.svg)](https://github.com/andikadevs/pddikti/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/andikadevs/pddikti)](https://github.com/andikadevs/pddikti/releases)
[![License: AGPL-3.0-or-later](https://img.shields.io/badge/license-AGPL--3.0--or--later-blue)](./LICENSE)

Read-only proxy API and MCP server for Indonesian higher-education data from
[PDDikti](https://pddikti.kemdiktisaintek.go.id): universities, study programs, lecturers,
students, and aggregate statistics.

Built with Bun, Hono, and Zod. It ships generated OpenAPI docs, a React explorer, and
automatic Cloudflare clearance through FlareSolverr.

## Features

- **Typed REST API** under `/api/*`, validated with Zod, with Swagger UI and ReDoc.
- **MCP server** over stdio and Streamable HTTP, so AI agents can query the same data.
- **Web explorer**: search a university and browse its profile, study programs, lecturers,
  and students.
- **Hands-off upstream access**: a FlareSolverr sidecar refreshes the Cloudflare cookie on a
  `403`. A password-protected config page is the manual fallback.
- **Optional Redis cache** and **optional API key** for the REST surface.
- **One-command deployment** with Docker Compose.

## Contents

- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Usage](#usage)
- [MCP clients](#mcp-clients)
- [Upstream access](#upstream-access)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)
- [Disclaimer](#disclaimer)

## Quick start

### Docker Compose (recommended)

Runs the API, a FlareSolverr sidecar, and Redis.

```sh
git clone https://github.com/andikadevs/pddikti.git
cd pddikti
cp .env.example .env    # set UPSTREAM_BASE_URL and REDIS_PASSWORD
docker compose up -d
```

The API container listens on port `3000` inside the Compose network and does not publish a
host port. Route your reverse proxy to `api:3000`, or add a `ports` entry for local use.
FlareSolverr and Redis stay internal.

### Local (Bun)

Requires [Bun](https://bun.com) 1.3 or newer.

```sh
bun install
cp .env.example .env    # set UPSTREAM_BASE_URL
bun run dev
```

Open <http://localhost:3000>.

### Single container

Without the solver, refresh the Cloudflare cookie by hand on the config page.

```sh
docker build -t pddikti .
docker run -p 3000:3000 --env-file .env pddikti
```

## Configuration

The service reads the environment once, in `src/config.ts`. Bun loads `.env` automatically.
See [`.env.example`](./.env.example) for every variable.

| Variable                        | Default                 | Purpose                                                       |
| ------------------------------- | ----------------------- | ------------------------------------------------------------- |
| `PORT`                          | `3000`                  | Listen port.                                                  |
| `PUBLIC_BASE_URL`               | `http://localhost:3000` | Absolute base URL for docs links and `secure` cookies.        |
| `UPSTREAM_BASE_URL`             | none                    | Upstream base, `https://pddikti.kemdiktisaintek.go.id/api`.   |
| `UPSTREAM_TIMEOUT_MS`           | `15000`                 | Timeout per upstream request.                                 |
| `API_KEY`                       | empty (off)             | Protects `/api/*` with `X-API-Key`. Empty means public.       |
| `SESSION_TTL_S`                 | `86400`                 | Lifetime of the SPA session and config cookies.               |
| `CONFIG_PASSWORD`               | empty (off)             | Enables the `/#/config` page. Empty disables it (404).        |
| `CONFIG_STORE_PATH`             | `./runtime-config.json` | File for runtime overrides and the solved cookie.             |
| `SOLVER_ENABLED`                | `false`                 | Solve Cloudflare challenges with FlareSolverr on a `403`.     |
| `SOLVER_URL`                    | none                    | FlareSolverr `/v1` endpoint.                                  |
| `CACHE_ENABLED` / `CACHE_TTL_S` | `false` / `600`         | Optional Redis response cache.                                |
| `CREDIT_LINE`                   | `Data © PDDikti`        | Attribution added to every JSON response.                     |

> [!IMPORTANT]
> For a public deployment, put a TLS-terminating reverse proxy in front, set
> `PUBLIC_BASE_URL` to the HTTPS URL, and set strong values for `API_KEY` and
> `CONFIG_PASSWORD`. See [SECURITY.md](./SECURITY.md) for the full checklist.

## Usage

### REST API

| Path                | Description                         |
| ------------------- | ----------------------------------- |
| `/api/`             | Overview and service status         |
| `/api/docs`         | Swagger UI                          |
| `/api/redoc`        | ReDoc                               |
| `/api/openapi.json` | Live OpenAPI document               |

A static copy of the spec lives in [`openapi.json`](./openapi.json) for offline use.

When `API_KEY` is set, send it on every data request:

```sh
curl -H "X-API-Key: $API_KEY" http://localhost:3000/api/search/all/telkom/
```

Every JSON response includes a `credit` field. Upstream errors keep their HTTP status.

### Web explorer

`GET /` serves a React app. Search a university to see its profile, statistics, costs,
study duration, study programs, all lecturers, a student search, facilities, and name
history. The selected university is kept in the URL hash (`#/pt/<id>`).

### MCP server

The MCP server exposes about ten tools, such as `search_pddikti`, `get_university`,
`get_lecturer`, and `get_statistics`. The tools use the same upstream client, cache, and
credit envelope as the REST API.

| Transport       | How to run                    | Use for        |
| --------------- | ----------------------------- | -------------- |
| stdio           | `bun run mcp`                 | Local clients  |
| Streamable HTTP | `POST /mcp` on the server     | Remote clients |

The tool catalog is at `GET /mcp/tools` (JSON) and `/#/mcp` (readable view).

> [!NOTE]
> `/mcp` is always public, even when `API_KEY` is set. Browser connectors cannot send a
> static header, so only the `/api/*` REST surface is key-protected.

## MCP clients

### Claude Code

```sh
# Local, over stdio
claude mcp add pddikti -- bun run /abs/path/to/pddikti/src/mcp/stdio.ts

# Remote, over HTTP
claude mcp add --transport http pddikti https://<host>/mcp
```

The repository also includes a project-scoped [`.mcp.json`](./.mcp.json).

### Claude Desktop and other stdio clients

Add the server to the client's config file, for example `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pddikti": {
      "command": "bun",
      "args": ["run", "/abs/path/to/pddikti/src/mcp/stdio.ts"],
      "env": {
        "UPSTREAM_BASE_URL": "https://pddikti.kemdiktisaintek.go.id/api",
        "CONFIG_STORE_PATH": "/abs/path/to/pddikti/runtime-config.json"
      }
    }
  }
}
```

Point `CONFIG_STORE_PATH` at the file the config page writes, so the stdio server reuses
the same Cloudflare cookie. You can also set `SOLVER_ENABLED` and `SOLVER_URL`.

### Claude.ai and other web clients

Add a custom connector with the URL `https://<host>/mcp`.

### Test the server

```sh
bun run mcp:inspect    # MCP Inspector against the stdio server

curl -s https://<host>/mcp -X POST \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"probe","version":"1"}}}'
```

## Upstream access

The PDDikti backend is protected by Cloudflare bot management. Each request needs a
`cf_clearance` cookie and the exact `User-Agent` it was issued to. Without them, the
upstream returns `403`. Without `UPSTREAM_BASE_URL`, `/api/*` returns `503`.

You supply the cookie at runtime, not in `.env`:

- **Automatic.** Set `SOLVER_ENABLED=true` and `SOLVER_URL`. On a `403`, the service asks
  FlareSolverr to solve the challenge, saves the new cookie to `CONFIG_STORE_PATH`, and
  retries once. FlareSolverr runs its own headless browser, so this works on a server with
  no display.
- **Manual.** Set `CONFIG_PASSWORD` and open `/#/config`. Paste the cookie and User-Agent,
  or a full "Copy as cURL" from your browser's DevTools. Changes apply without a restart
  and persist across restarts.

## Development

| Command                  | Purpose                                      |
| ------------------------ | -------------------------------------------- |
| `bun run dev`            | Dev server with hot reload                   |
| `bun run start`          | Production server                            |
| `bun run mcp`            | MCP server over stdio                        |
| `bun run mcp:dev`        | MCP server over stdio with hot reload        |
| `bun run mcp:inspect`    | MCP Inspector against the stdio server       |
| `bun run openapi:export` | Regenerate the static `openapi.json`         |
| `bun run typecheck`      | Type-check with `tsc --noEmit`               |
| `bun test`               | Run the test suite (no network access)       |

A change is done when `bun run typecheck` is clean and `bun test` is green.

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md): design, request flow, and source layout.
- [CLAUDE.md](./CLAUDE.md): detailed coding conventions.
- [CHANGELOG.md](./CHANGELOG.md): release history.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) and the
[Code of Conduct](./CODE_OF_CONDUCT.md) first. Report security problems privately, as
described in [SECURITY.md](./SECURITY.md).

## License

Copyright © 2026 [Andika Dwi Saputra](https://andikadevs.space).

Licensed under the [GNU Affero General Public License v3.0 or later](./LICENSE). You may use,
study, modify, and share this software. If you run a modified version as a network service,
you must offer its complete source code to the service's users under the same license.

## Disclaimer

This is a personal, non-commercial project for education and learning.

- **Not affiliated** with or endorsed by PDDikti, Kemdiktisaintek, or Cloudflare. All upstream
  data is © PDDikti. Other names belong to their owners.
- **No warranty.** The software is provided "as is", with no guarantee of accuracy,
  availability, or fitness for any purpose. See the [license](./LICENSE).
- **No liability for misuse.** The author is not responsible for how this software is used
  or for any damage that results. You use it at your own risk.
- **Your responsibility.** Follow all applicable laws and the terms of service of every
  system you reach, including the upstream's terms and its anti-bot and rate-limit
  protections. Do not use this software to overload, disrupt, or mass-scrape any service, or
  to process personal data unlawfully.
