// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ComponentProps, MouseEvent } from 'react'
import { isAppPath, navigate } from '@/lib/navigation'

/**
 * Anchor that navigates in-app for SPA paths and behaves like a normal link otherwise.
 * Modified clicks (new tab, new window) keep the browser default.
 */
export function AppLink({ href, onClick, ...props }: ComponentProps<'a'> & { href: string }) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)
    const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0
    if (event.defaultPrevented || modified || props.target || !isAppPath(href)) return
    event.preventDefault()
    navigate(href)
  }
  return <a href={href} onClick={handleClick} {...props} />
}
