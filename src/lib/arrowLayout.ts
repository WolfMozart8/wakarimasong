import type { Link } from '../types'

export interface Box {
  left: number
  width: number
}

export interface Arrow {
  link: Link
  /** x del origen y del destino, en las mismas unidades que las cajas. */
  x1: number
  x2: number
  /** 0 = pegada a las palabras; cada nivel va más lejos. */
  level: number
}

const MAX_STEP = 12
const GAP = 4

/**
 * Calcula dónde dibujar cada flecha: separa las puntas que comparten palabra
 * y reparte en niveles las flechas que se solaparían.
 */
export function layoutArrows(links: Link[], boxes: Record<string, Box>): Arrow[] {
  const valid = links.filter((l) => l.from !== l.to && boxes[l.from] && boxes[l.to])
  const center = (id: string) => boxes[id].left + boxes[id].width / 2

  // Puntas por palabra, ordenadas según de qué lado viene la flecha.
  const ends = new Map<string, { link: Link; other: number }[]>()
  for (const link of valid) {
    for (const [self, other] of [
      [link.from, link.to],
      [link.to, link.from],
    ]) {
      if (!ends.has(self)) ends.set(self, [])
      ends.get(self)!.push({ link, other: center(other) })
    }
  }
  const anchor = (id: string, link: Link) => {
    const list = ends.get(id)!.sort((a, b) => a.other - b.other)
    const n = list.length
    if (n === 1) return center(id)
    const step = Math.min(MAX_STEP, (boxes[id].width * 0.6) / (n - 1))
    return center(id) + (list.findIndex((e) => e.link === link) - (n - 1) / 2) * step
  }

  const arrows: Arrow[] = valid.map((link) => ({
    link,
    x1: anchor(link.from, link),
    x2: anchor(link.to, link),
    level: 0,
  }))

  // Las más cortas primero, para que queden más cerca de las palabras.
  const span = (a: Arrow) => [Math.min(a.x1, a.x2), Math.max(a.x1, a.x2)] as const
  const placed: Arrow[] = []
  for (const a of [...arrows].sort((p, q) => Math.abs(p.x2 - p.x1) - Math.abs(q.x2 - q.x1))) {
    const [lo, hi] = span(a)
    let level = 0
    while (
      placed.some((p) => {
        const [plo, phi] = span(p)
        return p.level === level && lo < phi + GAP && plo < hi + GAP
      })
    )
      level++
    a.level = level
    placed.push(a)
  }
  return arrows
}
