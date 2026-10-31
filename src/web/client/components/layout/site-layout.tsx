// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ReactNode } from 'react'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'

/** Page frame shared by every view: header, main content, footer. */
export function SiteLayout({ activeHref, children }: { activeHref: string; children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader activeHref={activeHref} />
      <main className="flex-1 pb-16">{children}</main>
      <SiteFooter />
    </div>
  )
}
