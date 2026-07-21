import tailwind from 'bun-plugin-tailwind'
import { loadConfig } from '../config.ts'

/** Resolve client assets relative to this file, independent of cwd. */
const HTML_PATH = new URL('./client/index.html', import.meta.url).pathname
const ENTRY_PATH = new URL('./client/index.tsx', import.meta.url).pathname
const FAVICON_PATH = new URL('./client/favicon.ico', import.meta.url).pathname

let cachedScript: string | undefined
let cachedStyles: string | undefined
let cachedFavicon: ArrayBuffer | undefined

/**
 * Bundle the React client once with Bun.build, processing Tailwind via
 * `bun-plugin-tailwind` (the entry imports `styles.css`). A single build emits
 * the JS chunk and the compiled CSS asset — no separate Tailwind CLI process,
 * so it works in a `--production` install where only deps are present. Cached in
 * prod; rebuilt per call when DEBUG.
 */
async function buildClient(): Promise<{ script: string; styles: string }> {
  const { DEBUG } = loadConfig()
  if (cachedScript !== undefined && cachedStyles !== undefined && !DEBUG) {
    return { script: cachedScript, styles: cachedStyles }
  }

  const built = await Bun.build({
    entrypoints: [ENTRY_PATH],
    target: 'browser',
    minify: !DEBUG,
    plugins: [tailwind],
  })
  if (!built.success) {
    throw new AggregateError(built.logs, 'Client bundle failed')
  }

  const js = built.outputs.find((o) => o.path.endsWith('.js'))
  const css = built.outputs.find((o) => o.path.endsWith('.css'))
  if (!js) throw new Error('Client bundle produced no JS output')
  if (!css) throw new Error('Client bundle produced no CSS output')

  cachedScript = await js.text()
  cachedStyles = await css.text()
  return { script: cachedScript, styles: cachedStyles }
}

/** Compiled Tailwind stylesheet for the SPA. */
export async function getClientStyles(): Promise<string> {
  return (await buildClient()).styles
}

/** Browser bundle for the React client. */
export async function getClientScript(): Promise<string> {
  return (await buildClient()).script
}

/** The HTML shell served at the root. */
export function getClientHtml(): Promise<string> {
  return Bun.file(HTML_PATH).text()
}

/** The favicon bytes (image/x-icon). Cached after first read. */
export async function getClientFavicon(): Promise<ArrayBuffer> {
  if (cachedFavicon === undefined) cachedFavicon = await Bun.file(FAVICON_PATH).arrayBuffer()
  return cachedFavicon
}
