import { useEffect, useState } from 'react'
import { listSongs, type SongSummary } from '../lib/api'
import { Mascot } from './Logo'

export function Library() {
  const [songs, setSongs] = useState<SongSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listSongs().then(setSongs, (e: Error) => setError(e.message))
  }, [])

  return (
    <>
      <section className="hero">
        <Mascot size={92} />
        <div>
          <h1>
            Canta. Entiende. <span lang="ja">わかります！</span>
          </h1>
          <p>Elige una canción, toca cualquier palabra y descubre qué hace ahí.</p>
        </div>
      </section>

      {error && <p className="error">No se pudo leer la carpeta de canciones: {error}</p>}
      {!error && !songs && <p className="hint">Rebobinando casetes…</p>}
      {songs?.length === 0 && (
        <p className="hint">
          Aún no hay canciones. Los archivos van en la carpeta songs/ (ver docs/como-preparar-una-cancion.md).
        </p>
      )}

      {songs && songs.length > 0 && (
        <ul className="library">
          {songs.map((s) => {
            const synced = !s.error && s.syncedCount === s.lineCount
            return (
              <li key={s.id} className="cassette">
                <a className="cassette-body" href={`#/song/${s.id}`}>
                  <span className="cassette-label">
                    <span className="title">{s.title}</span>
                    {s.artist && <span className="artist">{s.artist}</span>}
                    {!s.error && <span className="artist">{s.lineCount} líneas</span>}
                  </span>
                  <span className="cassette-window" aria-hidden="true">
                    <span className="reel" />
                    <span className="tape" />
                    <span className="reel" />
                  </span>
                </a>
                <div className="cassette-foot">
                  {s.error ? (
                    <span className="error">{s.error}</span>
                  ) : (
                    <span className={`chip ${synced ? 'ok' : 'todo'}`}>
                      {synced
                        ? '✓ lista para cantar'
                        : s.syncedCount
                          ? `⏱ ${s.syncedCount}/${s.lineCount} con tiempo`
                          : '⏱ sin tiempos'}
                    </span>
                  )}
                  <a className="btn small" href={`#/sync/${s.id}`}>
                    ⏱ Sincronizar
                  </a>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
