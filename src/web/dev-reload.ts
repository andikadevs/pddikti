// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { watch } from 'node:fs'
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'

/**
 * Development-only live reload for the SPA. The server watches `web/client/` and pushes a
 * Server-Sent Event on every change; a tiny script in the page reloads it. Combined with
 * the per-request client rebuild under DEBUG, saving a client file refreshes the browser.
 * Mounted only when DEBUG is on.
 */

const CLIENT_DIR = new URL('./client/', import.meta.url).pathname
const DEBOUNCE_MS = 100

/** Path the reload script is served from; the HTML shell references it under DEBUG. */
export const DEV_RELOAD_SCRIPT_PATH = '/__dev/reload.js'

// Reloads on a change event, and after reconnecting (the server restarted under --hot).
const CLIENT_SCRIPT = `(() => {
  let dropped = false
  const events = new EventSource('/__dev/events')
  events.onmessage = () => location.reload()
  events.onerror = () => { dropped = true }
  events.onopen = () => { if (dropped) location.reload() }
})()
`

const listeners = new Set<() => void>()
let watching = false

function startWatching(): void {
  if (watching) return
  watching = true
  let timer: ReturnType<typeof setTimeout> | undefined
  watch(CLIENT_DIR, { recursive: true }, () => {
    clearTimeout(timer)
    timer = setTimeout(() => listeners.forEach((notify) => notify()), DEBOUNCE_MS)
  })
}

export const devReload = new Hono()

devReload.get('/reload.js', (c) =>
  c.body(CLIENT_SCRIPT, 200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' }),
)

devReload.get('/events', (c) => {
  startWatching()
  return streamSSE(c, async (stream) => {
    let notify: () => void = () => {}
    const changed = new Promise<void>((resolve) => {
      notify = resolve
    })
    listeners.add(notify)
    stream.onAbort(() => {
      listeners.delete(notify)
    })
    await changed
    listeners.delete(notify)
    await stream.writeSSE({ data: 'reload' })
  })
})
