// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { AsyncContent } from '@/components/common/async-content'
import { EmptyState } from '@/components/common/empty-state'
import { SectionCard } from '@/components/common/section-card'
import { ShowMoreButton } from '@/components/common/show-more-button'
import { TableToolbar } from '@/components/common/table-toolbar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useEndpoint } from '@/hooks/use-endpoint'
import { useRowFilter } from '@/hooks/use-row-filter'
import { useVisibleRows } from '@/hooks/use-visible-rows'
import { prodiPath } from '@/lib/api-paths'
import { num, text } from '@/lib/format'
import type { Prodi } from '@/lib/types'
import { AccreditationBadge } from './accreditation-badge'

const searchableFields = (p: Prodi) => [p.nama_prodi, p.kode_prodi, p.jenjang_prodi]

function ProgramsTable({ rows }: { rows: readonly Prodi[] }) {
  const { term, setTerm, filtered } = useRowFilter(rows, searchableFields)
  const { visible, hiddenCount, showMore } = useVisibleRows(filtered)

  return (
    <>
      <TableToolbar term={term} onTermChange={setTerm} placeholder="Cari program studi…" shown={filtered.length} total={rows.length} />
      {filtered.length === 0 ? (
        <EmptyState title="Tidak ada program studi yang cocok" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Program studi</TableHead>
              <TableHead>Jenjang</TableHead>
              <TableHead>Akreditasi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Dosen</TableHead>
              <TableHead className="text-right">Mahasiswa</TableHead>
              <TableHead className="text-right">Rasio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((p, i) => (
              <TableRow key={p.kode_prodi ?? i}>
                <TableCell>
                  <p className="font-medium">{text(p.nama_prodi)}</p>
                  <p className="text-xs text-muted-foreground">{text(p.kode_prodi)}</p>
                </TableCell>
                <TableCell>{text(p.jenjang_prodi)}</TableCell>
                <TableCell>
                  <AccreditationBadge value={p.akreditasi} />
                </TableCell>
                <TableCell className="text-muted-foreground">{text(p.status_prodi)}</TableCell>
                <TableCell className="text-right tabular-nums">{num(p.jumlah_dosen)}</TableCell>
                <TableCell className="text-right tabular-nums">{num(p.jumlah_mahasiswa)}</TableCell>
                <TableCell className="text-right tabular-nums">{text(p.rasio)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <ShowMoreButton hiddenCount={hiddenCount} onClick={showMore} />
    </>
  )
}

/** Study programs of a university for the latest semester. */
export function PtPrograms({ id }: { id: string }) {
  const state = useEndpoint<Prodi[]>(prodiPath(id))
  return (
    <SectionCard title="Program studi" description="Program studi aktif pada semester terbaru.">
      <AsyncContent state={state} isEmpty={(rows) => rows.length === 0}>
        {(rows) => <ProgramsTable rows={rows} />}
      </AsyncContent>
    </SectionCard>
  )
}
