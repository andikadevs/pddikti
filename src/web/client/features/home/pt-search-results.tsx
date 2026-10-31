// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChevronRightIcon, SearchXIcon } from 'lucide-react'
import { AsyncContent } from '@/components/common/async-content'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingLines } from '@/components/common/loading-lines'
import { Card } from '@/components/ui/card'
import { useEndpoint } from '@/hooks/use-endpoint'
import { searchPtPath } from '@/lib/api-paths'
import { num, text } from '@/lib/format'
import { profileHref } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import type { PtSearchHit } from '@/lib/types'

function ResultRow({ hit }: { hit: PtSearchHit }) {
  const name = text(hit.nama_pt ?? hit.nama)
  const shortName = hit.nm_singkat ?? hit.sinkatan_pt
  const meta = [shortName, hit.kode_pt && `Kode ${hit.kode_pt}`].filter(Boolean).join(' · ')
  const body = (
    <>
      <div className="min-w-0">
        <p className="truncate font-medium">{name}</p>
        {meta ? <p className="truncate text-sm text-muted-foreground">{meta}</p> : null}
      </div>
      {hit.id ? <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" /> : null}
    </>
  )
  const layout = 'group flex items-center justify-between gap-4 px-4 py-3'
  return hit.id ? (
    <a href={profileHref(hit.id)} className={cn(layout, 'transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none')}>
      {body}
    </a>
  ) : (
    <div className={cn(layout, 'opacity-60')}>{body}</div>
  )
}

/** University search results for a keyword, each linking to its profile. */
export function PtSearchResults({ query }: { query: string }) {
  const state = useEndpoint<PtSearchHit[]>(searchPtPath(query))
  return (
    <AsyncContent
      state={state}
      isEmpty={(hits) => hits.length === 0}
      loading={<LoadingLines lines={5} />}
      empty={<EmptyState icon={SearchXIcon} title="Tidak ditemukan" description={`Tidak ada perguruan tinggi yang cocok dengan "${query}".`} />}
    >
      {(hits) => (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {num(hits.length)} hasil untuk <span className="font-medium text-foreground">"{query}"</span>
          </p>
          <Card className="gap-0 divide-y py-0">
            {hits.map((hit, i) => (
              <ResultRow key={hit.id ?? i} hit={hit} />
            ))}
          </Card>
        </div>
      )}
    </AsyncContent>
  )
}
