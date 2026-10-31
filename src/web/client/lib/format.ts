// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

/** Presentation helpers shared across the SPA. Keep pure (no React). */

/** Locale number formatter for Indonesian grouping (e.g. 1.086). */
export const nf = new Intl.NumberFormat('id-ID')

/** Trimmed string, or a fallback when null/empty. */
export function text(value: string | null | undefined, fallback = '—'): string {
  const v = (value ?? '').toString().trim()
  return v === '' ? fallback : v
}

/** First 4-digit year out of a date-ish string, else the raw value or a dash. */
export function year(value: string | null | undefined): string {
  if (!value) return '—'
  const match = /^(\d{4})/.exec(value)
  return match?.[1] ?? value
}

/** Formatted number, or a fallback when null/undefined. */
export function num(value: number | null | undefined, fallback = '—'): string {
  return value != null ? nf.format(value) : fallback
}
