/** Map an accreditation value to a badge tone class. */
export function accreditationTone(value: string | null | undefined): 'good' | 'plain' {
  if (!value) return 'plain'
  const v = value.toLowerCase()
  return v.includes('baik') || v.startsWith('a') || v.startsWith('unggul') ? 'good' : 'plain'
}
