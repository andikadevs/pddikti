// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useEffect, useState } from 'react'

/** URL-hash shape carrying the selected university: `#/pt/<encodedId>`. */
const PREFIX = '#/pt/'

function readHash(): string | null {
  const h = typeof location === 'undefined' ? '' : location.hash
  if (!h.startsWith(PREFIX)) return null
  const raw = h.slice(PREFIX.length)
  if (raw === '') return null
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

/** The opaque PT id currently in the URL hash, or null. Reacts to hashchange. */
export function useSelectedPt(): string | null {
  const [id, setId] = useState<string | null>(readHash())
  useEffect(() => {
    const onChange = () => setId(readHash())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return id
}

/** Select a university by id (updates the URL hash). */
export function setSelectedPt(id: string): void {
  location.hash = `${PREFIX}${encodeURIComponent(id)}`
}

/** Clear the selection, returning to the search landing. */
export function clearSelectedPt(): void {
  location.hash = ''
}
