// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { AsyncContent } from '@/components/common/async-content'
import { EmptyState } from '@/components/common/empty-state'
import { SearchInput } from '@/components/common/search-input'
import { SectionCard } from '@/components/common/section-card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useEndpoint } from '@/hooks/use-endpoint'
import { MIN_QUERY_LENGTH, useSearchQuery } from '@/hooks/use-search-query'
import { ptPath, searchMhsPath } from '@/lib/api-paths'
import { text } from '@/lib/format'
import type { PtDetail, StudentHit } from '@/lib/types'
import { matchesPt } from './match-pt'

function StudentsTable({ rows }: { rows: readonly StudentHit[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead>NIM</TableHead>
          <TableHead>Program studi</TableHead>
          <TableHead>Perguruan tinggi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((s, i) => (
          <TableRow key={s.id ?? i}>
            <TableCell className="font-medium">{text(s.nama)}</TableCell>
            <TableCell className="tabular-nums text-muted-foreground">{text(s.nim)}</TableCell>
            <TableCell>{text(s.nama_prodi)}</TableCell>
            <TableCell>{text(s.sinkatan_pt ?? s.nama_pt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/**
 * Student search. PDDikti has no "students by university" endpoint, so this runs the
 * national keyword search and can narrow the hits to this university by name.
 */
export function PtStudents({ id }: { id: string }) {
  const { data: pt } = useEndpoint<PtDetail>(ptPath(id, 'detail'))
  const { input, setInput, query } = useSearchQuery()
  const [thisPtOnly, setThisPtOnly] = useState(true)
  const state = useEndpoint<StudentHit[]>(query ? searchMhsPath(query) : null)

  const canNarrow = Boolean(pt?.nama_pt || pt?.nm_singkat)
  const narrowed = canNarrow && thisPtOnly
  const select = (rows: StudentHit[]) => (narrowed ? rows.filter((s) => matchesPt(s, pt?.nama_pt, pt?.nm_singkat)) : rows)

  return (
    <SectionCard title="Mahasiswa" description="Cari mahasiswa berdasarkan nama atau NIM.">
      <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <SearchInput value={input} onValueChange={setInput} placeholder="Nama atau NIM mahasiswa…" aria-label="Cari mahasiswa" />
        </div>
        {canNarrow ? (
          <div className="flex items-center gap-2">
            <Switch id="this-pt-only" checked={thisPtOnly} onCheckedChange={setThisPtOnly} />
            <Label htmlFor="this-pt-only">Hanya {pt?.nm_singkat || 'kampus ini'}</Label>
          </div>
        ) : null}
      </div>
      {query === null ? (
        <EmptyState icon={SearchIcon} title="Mulai mencari" description={`Ketik minimal ${MIN_QUERY_LENGTH} huruf.`} />
      ) : (
        <AsyncContent
          state={state}
          isEmpty={(rows) => select(rows).length === 0}
          empty={<EmptyState title="Mahasiswa tidak ditemukan" description={narrowed ? 'Coba matikan filter kampus.' : undefined} />}
        >
          {(rows) => <StudentsTable rows={select(rows)} />}
        </AsyncContent>
      )}
    </SectionCard>
  )
}
