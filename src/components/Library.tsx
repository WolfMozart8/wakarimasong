import { useEffect, useState } from 'react'
import { listSongs, type SongSummary } from '../lib/api'

export function Library() {
  const [songs, setSongs] = useState<SongSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listSongs().then(setSongs, (e: Error) => setError(e.message))
  }, [])

  if (error) return <p className="error">No se pudo leer la carpeta de canciones: {error}</p>
  if (!songs) return <p className="hint">Cargando…</p>
  if (songs.length === 0)
    return <p className="hint">Aún no hay canciones. Los archivos van en la carpeta songs/ (ver docs/como-preparar-una-cancion.md).</p>

  return (
    <ul className="library">
      {songs.map((s) => (
        <li key={s.id}>
          <div>
            <a className="title" href={`#/song/${s.id}`}>
              {s.title}
            </a>
            {s.artist && <small> · {s.artist}</small>}
            {s.error ? (
              <p className="error">{s.error}</p>
            ) : (
              <p className="meta">
                {s.lineCount} líneas ·{' '}
                {s.syncedCount === s.lineCount
                  ? 'sincronizada'
                  : s.syncedCount
                    ? `${s.syncedCount} de ${s.lineCount} sincronizadas`
                    : 'sin sincronizar'}
              </p>
            )}
          </div>
          <a className="btn" href={`#/sync/${s.id}`}>
            Sincronizar
          </a>
        </li>
      ))}
    </ul>
  )
}
