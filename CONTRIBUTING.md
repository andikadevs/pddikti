# Contributing

Thanks for your interest in improving PDDikti API. This guide covers how to set up the
project, the rules every change follows, and how to get a change merged.

By taking part you agree to follow the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Before you start

- **Bugs and features:** open an [issue](https://github.com/andikadevs/pddikti/issues) first,
  so we can agree on the approach before you write code.
- **Security problems:** do not open a public issue. Follow [SECURITY.md](./SECURITY.md).
- **Scope:** this is a read-only proxy. Changes that write to the upstream, bypass its rate
  limits, or collect personal data beyond what the upstream already exposes will not be
  accepted.

## Development setup

Requirements: [Bun](https://bun.com) 1.3 or newer.

```sh
git clone https://github.com/andikadevs/pddikti.git
cd pddikti
bun install
cp .env.example .env
bun run dev
```

The server listens on <http://localhost:3000>. Tests never touch the network, so you do not
need upstream access to work on most changes.

## Project rules

The full conventions live in [CLAUDE.md](./CLAUDE.md) and the design overview in
[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md). The short version:

- **Single egress.** Only `src/lib/upstream.ts` performs network calls. Routes and MCP tools
  never call `fetch` directly.
- **Zod first.** Declare every route with `createRoute`, so the OpenAPI document stays
  generated. Derive types with `z.infer` instead of redeclaring shapes.
- **Strict TypeScript.** No `any`. Upstream payloads are the one exception and stay
  `z.unknown()`.
- **Config through `src/config.ts` only.** Never read `process.env` or `Bun.env` elsewhere.
- **One route group per file.** Each `src/routes/*.ts` exports one `OpenAPIHono` sub-app.
- **File names in kebab-case.**
- **License header.** Start every new source file with:

  ```ts
  // SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
  // SPDX-License-Identifier: AGPL-3.0-or-later
  ```

## Checks

Run both before you open a pull request. CI runs the same commands.

```sh
bun run typecheck   # tsc --noEmit, must be clean
bun test            # must be green, no network access
```

Add or update tests for every behavior change. Use `app.request()` or a stub
`UpstreamClient`; never call the real upstream from a test.

If you change a route, regenerate the static spec:

```sh
bun run openapi:export
```

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/) with an imperative,
lower-case summary:

```text
feat(api): add dosen routes
fix(upstream): map timeouts to 408
docs: explain the auto-solver
```

Common types: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `ci`, `chore`.
Keep one logical change per commit, and never commit `.env` or `runtime-config.json`.

## Pull requests

1. Fork the repository and create a branch from `main`.
2. Make your change with tests, and run the checks above.
3. Add a line under `## [Unreleased]` in [CHANGELOG.md](./CHANGELOG.md) for user-facing
   changes.
4. Open the pull request and fill in the template.

## Releases

The project follows [Semantic Versioning](https://semver.org/). Maintainers cut a release
by moving the `Unreleased` changelog entries under a new version heading, bumping
`version` in `package.json`, and pushing an annotated `vX.Y.Z` tag.

## License

By contributing, you agree that your contributions are licensed under the
[GNU Affero General Public License v3.0 or later](./LICENSE).
