// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useMemo, useState } from 'react'

/**
 * Client-side text filter over already-loaded rows. Matches the trimmed, case-insensitive
 * term against the strings returned by `fields` for each row. Pass a module-level `fields`
 * function so its identity stays stable between renders.
 */
export function useRowFilter<T>(rows: readonly T[], fields: (row: T) => (string | null | undefined)[]) {
  const [term, setTerm] = useState('')
  const needle = term.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      needle === ''
        ? rows
        : rows.filter((row) => fields(row).some((value) => value?.toLowerCase().includes(needle))),
    [rows, fields, needle],
  )
  return { term, setTerm, filtered }
}
