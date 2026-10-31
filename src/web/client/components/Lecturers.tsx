// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { lecturersPath } from '../constants.ts'
import { text } from '../lib/format.ts'
import { useEndpoint } from '../hooks/use-endpoint.ts'
import { Async, Pill, Section, Table, Td, Th } from './ui.tsx'
import type { LecturersResponse } from '../types.ts'

/** Full lecturer list, aggregated server-side across active study programs. */
export function Lecturers({ id }: { id: string }) {
  const state = useEndpoint<LecturersResponse>(lecturersPath(id))
  const count = state.data?.count

  return (
    <Section title={`Dosen${count != null ? ` (${count})` : ''}`}>
      <Async state={state} isEmpty={(v) => !v.dosen || v.dosen.length === 0}>
        {(v) => (
          <Table
            head={
              <>
                <Th>Nama</Th>
                <Th>NIDN</Th>
                <Th>Pendidikan</Th>
                <Th>Program Studi</Th>
                <Th>Status</Th>
                <Th>Ikatan Kerja</Th>
              </>
            }
          >
            {(v.dosen ?? []).map((dsn, i) => (
              <tr key={dsn.id_sdm ?? i} className="hover:bg-bg">
                <Td>{text(dsn.nama_dosen)}</Td>
                <Td>{text(dsn.nidn)}</Td>
                <Td>{text(dsn.pendidikan)}</Td>
                <Td>
                  {text(dsn.nama_prodi)}
                  {dsn.jenjang_prodi ? ` (${dsn.jenjang_prodi})` : ''}
                </Td>
                <Td>
                  <Pill tone={dsn.status_aktif === 'Aktif' ? 'good' : 'plain'}>{text(dsn.status_aktif)}</Pill>
                </Td>
                <Td>{text(dsn.ikatan_kerja)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Async>
    </Section>
  )
}
