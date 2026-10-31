// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { AwardIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { isTopAccreditation } from '@/lib/accreditation'
import { text } from '@/lib/format'

/** Accreditation grade, highlighted for top-tier grades. */
export function AccreditationBadge({ value, withLabel = false }: { value?: string; withLabel?: boolean }) {
  const top = isTopAccreditation(value)
  return (
    <Badge variant={top ? 'default' : 'secondary'} className={top ? 'bg-success text-success-foreground' : undefined}>
      {withLabel ? <AwardIcon data-icon="inline-start" /> : null}
      {withLabel ? 'Akreditasi ' : ''}
      {text(value, 'N/A')}
    </Badge>
  )
}
