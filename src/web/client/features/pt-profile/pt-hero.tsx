// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { MapPinIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useEndpoint } from '@/hooks/use-endpoint'
import { ptPath } from '@/lib/api-paths'
import { text } from '@/lib/format'
import type { PtDetail } from '@/lib/types'
import { AccreditationBadge } from './accreditation-badge'
import { PtLogo } from './pt-logo'

/** Profile header: logo, name, location, and status badges. */
export function PtHero({ id }: { id: string }) {
  const { data, loading } = useEndpoint<PtDetail>(ptPath(id, 'detail'))
  const name = text(data?.nama_pt, 'Perguruan Tinggi')
  const place = [data?.kab_kota_pt, data?.provinsi_pt].filter(Boolean).join(', ')

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <PtLogo id={id} name={name} />
      <div className="min-w-0 space-y-2">
        {loading ? (
          <>
            <Skeleton className="h-8 w-72 max-w-full" />
            <Skeleton className="h-4 w-48" />
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{name}</h1>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              {data?.nm_singkat ? <span className="font-medium text-foreground">{data.nm_singkat}</span> : null}
              {place ? (
                <span className="inline-flex items-center gap-1">
                  <MapPinIcon className="size-3.5" />
                  {place}
                </span>
              ) : null}
            </p>
          </>
        )}
        <div className="flex flex-wrap gap-2">
          {data?.akreditasi_pt ? <AccreditationBadge value={data.akreditasi_pt} withLabel /> : null}
          {data?.status_pt ? <Badge variant="secondary">{data.status_pt}</Badge> : null}
          {data?.kelompok ? <Badge variant="secondary">{data.kelompok}</Badge> : null}
          {data?.kode_pt ? <Badge variant="secondary">Kode {data.kode_pt}</Badge> : null}
        </div>
      </div>
    </div>
  )
}
