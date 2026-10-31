// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { AsyncContent } from '@/components/common/async-content'
import { EmptyState } from '@/components/common/empty-state'
import { SectionCard } from '@/components/common/section-card'
import { useEndpoint } from '@/hooks/use-endpoint'
import { ptPath } from '@/lib/api-paths'
import { text } from '@/lib/format'
import type { PtNameHistory } from '@/lib/types'

/** Former names of the university, as a timeline. */
export function PtNameHistoryCard({ id }: { id: string }) {
  const state = useEndpoint<PtNameHistory[] | null>(ptPath(id, 'riwayat'))
  return (
    <SectionCard title="Riwayat nama">
      <AsyncContent
        state={state}
        isEmpty={(rows) => !rows || rows.length === 0}
        empty={<EmptyState title="Belum ada perubahan nama" />}
      >
        {(rows) => (
          <ol className="space-y-4 pl-5">
            {(rows ?? []).map((entry, i) => (
              <li key={i} className="relative text-sm">
                <span className="absolute top-1.5 -left-5 size-2.5 rounded-full bg-primary ring-4 ring-primary/15" />
                <p className="font-medium">{text(entry.nama)}</p>
                {entry.tahun ? <p className="text-muted-foreground">{entry.tahun}</p> : null}
                {entry.keterangan ? <p className="mt-1 text-muted-foreground">{entry.keterangan}</p> : null}
              </li>
            ))}
          </ol>
        )}
      </AsyncContent>
    </SectionCard>
  )
}
