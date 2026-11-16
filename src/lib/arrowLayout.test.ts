import { describe, expect, it } from 'vitest'
import { layoutArrows } from './arrowLayout'
import type { Link } from '../types'

const link = (from: string, to: string): Link => ({ from, to, type: 'modifies', label: '' })

// Cinco palabras de 40px de ancho, separadas 20px: centros en 20, 80, 140, 200, 260.
const boxes = Object.fromEntries(
  ['a', 'b', 'c', 'd', 'e'].map((id, i) => [id, { left: i * 60, width: 40 }]),
)

describe('layoutArrows', () => {
  it('une los centros de las dos palabras', () => {
    const [a] = layoutArrows([link('a', 'c')], boxes)
    expect(a.x1).toBe(20)
    expect(a.x2).toBe(140)
    expect(a.level).toBe(0)
  })

  it('omite flechas hacia palabras sin posición o hacia sí mismas', () => {
    expect(layoutArrows([link('a', 'zzz'), link('a', 'a')], boxes)).toEqual([])
  })

  it('pone en niveles distintos las flechas que se cruzan; la corta va más cerca', () => {
    const arrows = layoutArrows([link('a', 'e'), link('b', 'c')], boxes)
    const long = arrows.find((x) => x.link.from === 'a')!
    const short = arrows.find((x) => x.link.from === 'b')!
    expect(short.level).toBe(0)
    expect(long.level).toBe(1)
  })

  it('reutiliza el nivel cuando no se solapan', () => {
    const arrows = layoutArrows([link('a', 'b'), link('d', 'e')], boxes)
    expect(arrows.map((x) => x.level)).toEqual([0, 0])
  })

  it('separa las puntas que llegan a la misma palabra', () => {
    const arrows = layoutArrows([link('a', 'c'), link('e', 'c')], boxes)
    const fromLeft = arrows.find((x) => x.link.from === 'a')!
    const fromRight = arrows.find((x) => x.link.from === 'e')!
    expect(fromLeft.x2).toBeLessThan(140)
    expect(fromRight.x2).toBeGreaterThan(140)
    // No se salen de la palabra.
    expect(fromLeft.x2).toBeGreaterThan(120)
    expect(fromRight.x2).toBeLessThan(160)
  })

  it('conserva el orden de entrada', () => {
    const links = [link('a', 'e'), link('b', 'c')]
    expect(layoutArrows(links, boxes).map((x) => x.link)).toEqual(links)
  })
})
