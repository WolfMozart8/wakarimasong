import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadCards, saveCards } from '../lib/api'
import { dueCards, review, toDay, type Card } from '../lib/flashcards'
import type { Line } from '../types'
import { TokenDetail } from './TokenDetail'

/** Repaso diario: muestra la palabra en su línea, tú decides si la sabías. */
export function Review() {
  const [cards, setCards] = useState<Card[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(0)
  const today = toDay()

  useEffect(() => {
    loadCards().then(setCards, (e: Error) => setError(e.message))
  }, [])

  const queue = useMemo(() => (cards ? dueCards(cards, today) : []), [cards, today])
  const card = queue[0]

  const persist = useCallback((next: Card[]) => {
    setCards(next)
    saveCards(next).then(
      () => setError(null),
      (e: Error) => setError(e.message),
    )
  }, [])

  const answer = useCallback(
    (knew: boolean) => {
      if (!cards || !card) return
      const updated = review(card, knew, today)
      // La fallada va al final para que vuelva a salir en esta misma sesión.
      persist([...cards.filter((c) => c.key !== card.key), updated])
      setRevealed(false)
      if (knew) setDone((n) => n + 1)
    },
    [cards, card, today, persist],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!card) return
      if (!revealed && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault()
        setRevealed(true)
      } else if (revealed && e.key === '1') answer(false)
      else if (revealed && e.key === '2') answer(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [card, revealed, answer])

  if (error && !cards) return <p className="error">No se pudieron leer las tarjetas: {error}</p>
  if (!cards) return <p className="hint">Cargando…</p>

  // TokenDetail necesita una línea; en el repaso no hay flechas que mostrar.
  const soloLine = (c: Card): Line => ({ id: c.context.lineId, tokens: [c.token], links: [], translation: c.context.translation })

  return (
    <div className="review">
      <h2>
        Repaso
        <small>
          {queue.length} pendientes hoy · {cards.length} tarjetas en total
        </small>
      </h2>
      {error && <p className="error">{error}</p>}

      {cards.length === 0 && (
        <p className="hint">Aún no hay tarjetas. En una canción, toca una palabra y pulsa «＋ Tarjeta».</p>
      )}

      {cards.length > 0 && !card && (
        <p className="ok">
          {done > 0 ? `Listo por hoy: ${done} repasadas.` : 'No hay nada pendiente hoy.'} Próximo repaso:{' '}
          {cards.map((c) => c.due).sort()[0]}.
        </p>
      )}

      {card && (
        <div className={`stage card kind-${card.token.kind}`}>
          <p className="card-word" lang="ja">
            {card.token.surface}
          </p>
          <p className="card-context" lang="ja">
            {card.context.text}
          </p>
          <p className="literal">{card.context.songTitle}</p>

          {!revealed ? (
            <div className="card-buttons">
              <button className="primary" onClick={() => setRevealed(true)}>
                Mostrar respuesta <kbd>Espacio</kbd>
              </button>
            </div>
          ) : (
            <>
              <p className="translation">{card.context.translation}</p>
              <TokenDetail line={soloLine(card)} token={card.token} />
              <div className="card-buttons">
                <button onClick={() => answer(false)}>
                  ✗ No la sabía <kbd>1</kbd>
                </button>
                <button className="primary" onClick={() => answer(true)}>
                  ✓ La sabía <kbd>2</kbd>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {cards.length > 0 && (
        <details className="card-list">
          <summary>Todas las tarjetas</summary>
          <ul>
            {[...cards]
              .sort((a, b) => a.due.localeCompare(b.due))
              .map((c) => (
                <li key={c.key}>
                  <span lang="ja" className={`kind-${c.token.kind}`}>
                    {c.token.surface}
                  </span>
                  <span>{c.token.gloss}</span>
                  <small>
                    {c.due <= today ? 'hoy' : c.due} · {c.reviews} repasos, {c.lapses} fallos
                  </small>
                  <a href={`#/song/${c.context.songId}`}>canción</a>
                  <button className="ghost" onClick={() => persist(cards.filter((x) => x.key !== c.key))} title="Quitar tarjeta">
                    ✕
                  </button>
                </li>
              ))}
          </ul>
        </details>
      )}
    </div>
  )
}
