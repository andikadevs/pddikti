// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { GraduationCapIcon } from 'lucide-react'
import { BRAND, NAV_LINKS } from '../../../nav.ts'
import { cn } from '@/lib/utils'
import { AppLink } from '@/components/common/app-link'
import { PageContainer } from '@/components/layout/page-container'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { useScrolled } from '@/hooks/use-scrolled'

/**
 * Sticky top bar: brand, primary navigation, and the theme toggle. It blends into the page
 * at the top and lifts onto a floating card once the page scrolls; content scrolls
 * behind it, and the transparent gutter around the card passes clicks through.
 */
export function SiteHeader({ activeHref }: { activeHref: string }) {
  const scrolled = useScrolled()

  return (
    <header className="pointer-events-none sticky top-0 z-40 pt-4 pb-3 [view-transition-name:site-header]">
      <PageContainer>
        <div
          className={cn(
            'pointer-events-auto flex h-14 items-center gap-6 rounded-2xl px-3 transition-[background-color,box-shadow] duration-200',
            scrolled ? 'bg-card shadow-float' : 'bg-transparent shadow-none',
          )}
        >
        <AppLink href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCapIcon className="size-4" />
          </span>
          {BRAND}
        </AppLink>
        <nav aria-label="Navigasi utama" className="no-scrollbar -mx-2 flex flex-1 items-center overflow-x-auto text-sm">
          {NAV_LINKS.map((link) => (
            <AppLink
              key={link.href}
              href={link.href}
              aria-current={link.href === activeHref ? 'page' : undefined}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                link.href === activeHref && 'bg-muted font-medium text-foreground',
              )}
            >
              {link.label}
            </AppLink>
          ))}
        </nav>
        <ThemeToggle />
        </div>
      </PageContainer>
    </header>
  )
}
