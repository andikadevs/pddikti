// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { SearchIcon, XIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SearchInputProps extends Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> {
  value: string
  onValueChange: (value: string) => void
}

/** Text input with a search icon and a clear button. */
export function SearchInput({ value, onValueChange, className, ...props }: SearchInputProps) {
  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn('pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden', className)}
        {...props}
      />
      {value ? (
        <Button
          variant="ghost"
          size="icon-xs"
          className="absolute top-1/2 right-2 -translate-y-1/2"
          onClick={() => onValueChange('')}
          aria-label="Hapus pencarian"
        >
          <XIcon />
        </Button>
      ) : null}
    </div>
  )
}
