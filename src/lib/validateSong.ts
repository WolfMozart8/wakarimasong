import { DIFFICULTY_LEVELS, LINK_TYPES, TOKEN_KINDS, type Song } from '../types'

export type ValidationResult = { ok: true; song: Song } | { ok: false; errors: string[] }

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0
const isTime = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0

/** Comprueba que un archivo de canción tiene la forma esperada y da errores legibles. */
export function validateSong(data: unknown): ValidationResult {
  const errors: string[] = []
  if (!isObj(data)) return { ok: false, errors: ['El archivo no contiene un objeto de canción.'] }

  if (!isStr(data.id)) errors.push('Falta "id" de la canción.')
  if (!isStr(data.title)) errors.push('Falta "title" de la canción.')
  if (data.youtubeId !== undefined && typeof data.youtubeId !== 'string')
    errors.push('"youtubeId" debe ser texto.')
  if (data.difficulty !== undefined) {
    const d = data.difficulty
    if (!isObj(d) || !(DIFFICULTY_LEVELS as readonly unknown[]).includes(d.level) || !isStr(d.jlpt) || !isStr(d.why))
      errors.push('"difficulty" debe tener "level" (facil, medio, dificil, muy-dificil), "jlpt" y "why".')
  }
  if (!Array.isArray(data.lines)) {
    errors.push('Falta la lista "lines".')
    return { ok: false, errors }
  }

  let lastStart = -1
  const lineIds = new Set<string>()
  data.lines.forEach((line: unknown, i: number) => {
    if (!isObj(line)) {
      errors.push(`Línea ${i + 1}: no es un objeto.`)
      return
    }
    const where = `Línea ${i + 1} (${isStr(line.id) ? line.id : 'sin id'})`
    if (!isStr(line.id)) errors.push(`${where}: falta "id".`)
    else if (lineIds.has(line.id)) errors.push(`${where}: "id" repetido.`)
    else lineIds.add(line.id)

    if (typeof line.translation !== 'string') errors.push(`${where}: falta "translation".`)

    if (line.start !== undefined) {
      if (!isTime(line.start)) errors.push(`${where}: "start" debe ser un número de segundos.`)
      else {
        if (line.start < lastStart)
          errors.push(`${where}: empieza (${line.start}s) antes que una línea anterior (${lastStart}s).`)
        lastStart = Math.max(lastStart, line.start)
      }
    }
    if (line.end !== undefined && !isTime(line.end))
      errors.push(`${where}: "end" debe ser un número de segundos.`)

    const ids = new Set<string>()
    if (!Array.isArray(line.tokens) || line.tokens.length === 0) {
      errors.push(`${where}: falta la lista "tokens".`)
    } else {
      line.tokens.forEach((t: unknown, j: number) => {
        const tw = `${where}, palabra ${j + 1}`
        if (!isObj(t)) return void errors.push(`${tw}: no es un objeto.`)
        if (!isStr(t.id)) errors.push(`${tw}: falta "id".`)
        else if (ids.has(t.id)) errors.push(`${tw}: "id" repetido (${t.id}).`)
        else ids.add(t.id)
        if (!isStr(t.surface)) errors.push(`${tw}: falta "surface".`)
        if (typeof t.gloss !== 'string') errors.push(`${tw}: falta "gloss".`)
        if (!(TOKEN_KINDS as readonly unknown[]).includes(t.kind))
          errors.push(`${tw}: "kind" desconocido (${String(t.kind)}).`)
      })
    }

    if (line.links !== undefined && !Array.isArray(line.links)) {
      errors.push(`${where}: "links" debe ser una lista.`)
    } else {
      ;((line.links as unknown[]) ?? []).forEach((l: unknown, j: number) => {
        const lw = `${where}, flecha ${j + 1}`
        if (!isObj(l)) return void errors.push(`${lw}: no es un objeto.`)
        for (const end of ['from', 'to'] as const) {
          if (!isStr(l[end]) || !ids.has(l[end] as string))
            errors.push(`${lw}: "${end}" apunta a una palabra que no existe (${String(l[end])}).`)
        }
        if (!(LINK_TYPES as readonly unknown[]).includes(l.type))
          errors.push(`${lw}: "type" desconocido (${String(l.type)}).`)
      })
    }
  })

  if (errors.length) return { ok: false, errors }
  const song = data as unknown as Song
  for (const line of song.lines) line.links ??= []
  return { ok: true, song }
}
