// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { BuildingIcon } from 'lucide-react'
import { EmptyState } from '@/components/common/empty-state'
import { SearchInput } from '@/components/common/search-input'
import { PageContainer } from '@/components/layout/page-container'
import { Button } from '@/components/ui/button'
import { MIN_QUERY_LENGTH, useSearchQuery } from '@/hooks/use-search-query'
import { PtSearchResults } from './pt-search-results'

const EXAMPLE_QUERIES = ['Universitas Indonesia', 'Institut Teknologi Bandung', 'Gadjah Mada', 'STEKOM'] as const

/** Landing page: a prominent university search with example queries. */
export function HomePage() {
  const { input, setInput, query } = useSearchQuery()

  return (
    <PageContainer className="max-w-3xl pt-12 sm:pt-20">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Jelajahi data perguruan tinggi Indonesia
        </h1>
        <p className="text-muted-foreground text-pretty">
          Profil kampus, program studi, dosen, dan statistik dari PDDikti dalam satu tempat.
        </p>
      </div>

      <div className="mt-8 space-y-3">
        <SearchInput
          value={input}
          onValueChange={setInput}
          placeholder="Cari nama perguruan tinggi…"
          aria-label="Cari perguruan tinggi"
          autoFocus
          className="h-11 text-base"
        />
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Contoh:</span>
          {EXAMPLE_QUERIES.map((example) => (
            <Button key={example} variant="outline" size="sm" onClick={() => setInput(example)}>
              {example}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-10">
        {query ? (
          <PtSearchResults query={query} />
        ) : (
          <EmptyState
            icon={BuildingIcon}
            title="Cari perguruan tinggi"
            description={`Ketik minimal ${MIN_QUERY_LENGTH} huruf nama kampus untuk melihat profilnya.`}
          />
        )}
      </div>
    </PageContainer>
  )
}
