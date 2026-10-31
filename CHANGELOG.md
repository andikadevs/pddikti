# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Contributing guide, security policy, code of conduct, and issue and pull request templates.
- Architecture guide in `docs/ARCHITECTURE.md`.
- GitHub Actions CI (typecheck, tests, Docker build) and Dependabot updates.
- SPDX license headers on every source file.
- OCI image labels and a container health check.
- Package metadata: author, repository, homepage, keywords, and Bun engine floor.

### Changed

- Pin all dependencies to exact versions.
- Rewrite the README for quicker onboarding.

## [0.7.0] - 2026-09-08

### Added

- Derive the upstream origin and send browser-like default headers on every request.

## [0.6.0] - 2026-07-22

### Added

- Self-contained Docker Compose stack: API, FlareSolverr, and password-protected Redis with
  persistent volumes.
- Docker setup, configuration reference, and architecture sections in the README.

## [0.5.0] - 2026-07-22

### Added

- MCP tool docs: a JSON catalog at `GET /mcp/tools` and a readable view at `/#/mcp`.

### Changed

- Pin the web header to the top of the page while scrolling.

## [0.4.0] - 2026-07-22

### Changed

- Rebuild the config page as a React view backed by a JSON API, sharing the site header.

## [0.3.0] - 2026-07-21

### Added

- Automatic Cloudflare clearance through a FlareSolverr sidecar when the upstream returns `403`.
- Navigation link to the config page.
- Educational-use disclaimer.

### Fixed

- Login on the config page no longer fails on a strict Origin/Referer check.

## [0.2.0] - 2026-07-21

### Added

- Password-protected runtime config page for the Cloudflare cookie and User-Agent.

### Fixed

- Reach the Cloudflare-protected upstream and unwrap its response envelope.

## [0.1.0] - 2026-07-21

### Added

- Read-only proxy API for PDDikti data: search, universities, study programs, lecturers,
  students, and statistics.
- Zod-validated routes with generated OpenAPI docs, Swagger UI, and ReDoc.
- MCP server over stdio and Streamable HTTP.
- React university explorer.
- Optional API key and Redis cache.

[Unreleased]: https://github.com/andikadevs/pddikti/compare/v0.7.0...HEAD
[0.7.0]: https://github.com/andikadevs/pddikti/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/andikadevs/pddikti/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/andikadevs/pddikti/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/andikadevs/pddikti/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/andikadevs/pddikti/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/andikadevs/pddikti/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/andikadevs/pddikti/releases/tag/v0.1.0
