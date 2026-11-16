import { describe, expect, it } from 'vitest'
import { activeLine, lineEnd } from './activeLine'

const L = (start?: number, end?: number) => ({ start, end })

describe('activeLine', () => {
  const lines = [L(2), L(5), L(9, 11)]

  it('antes de la primera línea no hay línea activa', () => {
    expect(activeLine(lines, 0)).toBe(-1)
  })

  it('devuelve la última línea ya empezada', () => {
    expect(activeLine(lines, 2)).toBe(0)
    expect(activeLine(lines, 4.99)).toBe(0)
    expect(activeLine(lines, 5)).toBe(1)
  })

  it('respeta el final explícito de una línea', () => {
    expect(activeLine(lines, 10)).toBe(2)
    expect(activeLine(lines, 12)).toBe(-1)
  })

  it('ignora las líneas sin tiempo', () => {
    expect(activeLine([L(1), L(), L(6)], 3)).toBe(0)
    expect(activeLine([L(), L()], 3)).toBe(-1)
  })
})

describe('lineEnd', () => {
  it('usa end si existe, si no el inicio de la siguiente línea con tiempo', () => {
    const lines = [L(2), L(), L(7), L(9, 11)]
    expect(lineEnd(lines, 0)).toBe(7)
    expect(lineEnd(lines, 3)).toBe(11)
    expect(lineEnd([L(2)], 0)).toBe(Infinity)
  })
})
