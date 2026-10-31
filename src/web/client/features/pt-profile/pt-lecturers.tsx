// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { AsyncContent } from '@/components/common/async-content'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingLines } from '@/components/common/loading-lines'
import { SectionCard } from '@/components/common/section-card'
import { ShowMoreButton } from '@/components/common/show-more-button'
import { TableToolbar } from '@/components/common/table-toolbar'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useEndpoint } from '@/hooks/use-endpoint'
import { useRowFilter } from '@/hooks/use-row-filter'
import { useVisibleRows } from '@/hooks/use-visible-rows'
import { lecturersPath } from '@/lib/api-paths'
import { text } from '@/lib/format'
import type { Lecturer, LecturersResponse } from '@/lib/types'

const searchableFields = (l: Lecturer) => [l.nama_dosen, l.nidn, l.nama_prodi]

function LecturersTable({ rows }: { rows: readonly Lecturer[] }) {
  const { term, setTerm, filtered } = useRowFilter(rows, searchableFields)
  const { visible, hiddenCount, showMore } = useVisibleRows(filtered)

  return (
    <>
      <TableToolbar term={term} onTermChange={setTerm} placeholder="Cari nama, NIDN, atau prodi…" shown={filtered.length} total={rows.length} />
      {filtered.length === 0 ? (
        <EmptyState title="Tidak ada dosen yang cocok" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>NIDN</TableHead>
              <TableHead>Pendidikan</TableHead>
              <TableHead>Program studi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ikatan kerja</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((l, i) => (
              <TableRow key={l.id_sdm ?? i}>
                <TableCell className="font-medium">{text(l.nama_dosen)}</TableCell>
                <TableCell className="tabular-nums text-muted-foreground">{text(l.nidn)}</TableCell>
                <TableCell>{text(l.pendidikan)}</TableCell>
                <TableCell>
                  {text(l.nama_prodi)}
                  {l.jenjang_prodi ? <span className="text-muted-foreground"> ({l.jenjang_prodi})</span> : null}
                </TableCell>
                <TableCell>
                  <Badge variant={l.status_aktif === 'Aktif' ? 'secondary' : 'outline'}>{text(l.status_aktif)}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{text(l.ikatan_kerja)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <ShowMoreButton hiddenCount={hiddenCount} onClick={showMore} />
    </>
  )
}

/** Every lecturer of a university, aggregated server-side across its study programs. */
export function PtLecturers({ id }: { id: string }) {
  const state = useEndpoint<LecturersResponse>(lecturersPath(id))
  return (
    <SectionCard title="Dosen" description="Dosen homebase dari seluruh program studi aktif. Pemuatan pertama bisa memakan waktu.">
      <AsyncContent state={state} isEmpty={(res) => !res.dosen?.length} loading={<LoadingLines lines={6} />}>
        {(res) => <LecturersTable rows={res.dosen ?? []} />}
      </AsyncContent>
    </SectionCard>
  )
}
