import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { Song } from './types'
import { loadSong } from './lib/api'
import { Library } from './components/Library'
import { Player } from './components/Player'
import { SyncTool } from './components/SyncTool'
import './styles.css'

function useHashRoute() {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const on = () => setHash(location.hash)
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const [, view = '', id = ''] = hash.replace(/^#/, '').split('/')
  return { view, id: decodeURIComponent(id) }
}

function SongRoute({ id, mode }: { id: string; mode: 'song' | 'sync' }) {
  const [song, setSong] = useState<Song | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSong(null)
    setError(null)
    loadSong(id).then(setSong, (e: Error) => setError(e.message))
  }, [id, mode])

  if (error) return <pre className="error">{error}</pre>
  if (!song) return <p className="hint">Cargando…</p>
  return (
    <>
      <h2>
        {song.title}
        {song.artist && <small> · {song.artist}</small>}
        <a className="btn" href={mode === 'song' ? `#/sync/${id}` : `#/song/${id}`}>
          {mode === 'song' ? 'Sincronizar' : 'Ver canción'}
        </a>
      </h2>
      {mode === 'song' ? <Player song={song} /> : <SyncTool song={song} />}
    </>
  )
}

function App() {
  const { view, id } = useHashRoute()
  const inSong = (view === 'song' || view === 'sync') && id
  return (
    <main>
      <nav>
        <a href="#/">歌で学ぶ · Japonés con canciones</a>
      </nav>
      {inSong ? <SongRoute key={`${view}/${id}`} id={id} mode={view as 'song' | 'sync'} /> : <Library />}
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
