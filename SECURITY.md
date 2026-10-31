# Security Policy

## Supported versions

Only the latest release receives security fixes.

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |
| < 1.0   | No        |

## Reporting a vulnerability

Do not report security problems in public issues, discussions, or pull requests.

Report them privately in one of these ways:

- GitHub [private vulnerability reporting](https://github.com/andikadevs/pddikti/security/advisories/new)
- Email [hello@andikadevs.space](mailto:hello@andikadevs.space)

Include:

- The affected version or commit.
- Steps to reproduce, or a proof of concept.
- The impact you expect, for example exposed secrets or an authentication bypass.

You can expect an acknowledgement within 3 working days. We will keep you updated while we
work on a fix and credit you in the release notes unless you ask us not to.

## Scope

In scope:

- This repository's code, Docker image, and default configuration.
- Leaks of `API_KEY`, `CONFIG_PASSWORD`, session cookies, or the stored `cf_clearance`.
- Bypasses of the `/api/*` key gate or the `/config` password.

Out of scope:

- The upstream PDDikti service and Cloudflare. Report those to their owners.
- The `/mcp` endpoint being public. This is intentional and documented.
- Findings that need a compromised host or a malicious operator.

## Operator checklist

When you deploy this service publicly:

- Put it behind a TLS-terminating reverse proxy and set `PUBLIC_BASE_URL` to the HTTPS URL.
- Set a strong `API_KEY` and `CONFIG_PASSWORD`, or leave `CONFIG_PASSWORD` empty to disable
  the config page.
- Keep `runtime-config.json` out of version control. It holds a live `cf_clearance` cookie.
- Keep FlareSolverr and Redis on an internal network, as the provided `docker-compose.yml`
  does.
