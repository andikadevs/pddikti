import { describe, expect, test } from 'bun:test'
import { num, text, year } from '../src/web/client/lib/format.ts'

describe('client format helpers', () => {
  test('text: trims, falls back on null/empty', () => {
    expect(text('  hi  ')).toBe('hi')
    expect(text('')).toBe('—')
    expect(text(null)).toBe('—')
    expect(text(undefined, 'N/A')).toBe('N/A')
  })

  test('year: extracts leading 4-digit year', () => {
    expect(year('2001-08-17')).toBe('2001')
    expect(year('1998')).toBe('1998')
    expect(year(null)).toBe('—')
    expect(year('n/a')).toBe('n/a')
  })

  test('num: formats with id-ID grouping, falls back on null', () => {
    expect(num(1086)).toBe('1.086')
    expect(num(0)).toBe('0')
    expect(num(null)).toBe('—')
    expect(num(undefined, '-')).toBe('-')
  })
})
