// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { PageContainer } from '@/components/layout/page-container'

const REPOSITORY_URL = 'https://github.com/andikadevs/pddikti'

/** Site footer: data attribution and the source-code link the AGPL asks for. */
export function SiteFooter() {
  return (
    <footer className="border-t">
      <PageContainer className="flex flex-col gap-2 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Sumber data: PDDikti, Kemdiktisaintek. Data © PDDikti.</p>
        <p>
          Proyek independen, tidak berafiliasi dengan PDDikti.{' '}
          <a href={REPOSITORY_URL} target="_blank" rel="noreferrer" className="font-medium text-foreground underline-offset-4 hover:underline">
            Kode sumber
          </a>
        </p>
      </PageContainer>
    </footer>
  )
}
