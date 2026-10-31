// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

/** Minimum keyword length before a search fires; broad 1–2 letter queries are slow upstream. */
export const MIN_QUERY_LENGTH = 3
const DEBOUNCE_MS = 400

/**
 * Search-box state: the raw input, plus the debounced query once it reaches
 * {@link MIN_QUERY_LENGTH} characters (`null` before that).
 */
export function useSearchQuery(initial = '') {
  const [input, setInput] = useState(initial)
  const debounced = useDebouncedValue(input.trim(), DEBOUNCE_MS)
  const query = debounced.length >= MIN_QUERY_LENGTH ? debounced : null
  return { input, setInput, query }
}
