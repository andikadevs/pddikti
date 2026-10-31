// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { PageContainer } from '@/components/layout/page-container'

const REPOSITORY_URL = 'https://github.com/andikadevs/pddikti'
const AUTHOR_URL = 'https://andikadevs.space'

const LINK = 'font-medium text-foreground underline-offset-4 hover:underline'

/** Site footer: author credit, data attribution, and the source-code link the AGPL asks for. */
export function SiteFooter() {
  return (
    <footer>
      <PageContainer className="flex flex-col gap-2 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          Dibuat oleh{' '}
          <a href={AUTHOR_URL} target="_blank" rel="noreferrer" className={LINK}>
            andikadevs.space
          </a>
          {' · '}
          <a href={REPOSITORY_URL} target="_blank" rel="noreferrer" className={LINK}>
            Source code
          </a>
        </p>
        <p>Data © PDDikti, Kemdiktisaintek. Proyek independen, tidak berafiliasi dengan PDDikti.</p>
      </PageContainer>
    </footer>
  )
}
