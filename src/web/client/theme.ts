/** Navy + gold brand palette (mirrors the CSS variables in styles.css). */
export const palette = {
  primary: '#0B2A5B',
  secondary: '#1E4D8C',
  accent: '#F5A623',
  bg: '#F7F9FC',
  ink: '#1A2433',
} as const

/** Map an accreditation value to a badge tone class. */
export function accreditationTone(value: string | null | undefined): 'good' | 'plain' {
  if (!value) return 'plain'
  const v = value.toLowerCase()
  return v.includes('baik') || v.startsWith('a') || v.startsWith('unggul') ? 'good' : 'plain'
}
