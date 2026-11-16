import type { Song } from '../types'
import { validateSong } from './validateSong'
import type { Card } from './flashcards'

export interface SongSummary {
  id: string
  title: string
  artist?: string
  lineCount?: number
  syncedCount?: number
  error?: string
}

async function json(res: Response) {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error ?? `Error ${res.status}`)
  return body
}

export const listSongs = (): Promise<SongSummary[]> => fetch('/api/songs').then(json)

/** Carga y valida una canción; si el archivo tiene errores, los lanza todos juntos. */
export async function loadSong(id: string): Promise<Song> {
  const data = await fetch(`/api/songs/${encodeURIComponent(id)}`).then(json)
  const r = validateSong(data)
  if (!r.ok) throw new Error(`songs/${id}.json tiene errores:\n• ${r.errors.join('\n• ')}`)
  return r.song
}

export const saveSong = (id: string, song: Song): Promise<void> =>
  fetch(`/api/songs/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(song),
  }).then(json)

export const fmtTime = (t: number | undefined) =>
  t === undefined ? '—' : `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`

export const loadCards = (): Promise<Card[]> =>
  fetch('/api/flashcards')
    .then(json)
    .then((d) => d.cards)

export const saveCards = (cards: Card[]): Promise<void> =>
  fetch('/api/flashcards', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cards }),
  })
    .then(json)
    // Avisa al menú para que actualice el contador de pendientes.
    .then(() => void window.dispatchEvent(new Event('cards-changed')))
