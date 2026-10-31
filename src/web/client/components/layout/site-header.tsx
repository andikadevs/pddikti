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
    <header className="sticky top-0 z-40 pt-3 [view-transition-name:site-header]">
      <PageContainer>
        <div className="flex h-14 items-center gap-6 rounded-2xl bg-card/80 px-3 shadow-float backdrop-blur-md supports-[backdrop-filter]:bg-card/70">
        <a href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
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
                'shrink-0 rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                link.href === activeHref && 'bg-muted font-medium text-foreground',
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <ThemeToggle />
        </div>
      </PageContainer>
    </header>
  )
}
