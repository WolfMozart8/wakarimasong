import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { DIFFICULTY_LABEL, type Song } from './types'
import { loadCards, loadSong } from './lib/api'
import { dueCards, toDay } from './lib/flashcards'
import { Review } from './components/Review'
import { Library } from './components/Library'
import { Player } from './components/Player'
import { SyncTool } from './components/SyncTool'
import { Logo } from './components/Logo'
import { ThemeToggle } from './components/ThemeToggle'
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
      <h2 className="song-title">
        <span>
          {song.title}
          {song.artist && <small>{song.artist}</small>}
          {song.difficulty && (
            <small title={song.difficulty.why}>
              Dificultad: {DIFFICULTY_LABEL[song.difficulty.level] ?? song.difficulty.level} · japonés {song.difficulty.jlpt} · {song.difficulty.why}
            </small>
          )}
        </span>
        <a className="btn" href={mode === 'song' ? `#/sync/${id}` : `#/song/${id}`}>
          {mode === 'song' ? '⏱ Sincronizar' : '▶ Ver canción'}
        </a>
      </h2>
      {mode === 'song' ? <Player song={song} /> : <SyncTool song={song} />}
    </>
  )
}

function App() {
  const { view, id } = useHashRoute()
  const [due, setDue] = useState<number | null>(null)
  useEffect(() => {
    const refresh = () =>
      loadCards().then(
        (c) => setDue(dueCards(c, toDay()).length),
        () => setDue(null),
      )
    refresh()
    window.addEventListener('cards-changed', refresh)
    return () => window.removeEventListener('cards-changed', refresh)
  }, [view, id])
  const inSong = (view === 'song' || view === 'sync') && id
  return (
    <main>
      <nav>
        <Logo />
        <span className="nav-right">
          <ThemeToggle />
          <a href="#/review" className={`nav-review${due ? ' due' : ''}${view === 'review' ? ' here' : ''}`}>
            🃏 <span className="nav-label">Repaso</span>
            {due ? <span className="badge">{due}</span> : null}
          </a>
        </span>
      </nav>
      {inSong ? (
        <SongRoute key={`${view}/${id}`} id={id} mode={view as 'song' | 'sync'} />
      ) : view === 'review' ? (
        <Review />
      ) : (
        <Library />
      )}
      <footer>Hecho con ♪ y partículas confusas.</footer>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
