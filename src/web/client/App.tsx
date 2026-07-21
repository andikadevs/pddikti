import { logoUrl, prodiPath, ptPath } from './constants.ts'
import { nf, text, year } from './lib/format.ts'
import { useEndpoint } from './hooks/use-endpoint.ts'
import { clearSelectedPt, useSelectedPt } from './hooks/use-selected-pt.ts'
import { accreditationTone } from './theme.ts'
import { CONTAINER, Header } from './components/Layout.tsx'
import { Async, Badge, Chip, InfoRow, Pill, Section, StatCard, Table, Td, Th } from './components/ui.tsx'
import { Lecturers } from './components/Lecturers.tsx'
import { Students } from './components/Students.tsx'
import { PtSearch } from './components/PtSearch.tsx'
import type { Prodi, PtCost, PtDetail, PtMahasiswa, PtNameHistory, PtRasio, PtStudyDuration } from './types.ts'

export function App() {
  const id = useSelectedPt()
  if (id === null) {
    return (
      <>
        <Header />
        <main className="pb-16">
          <div className={`${CONTAINER} pt-8`}>
            <PtSearch />
          </div>
        </main>
      </>
    )
  }
  return <Profile id={id} />
}

function Profile({ id }: { id: string }) {
  const detail = useEndpoint<PtDetail>(ptPath(id, 'detail'))
  const rasio = useEndpoint<PtRasio>(ptPath(id, 'rasio'))
  const mahasiswa = useEndpoint<PtMahasiswa>(ptPath(id, 'mahasiswa'))
  const studyDuration = useEndpoint<PtStudyDuration[]>(ptPath(id, 'waktu-studi'))
  const cost = useEndpoint<PtCost>(ptPath(id, 'biaya-kuliah'))
  const history = useEndpoint<PtNameHistory[] | null>(ptPath(id, 'riwayat'))
  const prodi = useEndpoint<Prodi[]>(prodiPath(id))

  const d = detail.data
  const avgStudy = (() => {
    const vals = (studyDuration.data ?? [])
      .map((x) => x.mean_masa_studi)
      .filter((n): n is number => typeof n === 'number')
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  })()

  return (
    <>
      <Header />

      <header className="bg-gradient-to-br from-primary to-secondary pb-16 pt-9 text-white">
        <div className={`${CONTAINER}`}>
          <button
            type="button"
            onClick={() => clearSelectedPt()}
            className="mb-5 text-sm text-[#cdd9ee] hover:text-white"
          >
            ← Ganti perguruan tinggi
          </button>
        </div>
        <div className={`${CONTAINER} flex flex-wrap items-center gap-7`}>
          <div className="flex flex-none items-center justify-center bg-white" style={{ height: 104, width: 104 }}>
            <img
              src={logoUrl(id)}
              alt={`Logo ${text(d?.nama_pt, 'Perguruan Tinggi')}`}
              className="h-full w-full object-contain p-2.5"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          </div>
          <div>
            <h1 className="mb-1.5 text-[28px] font-bold leading-tight">{text(d?.nama_pt, 'Perguruan Tinggi')}</h1>
            <div className="text-[15px] text-[#d7e2f4]">
              {text(d?.nm_singkat, 'Perguruan Tinggi')} · {text(d?.kab_kota_pt)} · {text(d?.provinsi_pt)}
            </div>
            <div className="mt-3.5 flex flex-wrap gap-2.5">
              {d?.status_pt ? <Badge tone="solid">{d.status_pt}</Badge> : null}
              {d?.kode_pt ? <Badge>Kode {text(d.kode_pt)}</Badge> : null}
              {d?.kelompok ? <Badge>{d.kelompok}</Badge> : null}
              {d?.akreditasi_pt ? (
                <Badge tone={accreditationTone(d.akreditasi_pt) === 'good' ? 'good' : 'plain'}>
                  Akreditasi {d.akreditasi_pt}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="pb-16">
        <div className={`${CONTAINER} -mt-10`}>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Rasio Dosen : Mahasiswa"
              value={rasio.loading ? '…' : text(rasio.data?.rasio)}
              hint="Dosen terhadap mahasiswa"
            />
            <StatCard
              label="Rata-rata Maba"
              value={mahasiswa.loading ? '…' : mahasiswa.data?.mean_jumlah_baru != null ? nf.format(mahasiswa.data.mean_jumlah_baru) : '—'}
              hint="Mahasiswa baru / tahun"
            />
            <StatCard
              label="Rata-rata Lulus"
              value={mahasiswa.loading ? '…' : mahasiswa.data?.mean_jumlah_lulus != null ? nf.format(mahasiswa.data.mean_jumlah_lulus) : '—'}
              hint="Lulusan / tahun"
            />
            <StatCard
              label="Rata-rata Masa Studi"
              value={studyDuration.loading ? '…' : avgStudy != null ? `${avgStudy.toFixed(1)} th` : '—'}
              hint="Lintas program"
            />
          </div>

          <Section title="Identitas Perguruan Tinggi">
            <Async state={detail}>
              {(v) => (
                <div className="grid gap-x-7 md:grid-cols-2">
                  <InfoRow k="Nama" v={text(v.nama_pt)} />
                  <InfoRow k="Singkatan" v={text(v.nm_singkat)} />
                  <InfoRow k="Kode PT" v={text(v.kode_pt)} />
                  <InfoRow k="Status" v={text(v.status_pt)} />
                  <InfoRow k="Kelompok" v={text(v.kelompok)} />
                  <InfoRow k="Pembina" v={text(v.pembina)} />
                  <InfoRow k="Akreditasi" v={text(v.akreditasi_pt)} />
                  <InfoRow k="Tanggal Berdiri" v={year(v.tgl_berdiri_pt)} />
                  <InfoRow k="SK Pendirian" v={text(v.sk_pendirian_sp)} />
                  <InfoRow k="Alamat" v={text(v.alamat)} />
                  <InfoRow k="Kab/Kota" v={text(v.kab_kota_pt)} />
                  <InfoRow k="Provinsi" v={text(v.provinsi_pt)} />
                  <InfoRow k="Kode Pos" v={text(v.kode_pos)} />
                  <InfoRow k="Email" v={text(v.email)} />
                  <InfoRow k="Telepon" v={text(v.no_tel)} />
                  <InfoRow
                    k="Website"
                    v={
                      v.website ? (
                        <a className="text-secondary hover:underline" href={`https://${v.website.replace(/^https?:\/\//, '')}`} target="_blank" rel="noreferrer">
                          {v.website}
                        </a>
                      ) : (
                        '—'
                      )
                    }
                  />
                </div>
              )}
            </Async>
          </Section>

          <Section title="Biaya Kuliah">
            <Async state={cost}>
              {(v) => (
                <div className="text-[22px] font-bold text-primary">
                  Rp {text(v.range_biaya_kuliah)}
                  <div className="text-sm font-normal text-muted">Rentang biaya kuliah per program.</div>
                </div>
              )}
            </Async>
          </Section>

          <Section title="Rata-rata Masa Studi per Jenjang">
            <Async state={studyDuration} isEmpty={(v) => v.length === 0}>
              {(v) => (
                <div className="flex flex-wrap gap-2">
                  {v.map((x, i) => (
                    <Chip key={i}>
                      <strong>{text(x.jenjang)}</strong> · {x.mean_masa_studi != null ? `${x.mean_masa_studi.toFixed(1)} th` : '—'}
                    </Chip>
                  ))}
                </div>
              )}
            </Async>
          </Section>

          <Section title={`Program Studi${prodi.data ? ` (${prodi.data.length})` : ''}`}>
            <Async state={prodi} isEmpty={(v) => v.length === 0}>
              {(rows) => (
                <Table
                  head={
                    <>
                      <Th>Kode</Th>
                      <Th>Program Studi</Th>
                      <Th>Jenjang</Th>
                      <Th>Akreditasi</Th>
                      <Th>Status</Th>
                      <Th right>Dosen</Th>
                      <Th right>Mahasiswa</Th>
                      <Th>Rasio</Th>
                    </>
                  }
                >
                  {rows.map((p, i) => (
                    <tr key={i} className="hover:bg-bg">
                      <Td>{text(p.kode_prodi)}</Td>
                      <Td>{text(p.nama_prodi)}</Td>
                      <Td>{text(p.jenjang_prodi)}</Td>
                      <Td>
                        <Pill tone={accreditationTone(p.akreditasi) === 'good' ? 'good' : 'plain'}>
                          {text(p.akreditasi, 'N/A')}
                        </Pill>
                      </Td>
                      <Td>{text(p.status_prodi)}</Td>
                      <Td right>{p.jumlah_dosen != null ? nf.format(p.jumlah_dosen) : '—'}</Td>
                      <Td right>{p.jumlah_mahasiswa != null ? nf.format(p.jumlah_mahasiswa) : '—'}</Td>
                      <Td>{text(p.rasio)}</Td>
                    </tr>
                  ))}
                </Table>
              )}
            </Async>
          </Section>

          <Lecturers id={id} />

          <Students ptName={d?.nama_pt} ptSingkat={d?.nm_singkat} />

          <Section title="Riwayat Nama">
            <Async state={history} isEmpty={(v) => !v || v.length === 0}>
              {(v) => (
                <ul>
                  {(v ?? []).map((h, i) => (
                    <li key={i} className="border-l-2 border-line py-2 pl-4">
                      <strong>{text(h.nama)}</strong> {h.tahun ? `· ${h.tahun}` : ''}
                      {h.keterangan ? <div className="text-sm text-muted">{h.keterangan}</div> : null}
                    </li>
                  ))}
                </ul>
              )}
            </Async>
          </Section>
        </div>
      </main>

      <footer className="border-t border-line">
        <div className={`${CONTAINER} flex flex-wrap justify-between gap-2 py-5 text-[13px] text-muted`}>
          <span>Sumber data: PDDikti (Kemendikti Saintek) · Data © PDDikti</span>
          <span>Profil {text(d?.nama_pt, 'Perguruan Tinggi')}</span>
        </div>
      </footer>
    </>
  )
}
