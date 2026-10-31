// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { AsyncContent } from '@/components/common/async-content'
import { DetailList, type DetailItem } from '@/components/common/detail-list'
import { LoadingLines } from '@/components/common/loading-lines'
import { SectionCard } from '@/components/common/section-card'
import { useEndpoint } from '@/hooks/use-endpoint'
import { ptPath } from '@/lib/api-paths'
import { text, year } from '@/lib/format'
import type { PtDetail } from '@/lib/types'

function websiteLink(website?: string) {
  if (!website) return '—'
  const host = website.replace(/^https?:\/\//, '')
  return (
    <a href={`https://${host}`} target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline">
      {host}
    </a>
  )
}

function identityItems(pt: PtDetail): DetailItem[] {
  return [
    { label: 'Nama', value: text(pt.nama_pt) },
    { label: 'Singkatan', value: text(pt.nm_singkat) },
    { label: 'Kode PT', value: text(pt.kode_pt) },
    { label: 'Status', value: text(pt.status_pt) },
    { label: 'Kelompok', value: text(pt.kelompok) },
    { label: 'Pembina', value: text(pt.pembina) },
    { label: 'Akreditasi', value: text(pt.akreditasi_pt) },
    { label: 'Tahun berdiri', value: year(pt.tgl_berdiri_pt) },
    { label: 'SK pendirian', value: text(pt.sk_pendirian_sp) },
    { label: 'Alamat', value: text(pt.alamat) },
    { label: 'Kabupaten/Kota', value: text(pt.kab_kota_pt) },
    { label: 'Provinsi', value: text(pt.provinsi_pt) },
    { label: 'Kode pos', value: text(pt.kode_pos) },
    { label: 'Email', value: text(pt.email) },
    { label: 'Telepon', value: text(pt.no_tel) },
    { label: 'Website', value: websiteLink(pt.website) },
  ]
}

/** Official identity and contact details of a university. */
export function PtIdentityCard({ id }: { id: string }) {
  const state = useEndpoint<PtDetail>(ptPath(id, 'detail'))
  return (
    <SectionCard title="Identitas" description="Data resmi dan kontak perguruan tinggi.">
      <AsyncContent state={state} loading={<LoadingLines lines={8} />}>
        {(pt) => <DetailList items={identityItems(pt)} />}
      </AsyncContent>
    </SectionCard>
  )
}
