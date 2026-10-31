// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import { searchMhsPath } from '../constants.ts'
import { text } from '../lib/format.ts'
import { useDebouncedValue } from '../hooks/use-debounced-value.ts'
import { useEndpoint } from '../hooks/use-endpoint.ts'
import { Async, Section, Table, Td, Th } from './ui.tsx'
import type { StudentHit } from '../types.ts'

/** Minimum keyword length before an auto-search fires (avoids slow broad queries). */
const MIN_QUERY_LEN = 3
const DEBOUNCE_MS = 400

const norm = (v: string | null | undefined): string => (v ?? '').toLowerCase().trim()

/** Does a student hit belong to the given university (matched by name/abbrev)? */
function matchesPt(s: StudentHit, ptName?: string, ptSingkat?: string): boolean {
  const name = norm(ptName)
  const singkat = norm(ptSingkat)
  const hitName = norm(s.nama_pt)
  const hitSingkat = norm(s.sinkatan_pt)
  return (
    (name !== '' && (hitName.includes(name) || hitSingkat.includes(name))) ||
    (singkat !== '' && (hitName.includes(singkat) || hitSingkat === singkat))
  )
}

/**
 * Student search. PDDikti has no "all students by university" endpoint, so this
 * queries the keyword search (prefix/substring, handled upstream). Results are
 * shown across all campuses by default; the toggle narrows to the current
 * university only (matched by its name/abbreviation).
 *
 * The query is debounced and gated to {@link MIN_QUERY_LEN} characters so typing
 * does not fire a request per keystroke (broad 1–2 char terms can be slow upstream).
 */
interface StudentsProps {
  ptName?: string
  ptSingkat?: string
}

export function Students({ ptName, ptSingkat }: StudentsProps) {
  const [input, setInput] = useState('')
  const [samePtOnly, setSamePtOnly] = useState(false)
  const debounced = useDebouncedValue(input.trim(), DEBOUNCE_MS)
  const query = debounced.length >= MIN_QUERY_LEN ? debounced : null
  const state = useEndpoint<StudentHit[]>(query ? searchMhsPath(query) : null)

  const canFilter = norm(ptName) !== '' || norm(ptSingkat) !== ''
  const ptLabel = (ptSingkat ?? ptName ?? '').trim() || 'PT ini'
  const filterOn = samePtOnly && canFilter
  const narrow = (v: StudentHit[]) =>
    filterOn ? v.filter((s) => matchesPt(s, ptName, ptSingkat)) : v

  return (
    <Section title="Mahasiswa (Pencarian)">
      <form className="mb-3 flex gap-2" onSubmit={(e) => e.preventDefault()}>
        <input
          className="flex-1 border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-secondary"
          placeholder="Cari nama atau NIM mahasiswa… (min 3 huruf)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary" type="submit">
          Cari
        </button>
      </form>

      {canFilter ? (
        <label className="mb-4 flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={samePtOnly}
            onChange={(e) => setSamePtOnly(e.target.checked)}
          />
          {ptLabel} saja
        </label>
      ) : null}

      {query === null ? (
        <p className="py-2.5 text-sm text-muted">
          Ketik minimal {MIN_QUERY_LEN} huruf untuk mencari mahasiswa.
        </p>
      ) : (
        <Async state={state} isEmpty={(v) => narrow(v).length === 0}>
          {(v) => {
            const rows = narrow(v)
            return (
              <>
                <p className="mb-2 text-sm text-muted">
                  {rows.length} hasil untuk “{query}”{filterOn ? ` (${ptLabel})` : ''}.
                </p>
                <Table
                  head={
                    <>
                      <Th>Nama</Th>
                      <Th>NIM</Th>
                      <Th>Program Studi</Th>
                      <Th>Perguruan Tinggi</Th>
                    </>
                  }
                >
                  {rows.map((s, i) => (
                    <tr key={s.id ?? i} className="hover:bg-bg">
                      <Td>{text(s.nama)}</Td>
                      <Td>{text(s.nim)}</Td>
                      <Td>{text(s.nama_prodi)}</Td>
                      <Td>{text(s.sinkatan_pt ?? s.nama_pt)}</Td>
                    </tr>
                  ))}
                </Table>
              </>
            )
          }}
        </Async>
      )}
    </Section>
  )
}
