// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { AsyncContent } from '@/components/common/async-content'
import { SectionCard } from '@/components/common/section-card'
import { useEndpoint } from '@/hooks/use-endpoint'
import { ptPath } from '@/lib/api-paths'
import { text } from '@/lib/format'
import type { PtStudyDuration } from '@/lib/types'
import { formatYears } from './study-duration'

/** Mean study duration for each degree level. */
export function PtStudyDurationCard({ id }: { id: string }) {
  const state = useEndpoint<PtStudyDuration[]>(ptPath(id, 'waktu-studi'))
  return (
    <SectionCard title="Masa studi per jenjang">
      <AsyncContent state={state} isEmpty={(rows) => rows.length === 0}>
        {(rows) => (
          <ul className="divide-y text-sm">
            {rows.map((row, i) => (
              <li key={row.jenjang ?? i} className="flex justify-between py-2">
                <span className="text-muted-foreground">{text(row.jenjang)}</span>
                <span className="font-medium tabular-nums">{formatYears(row.mean_masa_studi)}</span>
              </li>
            ))}
          </ul>
        )}
      </AsyncContent>
    </SectionCard>
  )
}
