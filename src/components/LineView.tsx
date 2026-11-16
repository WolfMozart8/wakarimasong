import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Line } from '../types'
import { layoutArrows, type Box } from '../lib/arrowLayout'

interface Props {
  line: Line
  showRomaji: boolean
  selectedTokenId: string | null
  onSelectToken: (id: string) => void
}

const LEVEL_H = 26
const TOP = 16

/** Dibuja una línea: palabras con lectura y significado, y debajo las flechas que las relacionan. */
export function LineView({ line, showRomaji, selectedTokenId, onSelectToken }: Props) {
  const outerRef = useRef<HTMLDivElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const [boxes, setBoxes] = useState<Record<string, Box>>({})
  const [rowWidth, setRowWidth] = useState(0)
  const [scale, setScale] = useState(1)
  const [rowH, setRowH] = useState(0)

  useLayoutEffect(() => {
    const measure = () => {
      const row = rowRef.current
      const outer = outerRef.current
      if (!row || !outer) return
      const next: Record<string, Box> = {}
      row.querySelectorAll<HTMLElement>('[data-token]').forEach((el) => {
        next[el.dataset.token!] = { left: el.offsetLeft, width: el.offsetWidth }
      })
      setBoxes(next)
      setRowWidth(row.offsetWidth)
      setRowH(row.offsetHeight)
      // Si la línea no cabe, se encoge entera (hasta un límite) en vez de partirse.
      setScale(Math.max(0.55, Math.min(1, outer.clientWidth / row.offsetWidth)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (outerRef.current) ro.observe(outerRef.current)
    if (rowRef.current) ro.observe(rowRef.current)
    document.fonts?.ready.then(measure)
    return () => ro.disconnect()
  }, [line, showRomaji])

  const arrows = useMemo(() => layoutArrows(line.links, boxes), [line.links, boxes])
  const levels = arrows.reduce((m, a) => Math.max(m, a.level + 1), 0)
  const svgH = levels ? TOP + levels * LEVEL_H + 6 : 0
  const highlighted = (from: string, to: string) =>
    selectedTokenId !== null && (from === selectedTokenId || to === selectedTokenId)

  return (
    <div className="line-outer" ref={outerRef}>
      <div className="line-sizer" style={{ width: rowWidth * scale, height: (rowH + svgH) * scale }}>
        <div className="line-scaler" style={{ transform: `scale(${scale})` }}>
          <div className="line-row" ref={rowRef}>
            {line.tokens.map((t) => (
              <button
                key={t.id}
                data-token={t.id}
                className={`token kind-${t.kind}${t.id === selectedTokenId ? ' selected' : ''}`}
                onClick={() => onSelectToken(t.id)}
              >
                <span className="reading">
                  {t.sungAs ? <span className="sung">♪ {t.sungAs.reading}</span> : (t.reading ?? ' ')}
                </span>
                <span className="surface" lang="ja">
                  {t.surface}
                </span>
                {showRomaji && <span className="romaji">{t.sungAs?.romaji ?? t.romaji ?? ' '}</span>}
                <span className="gloss">{t.gloss || ' '}</span>
                <span className="emoji">{t.emoji ?? ' '}</span>
                {(t.note || t.sungAs) && (
                  <span className="flag" title="Tiene una nota">
                    !
                  </span>
                )}
              </button>
            ))}
          </div>
          {svgH > 0 && (
            <svg className="arrows" width={rowWidth} height={svgH} aria-hidden="true">
              {arrows.map((a, i) => {
                const y = TOP + a.level * LEVEL_H
                const r = Math.min(8, Math.abs(a.x2 - a.x1) / 2)
                const dir = a.x2 > a.x1 ? 1 : -1
                const d = `M${a.x1} 2 V${y - r} Q${a.x1} ${y} ${a.x1 + dir * r} ${y} H${a.x2 - dir * r} Q${a.x2} ${y} ${a.x2} ${y - r} V11`
                return (
                  <g key={i} className={`arrow link-${a.link.type}${highlighted(a.link.from, a.link.to) ? ' hl' : ''}`}>
                    <path d={d} />
                    <polygon points={`${a.x2 - 5},12 ${a.x2},3 ${a.x2 + 5},12`} />
                    <circle cx={a.x1} cy={3} r={3} />
                    {a.link.label && (
                      <text x={(a.x1 + a.x2) / 2} y={y + 4} textAnchor="middle">
                        {a.link.label}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          )}
        </div>
      </div>
    </div>
  )
}
