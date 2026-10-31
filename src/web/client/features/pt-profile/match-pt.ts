// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { StudentHit } from '@/lib/types'

const normalize = (value: string | null | undefined): string => (value ?? '').trim().toLowerCase()

/** Does a student search hit belong to the university, matched by name or abbreviation? */
export function matchesPt(hit: StudentHit, ptName?: string, ptShortName?: string): boolean {
  const name = normalize(ptName)
  const short = normalize(ptShortName)
  const hitName = normalize(hit.nama_pt)
  const hitShort = normalize(hit.sinkatan_pt)
  return (
    (name !== '' && (hitName.includes(name) || hitShort.includes(name))) ||
    (short !== '' && (hitName.includes(short) || hitShort === short))
  )
}
