import { useEffect, useMemo, useRef, useState } from 'react'
import type { Song } from '../types'
import { activeLine, lineEnd } from '../lib/activeLine'
import { fmtTime } from '../lib/api'
import { useTransport } from '../lib/transport'
import { LineView } from './LineView'
import { TokenDetail } from './TokenDetail'

const RATES = [0.5, 0.75, 1]

export function clockDuration(song: Song) {
  const last = song.lines.reduce((m, l) => Math.max(m, l.end ?? l.start ?? 0), 0)
  return last + 6
}

export function Player({ song }: { song: Song }) {
  const duration = useMemo(() => clockDuration(song), [song])
  const { hostRef, transport, time, playing, error } = useTransport(song.youtubeId || undefined, duration)
  const [idx, setIdx] = useState(0)
  const [tokenId, setTokenId] = useState<string | null>(null)
  const [loop, setLoop] = useState(false)
  const [rate, setRate] = useState(1)
  const [showRomaji, setShowRomaji] = useState(() => localStorage.getItem('romaji') !== '0')

  const synced = song.lines.some((l) => l.start !== undefined)
  const line = song.lines[idx]
  const token = line?.tokens.find((t) => t.id === tokenId) ?? null

  // Seguir al video, o repetir la línea elegida.
  const lastTime = useRef(0)
  useEffect(() => {
    // En pausa solo se sigue al video si el usuario saltó en la barra de tiempo.
    const jumped = Math.abs(time - lastTime.current) > 0.5
    lastTime.current = time
    if (!transport || (!playing && !jumped)) return
    const cur = song.lines[idx]
    if (loop && cur?.start !== undefined) {
      if (time >= lineEnd(song.lines, idx) || time < cur.start - 0.3) transport.seek(cur.start)
      return
    }
    const a = activeLine(song.lines, time)
    if (a !== -1 && a !== idx) {
      setIdx(a)
      setTokenId(null)
    }
  }, [time, playing, loop, idx, song, transport])

  useEffect(() => {
    document.querySelector('.lines li.current')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [idx])

  const goTo = (i: number) => {
    if (i < 0 || i >= song.lines.length) return
    setIdx(i)
    setTokenId(null)
    const s = song.lines[i].start
    if (s !== undefined) transport?.seek(s)
  }

  const selectToken = (id: string) => {
    transport?.pause()
    setTokenId((cur) => (cur === id ? null : id))
  }

  const changeRate = (r: number) => {
    setRate(r)
    transport?.setRate(r)
  }

  const toggleRomaji = () =>
    setShowRomaji((v) => {
      localStorage.setItem('romaji', v ? '0' : '1')
      return !v
    })

  return (
    <div className="player">
      {song.youtubeId ? (
        <div className="video" ref={hostRef} />
      ) : (
        <div className="video novideo" ref={hostRef}>
          Sin video: cronómetro {fmtTime(time)}
        </div>
      )}
      {error && <p className="error">{error}</p>}
      {!synced && (
        <p className="notice">
          Esta canción aún no tiene tiempos. Puedes leerla línea por línea o <a href={`#/sync/${song.id}`}>sincronizarla</a>.
        </p>
      )}

      <div className="controls">
        <button onClick={() => (playing ? transport?.pause() : transport?.play())} disabled={!transport}>
          {playing ? '⏸ Pausa' : '▶ Reproducir'}
        </button>
        <button onClick={() => goTo(idx - 1)} disabled={idx === 0}>
          ← Anterior
        </button>
        <button onClick={() => goTo(idx)}>↺ Repetir</button>
        <button onClick={() => goTo(idx + 1)} disabled={idx >= song.lines.length - 1}>
          Siguiente →
        </button>
        <label className="toggle">
          <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} /> Bucle en esta línea
        </label>
        <label className="toggle">
          <input type="checkbox" checked={showRomaji} onChange={toggleRomaji} /> Romaji
        </label>
        <span className="rates">
          {RATES.map((r) => (
            <button key={r} className={r === rate ? 'on' : ''} onClick={() => changeRate(r)}>
              {r}×
            </button>
          ))}
        </span>
      </div>

      {line && (
        <div className="stage">
          <LineView line={line} showRomaji={showRomaji} selectedTokenId={tokenId} onSelectToken={selectToken} />
          <p className="translation">{line.translation}</p>
          {line.literal && <p className="literal">Literal: {line.literal}</p>}
          {line.notes?.map((n, i) => (
            <p key={i} className="line-note">
              {n}
            </p>
          ))}
          {token ? (
            <TokenDetail line={line} token={token} onClose={() => setTokenId(null)} />
          ) : (
            <p className="hint">Toca una palabra para ver su explicación.</p>
          )}
        </div>
      )}

      <ol className="lines">
        {song.lines.map((l, i) => (
          <li key={l.id} className={i === idx ? 'current' : ''}>
            <button onClick={() => goTo(i)}>
              <span className="t">{fmtTime(l.start)}</span>
              <span lang="ja">{l.tokens.map((t) => t.surface).join('')}</span>
              <small>{l.translation}</small>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
