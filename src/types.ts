export const TOKEN_KINDS = ['noun', 'verb', 'adj', 'particle', 'aux', 'adv', 'expr', 'other'] as const
export type TokenKind = (typeof TOKEN_KINDS)[number]

export const LINK_TYPES = [
  'possession',
  'destination',
  'object',
  'subject',
  'topic',
  'modifies',
  'connects',
] as const
export type LinkType = (typeof LINK_TYPES)[number]

export interface Token {
  id: string
  /** Tal como está escrito en la letra. */
  surface: string
  /** Lectura en kana (de diccionario). */
  reading?: string
  romaji?: string
  /** Significado corto en español. */
  gloss: string
  emoji?: string
  kind: TokenKind
  /** Función de la partícula en esta línea. */
  role?: string
  /** Forma de diccionario, si la palabra está conjugada. */
  base?: { surface: string; reading?: string; meaning: string }
  /** Nombre de la forma y por qué se usa aquí. */
  form?: { name: string; why: string }
  /** Cuando lo cantado no coincide con lo escrito. */
  sungAs?: { reading: string; romaji?: string; note: string }
  /** Doble sentido, kanji raro, etc. */
  note?: string
}

export interface Link {
  from: string
  to: string
  type: LinkType
  label: string
}

export interface Line {
  id: string
  /** Segundos desde el inicio del video. */
  start?: number
  end?: number
  tokens: Token[]
  links: Link[]
  translation: string
  literal?: string
  notes?: string[]
  image?: string
}

export interface Song {
  id: string
  title: string
  artist?: string
  /** Vacío = sin video; la app usa un cronómetro. */
  youtubeId?: string
  lines: Line[]
}

export const KIND_LABEL: Record<TokenKind, string> = {
  noun: 'sustantivo',
  verb: 'verbo',
  adj: 'adjetivo',
  particle: 'partícula',
  aux: 'auxiliar',
  adv: 'adverbio',
  expr: 'expresión',
  other: 'otro',
}
