import type { Song } from '../types'
import { validateSong } from './validateSong'

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
