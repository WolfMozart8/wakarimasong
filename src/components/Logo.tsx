/** Wakari: un globo de diálogo que canta. Es la mascota y el icono de la app. */
export function Mascot({ size = 44 }: { size?: number }) {
  return (
    <svg className="mascot" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M14 50 L10 61 L24 53 Z" fill="var(--sun)" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="32" cy="30" r="24" fill="var(--sun)" stroke="var(--ink)" strokeWidth="3" />
      <path d="M21 28 q3.5 -5 7 0 M36 28 q3.5 -5 7 0" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="18" cy="35" r="3.5" fill="var(--pink)" opacity="0.8" />
      <circle cx="46" cy="35" r="3.5" fill="var(--pink)" opacity="0.8" />
      <ellipse cx="32" cy="39" rx="5.5" ry="5" fill="var(--ink)" />
      <ellipse cx="32" cy="41.5" rx="3.2" ry="2" fill="var(--tomato)" />
      <g className="mascot-note">
        <path d="M52 4 v14" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
        <path d="M52 4 q6 2 7 7" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="49" cy="18" rx="4" ry="3" fill="var(--tomato)" stroke="var(--ink)" strokeWidth="2" />
      </g>
    </svg>
  )
}

export function Logo() {
  return (
    <a href="#/" className="logo" aria-label="Wakarimasong, inicio">
      <Mascot />
      <span className="logo-word">
        Wakarima<span className="logo-song">song</span>
      </span>
      <span className="logo-tag" lang="ja">
        わかります！
      </span>
    </a>
  )
}
