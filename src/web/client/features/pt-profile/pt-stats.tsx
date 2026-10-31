// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ClockIcon, GraduationCapIcon, UserPlusIcon, UsersIcon } from 'lucide-react'
import { StatCard } from '@/components/common/stat-card'
import { useEndpoint } from '@/hooks/use-endpoint'
import { ptPath } from '@/lib/api-paths'
import { num } from '@/lib/format'
import type { PtMahasiswa, PtRasio, PtStudyDuration } from '@/lib/types'
import { averageStudyYears, formatYears } from './study-duration'

/** The ratio as reported ("1 : 25"), or a dash when the upstream has only a placeholder sentence. */
function ratioLabel(ratio?: string): string {
  return ratio && /\d/.test(ratio) ? ratio : '—'
}

/** Four headline metrics for a university. */
export function PtStats({ id }: { id: string }) {
  const ratio = useEndpoint<PtRasio>(ptPath(id, 'rasio'))
  const students = useEndpoint<PtMahasiswa>(ptPath(id, 'mahasiswa'))
  const duration = useEndpoint<PtStudyDuration[]>(ptPath(id, 'waktu-studi'))

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={UsersIcon}
        label="Rasio dosen : mahasiswa"
        value={ratioLabel(ratio.data?.rasio)}
        hint="Jumlah dosen terhadap mahasiswa"
        loading={ratio.loading}
      />
      <StatCard
        icon={UserPlusIcon}
        label="Mahasiswa baru"
        value={num(students.data?.mean_jumlah_baru)}
        hint="Rata-rata per tahun"
        loading={students.loading}
      />
      <StatCard
        icon={GraduationCapIcon}
        label="Lulusan"
        value={num(students.data?.mean_jumlah_lulus)}
        hint="Rata-rata per tahun"
        loading={students.loading}
      />
      <StatCard
        icon={ClockIcon}
        label="Masa studi"
        value={formatYears(averageStudyYears(duration.data))}
        hint="Rata-rata lintas jenjang"
        loading={duration.loading}
      />
    </div>
  )
}
