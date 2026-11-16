import type { Token } from '../types'

export interface CardContext {
  songId: string
  songTitle: string
  lineId: string
  /** La línea en japonés donde se guardó la palabra. */
  text: string
  translation: string
}

export interface Card {
  key: string
  token: Token
  context: CardContext
  /** Fechas como AAAA-MM-DD (hora local). */
  added: string
  due: string
  /** 0 = nueva o fallada; cada acierto sube una caja. */
  box: number
  reviews: number
  lapses: number
}

/** Días hasta el siguiente repaso según la caja. */
export const INTERVALS = [0, 1, 3, 7, 14, 30]

export function toDay(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

/** Identifica una palabra tal como se usa: misma forma y función = misma tarjeta, esté en la línea que esté. */
export function cardKey(t: Token): string {
  return [t.surface, t.base?.surface ?? '', t.form?.name ?? '', t.role ?? ''].join('|')
}

export function makeCard(token: Token, context: CardContext, today: string): Card {
  return { key: cardKey(token), token, context, added: today, due: today, box: 0, reviews: 0, lapses: 0 }
}

export function review(card: Card, knew: boolean, today: string): Card {
  if (!knew) return { ...card, box: 0, due: today, reviews: card.reviews + 1, lapses: card.lapses + 1 }
  const box = Math.min(card.box + 1, INTERVALS.length - 1)
  return { ...card, box, due: addDays(today, INTERVALS[box]), reviews: card.reviews + 1 }
}

export function dueCards(cards: Card[], today: string): Card[] {
  return cards.filter((c) => c.due <= today).sort((a, b) => a.due.localeCompare(b.due))
}
