import { describe, expect, it } from 'vitest'
import { validateSong } from './validateSong'

const good = () => ({
  id: 'x',
  title: 'X',
  lines: [
    {
      id: 'l1',
      start: 1,
      translation: 'mi perro',
      tokens: [
        { id: 'a', surface: '私', gloss: 'yo', kind: 'noun' },
        { id: 'b', surface: '犬', gloss: 'perro', kind: 'noun' },
      ],
      links: [{ from: 'a', to: 'b', type: 'possession', label: 'de' }],
    },
  ],
})

describe('validateSong', () => {
  it('acepta una canción válida', () => {
    const r = validateSong(good())
    expect(r.ok).toBe(true)
  })

  it('rechaza lo que no es un objeto', () => {
    expect(validateSong(null).ok).toBe(false)
    expect(validateSong([]).ok).toBe(false)
  })

  it('exige título y líneas', () => {
    const r = validateSong({ id: 'x' })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.errors.join('\n')).toMatch(/title/)
      expect(r.errors.join('\n')).toMatch(/lines/)
    }
  })

  it('detecta flechas hacia palabras inexistentes, indicando la línea', () => {
    const s = good()
    s.lines[0].links[0].to = 'zzz'
    const r = validateSong(s)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors[0]).toMatch(/l1.*zzz/)
  })

  it('detecta ids de palabra repetidos', () => {
    const s = good()
    s.lines[0].tokens[1].id = 'a'
    const r = validateSong(s)
    expect(r.ok).toBe(false)
  })

  it('detecta tipos de palabra y de flecha desconocidos', () => {
    const s = good()
    s.lines[0].tokens[0].kind = 'cosa'
    s.lines[0].links[0].type = 'raro'
    const r = validateSong(s)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.length).toBe(2)
  })

  it('detecta tiempos que retroceden', () => {
    const s = good()
    s.lines.push({ ...s.lines[0], id: 'l2', start: 0.5 })
    const r = validateSong(s)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors[0]).toMatch(/l2/)
  })

  it('permite líneas sin tiempo', () => {
    const s = good()
    delete (s.lines[0] as { start?: number }).start
    expect(validateSong(s).ok).toBe(true)
  })
})
