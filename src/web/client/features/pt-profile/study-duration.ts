// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { PtStudyDuration } from '@/lib/types'

/** Mean study duration in years across all degree levels, or null when unknown. */
export function averageStudyYears(rows: readonly PtStudyDuration[] | null): number | null {
  const values = (rows ?? [])
    .map((row) => row.mean_masa_studi)
    .filter((n): n is number => typeof n === 'number')
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
}

/** "4,3 th" style duration label. */
export function formatYears(value: number | null | undefined): string {
  return value == null ? '—' : `${value.toLocaleString('id-ID', { maximumFractionDigits: 1 })} th`
}
