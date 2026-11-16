import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Song } from '../types'
import { fmtTime, saveSong } from '../lib/api'
import { useTransport } from '../lib/transport'
import { clockDuration } from './Player'

const round = (t: number) => Math.round(t * 100) / 100

/** Marca el inicio de cada línea mientras suena la canción y lo guarda en el archivo. */
export function SyncTool({ song }: { song: Song }) {
  const duration = useMemo(() => Math.max(clockDuration(song), 600), [song])
  const { hostRef, transport, time, playing, error } = useTransport(song.youtubeId || undefined, duration)
  const [starts, setStarts] = useState<(number | undefined)[]>(() => song.lines.map((l) => l.start))
  const [cursor, setCursor] = useState(() => {
    const first = song.lines.findIndex((l) => l.start === undefined)
    return first === -1 ? 0 : first
  })
  const [status, setStatus] = useState<{ kind: 'idle' | 'dirty' | 'saved' | 'error'; msg?: string }>({ kind: 'idle' })

  const set = (i: number, v: number | undefined) => {
    setStarts((s) => s.map((x, j) => (j === i ? v : x)))
    setStatus({ kind: 'dirty' })
  }

  const mark = useCallback(() => {
    if (!transport || cursor >= song.lines.length) return
    set(cursor, round(transport.getTime()))
    setCursor((c) => Math.min(c + 1, song.lines.length))
  }, [transport, cursor, song.lines.length])

  const undo = useCallback(() => {
    const i = Math.max(0, cursor - 1)
    set(i, undefined)
    setCursor(i)
    const prev = starts.slice(0, i).reverse().find((x) => x !== undefined)
    transport?.seek(Math.max(0, (prev ?? 0) - 1))
  }, [cursor, starts, transport])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        mark()
      } else if (e.code === 'Backspace') {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mark, undo])

  const outOfOrder = (i: number) => {
    const cur = starts[i]
    if (cur === undefined) return false
    return starts.slice(0, i).some((p) => p !== undefined && p > cur)
  }
  const anyOutOfOrder = starts.some((_, i) => outOfOrder(i))

  const save = async () => {
    const next: Song = {
      ...song,
      lines: song.lines.map((l, i) => {
        const { start: _old, ...rest } = l
        return starts[i] === undefined ? rest : { ...rest, start: starts[i] }
      }),
    }
    try {
      await saveSong(song.id, next)
      setStatus({ kind: 'saved', msg: `Guardado en songs/${song.id}.json` })
    } catch (e) {
      setStatus({ kind: 'error', msg: (e as Error).message })
    }
  }

  return (
    <div className="player sync">
      {song.youtubeId ? (
        <div className="video" ref={hostRef} />
      ) : (
        <div className="video novideo" ref={hostRef}>
          Sin video: cronómetro {fmtTime(time)}
        </div>
      )}
      {error && <p className="error">{error}</p>}

      <p className="notice">
        Reproduce y pulsa <kbd>Espacio</kbd> justo cuando empiece la línea resaltada. <kbd>Retroceso</kbd> deshace la
        última marca. Si acabas de hacer clic dentro del video, las teclas van a YouTube: usa los botones o haz clic
        fuera del video primero.
      </p>

      <div className="controls">
        <button onClick={() => (playing ? transport?.pause() : transport?.play())} disabled={!transport}>
          {playing ? '⏸ Pausa' : '▶ Reproducir'}
        </button>
        <button className="primary" onClick={mark} disabled={!transport || cursor >= song.lines.length}>
          ● Marcar línea ({fmtTime(time)})
        </button>
        <button onClick={undo} disabled={cursor === 0 && starts[0] === undefined}>
          ⌫ Deshacer
        </button>
        <button onClick={save} disabled={anyOutOfOrder || status.kind === 'idle' || status.kind === 'saved'}>
          💾 Guardar
        </button>
        {status.kind === 'dirty' && <span className="dirty">Cambios sin guardar</span>}
        {status.kind === 'saved' && <span className="ok">{status.msg}</span>}
        {status.kind === 'error' && <span className="error">{status.msg}</span>}
        {anyOutOfOrder && <span className="error">Hay tiempos fuera de orden (en rojo); corrígelos para guardar.</span>}
      </div>

      <ol className="lines">
        {song.lines.map((l, i) => (
          <li key={l.id} className={`${i === cursor ? 'current' : ''}${outOfOrder(i) ? ' bad' : ''}`}>
            <button onClick={() => setCursor(i)} title="Marcar a partir de esta línea">
              <span className="t">{fmtTime(starts[i])}</span>
              <span lang="ja">{l.tokens.map((t) => t.surface).join('')}</span>
              <small>{l.translation}</small>
            </button>
            {starts[i] !== undefined && (
              <span className="nudge">
                <button onClick={() => set(i, round(Math.max(0, starts[i]! - 0.1)))}>−0.1</button>
                <button onClick={() => set(i, round(starts[i]! + 0.1))}>+0.1</button>
                <button onClick={() => transport?.seek(Math.max(0, starts[i]! - 1))} title="Escuchar desde 1 s antes">
                  ▶
                </button>
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
