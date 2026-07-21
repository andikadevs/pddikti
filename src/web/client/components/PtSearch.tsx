import { useEffect, useState } from 'react'
import { searchPtPath } from '../constants.ts'
import { useEndpoint } from '../lib/api.ts'
import { setSelectedPt } from '../lib/selected-pt.ts'
import { Async, Section, Table, Td, Th } from './ui.tsx'
import type { PtSearchHit } from '../types.ts'

/** Minimum keyword length before an auto-search fires (avoids slow broad queries). */
const MIN_QUERY_LEN = 3
const DEBOUNCE_MS = 400

function text(value: string | null | undefined, fallback = '—'): string {
  const v = (value ?? '').toString().trim()
  return v === '' ? fallback : v
}

/**
 * University picker. Keyword-searches PDDikti universities and, on click, selects
 * one (writing its opaque id into the URL hash) so the profile page can render it.
 * The query is debounced and gated to {@link MIN_QUERY_LEN} characters.
 */
export function PtSearch() {
  const [input, setInput] = useState('')
  const [query, setQuery] = useState<string | null>(null)
  const state = useEndpoint<PtSearchHit[]>(query ? searchPtPath(query) : null)

  useEffect(() => {
    const q = input.trim()
    const id = setTimeout(() => setQuery(q.length >= MIN_QUERY_LEN ? q : null), DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [input])

  return (
    <Section title="Cari Perguruan Tinggi">
      <form
        className="mb-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          const q = input.trim()
          setQuery(q === '' ? null : q)
        }}
      >
        <input
          className="flex-1 border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-secondary"
          placeholder="Cari nama perguruan tinggi… (min 3 huruf)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary" type="submit">
          Cari
        </button>
      </form>

      {query === null ? (
        <p className="py-2.5 text-sm text-muted">
          Ketik minimal {MIN_QUERY_LEN} huruf untuk mencari perguruan tinggi.
        </p>
      ) : (
        <Async state={state} isEmpty={(v) => v.length === 0}>
          {(rows) => (
            <>
              <p className="mb-2 text-sm text-muted">
                {rows.length} hasil untuk “{query}”.
              </p>
              <Table
                head={
                  <>
                    <Th>Nama</Th>
                    <Th>Singkatan</Th>
                    <Th>Kode</Th>
                  </>
                }
              >
                {rows.map((pt, i) => {
                  const id = pt.id
                  const name = text(pt.nama_pt ?? pt.nama)
                  return (
                    <tr
                      key={id ?? i}
                      className={id ? 'cursor-pointer hover:bg-bg' : 'opacity-60'}
                      onClick={id ? () => setSelectedPt(id) : undefined}
                    >
                      <Td>
                        {id ? (
                          <button
                            type="button"
                            className="text-left font-semibold text-secondary hover:underline"
                          >
                            {name}
                          </button>
                        ) : (
                          name
                        )}
                      </Td>
                      <Td>{text(pt.nm_singkat ?? pt.sinkatan_pt)}</Td>
                      <Td>{text(pt.kode_pt)}</Td>
                    </tr>
                  )
                })}
              </Table>
            </>
          )}
        </Async>
      )}
    </Section>
  )
}
