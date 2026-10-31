// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ArrowLeftIcon } from 'lucide-react'
import { useState } from 'react'
import { AppLink } from '@/components/common/app-link'
import { PageContainer } from '@/components/layout/page-container'
import { buttonVariants } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { withViewTransition } from '@/lib/view-transition'
import { PtHero } from './pt-hero'
import { PtLecturers } from './pt-lecturers'
import { PtOverview } from './pt-overview'
import { PtPrograms } from './pt-programs'
import { PtStats } from './pt-stats'
import { PtStudents } from './pt-students'

/** University profile: header, headline metrics, and tabbed details. */
export function PtProfilePage({ id }: { id: string }) {
  const [tab, setTab] = useState('overview')
  return (
    <PageContainer className="space-y-8 pt-6">
      <AppLink href="/" className={buttonVariants({ variant: 'ghost', size: 'sm', className: '-ml-2' })}>
        <ArrowLeftIcon data-icon="inline-start" />
        Cari kampus lain
      </AppLink>
      <PtHero id={id} />
      <PtStats id={id} />
      <Tabs value={tab} onValueChange={(value: string) => withViewTransition(() => setTab(value))} className="gap-6">
        <TabsList className="no-scrollbar max-w-full overflow-x-auto">
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="programs">Program studi</TabsTrigger>
          <TabsTrigger value="lecturers">Dosen</TabsTrigger>
          <TabsTrigger value="students">Mahasiswa</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <PtOverview id={id} />
        </TabsContent>
        <TabsContent value="programs">
          <PtPrograms id={id} />
        </TabsContent>
        <TabsContent value="lecturers">
          <PtLecturers id={id} />
        </TabsContent>
        <TabsContent value="students">
          <PtStudents id={id} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
