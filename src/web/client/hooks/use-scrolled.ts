// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useEffect, useState } from 'react'

/** Whether the window is scrolled past `threshold` pixels from the top. */
export function useScrolled(threshold = 8): boolean {
  const [scrolled, setScrolled] = useState(() => window.scrollY > threshold)

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > threshold)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [threshold])

  return scrolled
}
