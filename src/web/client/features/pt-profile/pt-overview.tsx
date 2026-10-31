// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { PtCostCard } from './pt-cost-card'
import { PtIdentityCard } from './pt-identity-card'
import { PtNameHistoryCard } from './pt-name-history-card'
import { PtStudyDurationCard } from './pt-study-duration-card'

/** Overview tab: identity on the left, cost, study duration, and history on the right. */
export function PtOverview({ id }: { id: string }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <PtIdentityCard id={id} />
      </div>
      <div className="flex flex-col gap-6">
        <PtCostCard id={id} />
        <PtStudyDurationCard id={id} />
        <PtNameHistoryCard id={id} />
      </div>
    </div>
  )
}
