interface Timed {
  start?: number
  end?: number
}

/** Momento en que deja de sonar la línea i: su `end`, o el inicio de la siguiente línea con tiempo. */
export function lineEnd(lines: Timed[], i: number): number {
  const own = lines[i]?.end
  if (own !== undefined) return own
  for (let j = i + 1; j < lines.length; j++) {
    const s = lines[j].start
    if (s !== undefined) return s
  }
  return Infinity
}

/** Índice de la línea que suena en el segundo `t`, o -1 si no hay ninguna. */
export function activeLine(lines: Timed[], t: number): number {
  let found = -1
  for (let i = 0; i < lines.length; i++) {
    const s = lines[i].start
    if (s !== undefined && s <= t) found = i
  }
  if (found === -1) return -1
  const end = lines[found].end
  return end !== undefined && t > end ? -1 : found
}
