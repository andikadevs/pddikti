// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { GraduationCapIcon } from 'lucide-react'
import { useState } from 'react'
import { logoUrl } from '@/lib/api-paths'

/** University logo with an icon fallback when the upstream has none. */
export function PtLogo({ id, name }: { id: string; name: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-soft sm:size-24">
      {failed ? (
        <GraduationCapIcon className="size-10 text-muted-foreground" aria-hidden />
      ) : (
        <img src={logoUrl(id)} alt={`Logo ${name}`} className="size-full object-contain" onError={() => setFailed(true)} />
      )}
    </div>
  )
}
