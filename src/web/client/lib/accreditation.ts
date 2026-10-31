// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

/** True for top-tier accreditation grades (A, Unggul, Baik Sekali). */
export function isTopAccreditation(value: string | null | undefined): boolean {
  if (!value) return false
  const v = value.trim().toLowerCase()
  return v.startsWith('a') || v.startsWith('unggul') || v.includes('baik')
}
