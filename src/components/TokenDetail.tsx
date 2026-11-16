import { KIND_LABEL, type Line, type Token } from '../types'

/** Explicación completa de una palabra dentro de su línea. */
export function TokenDetail({ line, token, onClose }: { line: Line; token: Token; onClose: () => void }) {
  const surfaceOf = (id: string) => line.tokens.find((t) => t.id === id)?.surface ?? '?'
  const related = line.links.filter((l) => l.from === token.id || l.to === token.id)

  return (
    <section className={`detail kind-${token.kind}`}>
      <header>
        <span className="detail-surface" lang="ja">
          {token.surface}
        </span>
        <span className="detail-meta">
          {[token.reading, token.romaji].filter(Boolean).join(' · ')}
          <span className="chip">{KIND_LABEL[token.kind]}</span>
        </span>
        <button className="ghost" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
      </header>

      <p className="detail-gloss">{token.gloss}</p>

      {token.role && (
        <p>
          <b>Función aquí:</b> {token.role}
        </p>
      )}

      {token.base && (
        <p className="detail-form">
          <span lang="ja">{token.base.surface}</span>
          {token.base.reading && token.base.reading !== token.base.surface && <small> ({token.base.reading})</small>}
          <small> «{token.base.meaning}»</small>
          <span className="arrow-text"> → </span>
          <span lang="ja">{token.surface}</span>
          {token.form && <span className="chip strong">{token.form.name}</span>}
        </p>
      )}
      {!token.base && token.form && (
        <p>
          <span className="chip strong">{token.form.name}</span>
        </p>
      )}
      {token.form && (
        <p>
          <b>Por qué esta forma:</b> {token.form.why}
        </p>
      )}

      {token.sungAs && (
        <p className="callout">
          <b>
            Escrito <span lang="ja">{token.surface}</span>
            {token.reading && <> ({token.reading})</>}, cantado <span lang="ja">{token.sungAs.reading}</span>.
          </b>{' '}
          {token.sungAs.note}
        </p>
      )}

      {token.note && (
        <p className="callout">
          <b>Ojo:</b> {token.note}
        </p>
      )}

      {related.length > 0 && (
        <ul className="related">
          {related.map((l, i) => (
            <li key={i} className={`link-${l.type}`}>
              <span lang="ja">{surfaceOf(l.from)}</span> <i>—{l.label}→</i> <span lang="ja">{surfaceOf(l.to)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
