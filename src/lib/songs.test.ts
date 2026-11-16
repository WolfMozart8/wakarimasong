import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { validateSong } from './validateSong'

const dir = path.resolve(import.meta.dirname, '../../songs')
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'))

describe('archivos de songs/', () => {
  it.each(files)('%s es una canción válida', (file) => {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
    const r = validateSong(data)
    expect(r.ok ? [] : r.errors).toEqual([])
    expect(data.id).toBe(file.replace(/\.json$/, ''))
  })
})
