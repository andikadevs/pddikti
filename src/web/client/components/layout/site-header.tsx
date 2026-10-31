// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { GraduationCapIcon } from 'lucide-react'
import { BRAND, NAV_LINKS } from '../../../nav.ts'
import { cn } from '@/lib/utils'
import { PageContainer } from '@/components/layout/page-container'
import { ThemeToggle } from '@/components/layout/theme-toggle'

/** Sticky top bar: brand, primary navigation, and the theme toggle. */
export function SiteHeader({ activeHref }: { activeHref: string }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <PageContainer className="flex h-14 items-center gap-6">
        <a href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GraduationCapIcon className="size-4" />
          </span>
          {BRAND}
        </a>
        <nav aria-label="Navigasi utama" className="no-scrollbar -mx-2 flex flex-1 items-center overflow-x-auto text-sm">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={link.href === activeHref ? 'page' : undefined}
              className={cn(
                'shrink-0 rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:text-foreground',
                link.href === activeHref && 'font-medium text-foreground',
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <ThemeToggle />
      </PageContainer>
    </header>
  )
}
