import { describe, expect, it } from 'vitest'
import { parseProjectPage, projectPageRange } from '../../src/lib/pagination'

describe('project pagination', () => {
  it('defaults to the first page and accepts positive page numbers', () => {
    expect(parseProjectPage(undefined)).toBe(1)
    expect(parseProjectPage('3')).toBe(3)
  })
  it('rejects ambiguous, fractional, negative and oversized page parameters', () => {
    for (const value of ['0', '-1', '1.5', '01', '1000000', 'abc', ['1', '2']]) expect(parseProjectPage(value)).toBeNull()
  })
  it('reports first, middle and partial final page ranges', () => {
    expect(projectPageRange(1, 14)).toEqual({ first: 1, last: 6 })
    expect(projectPageRange(2, 14)).toEqual({ first: 7, last: 12 })
    expect(projectPageRange(3, 14)).toEqual({ first: 13, last: 14 })
    expect(projectPageRange(1, 0)).toEqual({ first: 0, last: 0 })
  })
})
