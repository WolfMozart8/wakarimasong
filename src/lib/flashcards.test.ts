import { describe, expect, it } from 'vitest'
import { addDays, cardKey, dueCards, makeCard, review, toDay } from './flashcards'
import type { Token } from '../types'

const natte: Token = {
  id: 't4',
  surface: 'なって',
  gloss: 'convirtiéndome',
  kind: 'verb',
  base: { surface: 'なる', reading: 'なる', meaning: 'convertirse' },
  form: { name: 'forma て', why: '…' },
}
const ctx = { songId: 's', songTitle: 'S', lineId: 'l1', text: '蝶になって', translation: '…' }

describe('fechas', () => {
  it('toDay usa la fecha local', () => {
    expect(toDay(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
  it('addDays cruza meses y años', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })
})

describe('cardKey', () => {
  it('es la misma para la misma palabra en otra línea', () => {
    expect(cardKey(natte)).toBe(cardKey({ ...natte, id: 't9' }))
  })
  it('distingue formas distintas del mismo verbo', () => {
    expect(cardKey(natte)).not.toBe(cardKey({ ...natte, surface: 'なれ', form: { name: 'imperativo', why: '' } }))
  })
  it('distingue una partícula según su función', () => {
    const ni: Token = { id: 'a', surface: 'に', gloss: 'hacia', kind: 'particle', role: 'Destino' }
    expect(cardKey(ni)).not.toBe(cardKey({ ...ni, role: 'Propósito' }))
  })
})

describe('repaso', () => {
  const card = makeCard(natte, ctx, '2026-03-01')

  it('una tarjeta nueva toca hoy mismo', () => {
    expect(card.box).toBe(0)
    expect(dueCards([card], '2026-03-01')).toHaveLength(1)
  })

  it('acertar la aleja cada vez más: 1, 3, 7 días…', () => {
    const a = review(card, true, '2026-03-01')
    expect(a.due).toBe('2026-03-02')
    const b = review(a, true, '2026-03-02')
    expect(b.due).toBe('2026-03-05')
    const c = review(b, true, '2026-03-05')
    expect(c.due).toBe('2026-03-12')
    expect(c.reviews).toBe(3)
  })

  it('el intervalo no crece más allá del máximo', () => {
    let c = card
    for (let i = 0; i < 20; i++) c = review(c, true, '2026-03-01')
    expect(c.due).toBe(addDays('2026-03-01', 30))
  })

  it('fallar la devuelve al principio y sigue pendiente hoy', () => {
    const a = review(review(card, true, '2026-03-01'), true, '2026-03-02')
    const f = review(a, false, '2026-03-05')
    expect(f.box).toBe(0)
    expect(f.lapses).toBe(1)
    expect(dueCards([f], '2026-03-05')).toHaveLength(1)
  })

  it('dueCards deja fuera las futuras y pone primero las más atrasadas', () => {
    const late = { ...card, key: 'a', due: '2026-02-20' }
    const now = { ...card, key: 'b', due: '2026-03-01' }
    const future = { ...card, key: 'c', due: '2026-03-02' }
    expect(dueCards([future, now, late], '2026-03-01').map((c) => c.key)).toEqual(['a', 'b'])
  })
})
