// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useEffect, useState } from 'react'

/**
 * Reveal a long list in pages of `step` rows, so large tables (thousands of lecturers)
 * render quickly. Resets to the first page when the row set changes.
 */
export function useVisibleRows<T>(rows: readonly T[], step = 50) {
  const [limit, setLimit] = useState(step)
  useEffect(() => setLimit(step), [rows, step])
  return {
    visible: rows.slice(0, limit),
    hiddenCount: Math.max(rows.length - limit, 0),
    showMore: () => setLimit((n) => n + step),
  }
}
