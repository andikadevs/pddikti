// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChevronDownIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { num } from '@/lib/format'

/** Footer button that reveals the next page of a long list; hidden when nothing is left. */
export function ShowMoreButton({ hiddenCount, onClick }: { hiddenCount: number; onClick: () => void }) {
  if (hiddenCount === 0) return null
  return (
    <div className="flex justify-center pt-4">
      <Button variant="secondary" className="rounded-full" onClick={onClick}>
        Tampilkan lebih banyak ({num(hiddenCount)} lagi)
        <ChevronDownIcon data-icon="inline-end" />
      </Button>
    </div>
  )
}
