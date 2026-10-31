// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ReactNode } from 'react'

export interface DetailItem {
  label: string
  value: ReactNode
}

/** Two-column label/value list for record details. */
export function DetailList({ items }: { items: readonly DetailItem[] }) {
  return (
    <dl className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="flex justify-between gap-4 py-2 text-sm">
          <dt className="text-muted-foreground">{item.label}</dt>
          <dd className="text-right font-medium break-words">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
