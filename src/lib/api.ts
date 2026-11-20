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

// En producción (GitHub Pages) no hay servidor: las canciones son archivos estáticos
// generados en el build, las tarjetas viven en localStorage y no se puede guardar la sincronización.
const STATIC = import.meta.env.PROD
const CARDS_KEY = 'wakarimasong-cards'

export const listSongs = (): Promise<SongSummary[]> =>
  fetch(STATIC ? `${import.meta.env.BASE_URL}songs/index.json` : '/api/songs').then(json)

/** Carga y valida una canción; si el archivo tiene errores, los lanza todos juntos. */
export async function loadSong(id: string): Promise<Song> {
  const url = STATIC
    ? `${import.meta.env.BASE_URL}songs/${encodeURIComponent(id)}.json`
    : `/api/songs/${encodeURIComponent(id)}`
  const data = await fetch(url).then(json)
  const r = validateSong(data)
  if (!r.ok) throw new Error(`songs/${id}.json tiene errores:\n• ${r.errors.join('\n• ')}`)
  return r.song
}

export const saveSong = (id: string, song: Song): Promise<void> =>
  STATIC
    ? Promise.reject(new Error('Guardar la sincronización solo funciona en local (npm run dev).'))
    : fetch(`/api/songs/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(song),
  }).then(json)

export const fmtTime = (t: number | undefined) =>
  t === undefined ? '—' : `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`

export const loadCards = (): Promise<Card[]> =>
  STATIC
    ? Promise.resolve().then(() => JSON.parse(localStorage.getItem(CARDS_KEY) ?? '[]'))
    : fetch('/api/flashcards')
        .then(json)
        .then((d) => d.cards)

export const saveCards = (cards: Card[]): Promise<void> =>
  (STATIC
    ? Promise.resolve().then(() => localStorage.setItem(CARDS_KEY, JSON.stringify(cards)))
    : fetch('/api/flashcards', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cards }),
  }).then(json)
  )
    // Avisa al menú para que actualice el contador de pendientes.
    .then(() => void window.dispatchEvent(new Event('cards-changed')))
