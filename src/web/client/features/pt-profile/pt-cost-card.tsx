// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { AsyncContent } from '@/components/common/async-content'
import { SectionCard } from '@/components/common/section-card'
import { useEndpoint } from '@/hooks/use-endpoint'
import { ptPath } from '@/lib/api-paths'
import { text } from '@/lib/format'
import type { PtCost } from '@/lib/types'

/** Tuition range across the university's programs. */
export function PtCostCard({ id }: { id: string }) {
  const state = useEndpoint<PtCost>(ptPath(id, 'biaya-kuliah'))
  return (
    <SectionCard title="Biaya kuliah" description="Rentang biaya per semester lintas program.">
      <AsyncContent state={state} isEmpty={(cost) => !cost.range_biaya_kuliah}>
        {(cost) => <p className="text-xl font-semibold tracking-tight">Rp {text(cost.range_biaya_kuliah)}</p>}
      </AsyncContent>
    </SectionCard>
  )
}
