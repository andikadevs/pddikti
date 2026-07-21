/**
 * Export the OpenAPI document to `openapi.json` for offline reference (e.g. an
 * AI agent building against this API). Builds the app in-process and reads the
 * same doc served at `GET /api/openapi.json` — no running server, no upstream calls.
 *
 * Run: `bun run openapi:export`
 * The `servers` URL follows PUBLIC_BASE_URL, so set it to point the spec at a
 * deployed host: `PUBLIC_BASE_URL=https://pddikti.ptbdee.com bun run openapi:export`.
 */
import { buildApp } from '../src/app.ts'

const app = buildApp()
const res = await app.request('/api/openapi.json')
if (!res.ok) {
  console.error(`Failed to generate OpenAPI document: HTTP ${res.status}`)
  process.exit(1)
}

const doc = await res.json()
const out = new URL('../openapi.json', import.meta.url).pathname
await Bun.write(out, `${JSON.stringify(doc, null, 2)}\n`)
console.error(`Wrote ${out}`)
