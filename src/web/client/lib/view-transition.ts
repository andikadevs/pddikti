// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { flushSync } from 'react-dom'

/**
 * Apply a React state update inside a View Transition, so the browser cross-fades between
 * the old and new view. Falls back to a plain update when the API is missing or the user
 * prefers reduced motion. `flushSync` commits the update before the browser captures the
 * new snapshot.
 */
export function withViewTransition(update: () => void): void {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || reduceMotion) {
    update()
    return
  }
  document.startViewTransition(() => flushSync(update))
}
