// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ReactNode } from 'react'
import { SearchInput } from '@/components/common/search-input'
import { num } from '@/lib/format'

interface TableToolbarProps {
  term: string
  onTermChange: (term: string) => void
  placeholder: string
  shown: number
  total: number
  children?: ReactNode
}

/** Filter box and result count above a data table, with an optional slot for extra controls. */
export function TableToolbar({ term, onTermChange, placeholder, shown, total, children }: TableToolbarProps) {
  return (
    <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="w-full sm:max-w-xs">
        <SearchInput value={term} onValueChange={onTermChange} placeholder={placeholder} aria-label={placeholder} />
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {children}
        <span className="tabular-nums">
          {shown === total ? `${num(total)} data` : `${num(shown)} dari ${num(total)} data`}
        </span>
      </div>
    </div>
  )
}
