import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const SONGS_DIR = path.resolve(import.meta.dirname, 'songs')
const CARDS_FILE = path.resolve(import.meta.dirname, 'data/flashcards.json')
const ID_RE = /^[a-z0-9][a-z0-9-]*$/

/** Resumen de una canción para el listado (compartido por el dev server y el build). */
function summarize(fileId: string) {
  try {
    const s = JSON.parse(fs.readFileSync(path.join(SONGS_DIR, `${fileId}.json`), 'utf8'))
    const lines: { start?: number }[] = Array.isArray(s.lines) ? s.lines : []
    return {
      id: fileId,
      title: String(s.title ?? fileId),
      artist: s.artist ? String(s.artist) : undefined,
      difficulty: s.difficulty,
      lineCount: lines.length,
      syncedCount: lines.filter((l) => typeof l?.start === 'number').length,
    }
  } catch (e) {
    return { id: fileId, title: fileId, error: `JSON inválido: ${(e as Error).message}` }
  }
}

/** En el build publica las canciones como archivos estáticos (sin servidor): songs/index.json y songs/<id>.json. */
function staticSongs(): Plugin {
  return {
    name: 'static-songs',
    apply: 'build',
    generateBundle() {
      const ids = fs.readdirSync(SONGS_DIR).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5))
      this.emitFile({ type: 'asset', fileName: 'songs/index.json', source: JSON.stringify(ids.map(summarize)) })
      for (const id of ids) {
        this.emitFile({ type: 'asset', fileName: `songs/${id}.json`, source: fs.readFileSync(path.join(SONGS_DIR, `${id}.json`), 'utf8') })
      }
    },
  }
}

/** API local mínima: lista, lee y guarda los archivos de `songs/`. */
function songsApi(): Plugin {
  return {
    name: 'songs-api',
    configureServer(server) {
      // Tarjetas de repaso: un solo archivo, data/flashcards.json.
      server.middlewares.use('/api/flashcards', (req, res) => {
        const send = (status: number, body: unknown) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(body))
        }
        if (req.method === 'GET') {
          if (!fs.existsSync(CARDS_FILE)) return send(200, { cards: [] })
          try {
            return send(200, JSON.parse(fs.readFileSync(CARDS_FILE, 'utf8')))
          } catch (e) {
            return send(422, { error: `data/flashcards.json no es JSON válido: ${(e as Error).message}` })
          }
        }
        if (req.method === 'PUT') {
          const chunks: Buffer[] = []
          req.on('data', (c: Buffer) => chunks.push(c))
          req.on('end', () => {
            try {
              const data = JSON.parse(Buffer.concat(chunks).toString('utf8'))
              if (!Array.isArray(data?.cards)) throw new Error('falta la lista "cards"')
              fs.mkdirSync(path.dirname(CARDS_FILE), { recursive: true })
              fs.writeFileSync(CARDS_FILE, JSON.stringify(data, null, 2) + '\n', 'utf8')
              send(200, { ok: true })
            } catch (e) {
              send(400, { error: `No se pudo guardar: ${(e as Error).message}` })
            }
          })
          return
        }
        send(405, { error: 'Método no permitido.' })
      })

      server.middlewares.use('/api/songs', (req, res) => {
        const send = (status: number, body: unknown) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(body))
        }
        const id = decodeURIComponent((req.url ?? '/').split('?')[0].replace(/^\/+/, ''))

        if (id === '' && req.method === 'GET') {
          const list = fs
            .readdirSync(SONGS_DIR)
            .filter((f) => f.endsWith('.json'))
            .map((f) => summarize(f.slice(0, -5)))
          return send(200, list)
        }

        if (!ID_RE.test(id)) return send(400, { error: 'Nombre de canción no válido.' })
        const file = path.join(SONGS_DIR, `${id}.json`)

        if (req.method === 'GET') {
          if (!fs.existsSync(file)) return send(404, { error: `No existe songs/${id}.json` })
          try {
            return send(200, JSON.parse(fs.readFileSync(file, 'utf8')))
          } catch (e) {
            return send(422, { error: `songs/${id}.json no es JSON válido: ${(e as Error).message}` })
          }
        }

        if (req.method === 'PUT') {
          if (!fs.existsSync(file)) return send(404, { error: `No existe songs/${id}.json` })
          const chunks: Buffer[] = []
          req.on('data', (c: Buffer) => chunks.push(c))
          req.on('end', () => {
            try {
              const data = JSON.parse(Buffer.concat(chunks).toString('utf8'))
              fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8')
              send(200, { ok: true })
            } catch (e) {
              send(400, { error: `No se pudo guardar: ${(e as Error).message}` })
            }
          })
          return
        }

        send(405, { error: 'Método no permitido.' })
      })
    },
  }
}

export default defineConfig({
  // En GitHub Pages la app vive en /<repo>/; el workflow define BASE_PATH.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), songsApi(), staticSongs()],
  server: { watch: { ignored: ['**/songs/**', '**/data/**'] } },
  test: { include: ['src/**/*.test.ts'] },
})
