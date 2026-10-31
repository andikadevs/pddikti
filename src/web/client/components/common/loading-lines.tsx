// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Skeleton } from '@/components/ui/skeleton'

const WIDTHS = ['w-3/5', 'w-4/5', 'w-2/5', 'w-3/4', 'w-1/2'] as const

/** Placeholder text lines shown while content loads. */
export function LoadingLines({ lines = 3 }: { lines?: number }) {
  return (
    <div className="grid gap-3" aria-busy="true" aria-label="Memuat">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={`h-4 ${WIDTHS[i % WIDTHS.length]}`} />
      ))}
    </div>
  )
}
