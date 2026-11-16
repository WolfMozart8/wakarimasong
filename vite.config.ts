import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const SONGS_DIR = path.resolve(import.meta.dirname, 'songs')
const ID_RE = /^[a-z0-9][a-z0-9-]*$/

/** API local mínima: lista, lee y guarda los archivos de `songs/`. */
function songsApi(): Plugin {
  return {
    name: 'songs-api',
    configureServer(server) {
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
            .map((f) => {
              const fileId = f.slice(0, -5)
              try {
                const s = JSON.parse(fs.readFileSync(path.join(SONGS_DIR, f), 'utf8'))
                const lines: { start?: number }[] = Array.isArray(s.lines) ? s.lines : []
                return {
                  id: fileId,
                  title: String(s.title ?? fileId),
                  artist: s.artist ? String(s.artist) : undefined,
                  lineCount: lines.length,
                  syncedCount: lines.filter((l) => typeof l?.start === 'number').length,
                }
              } catch (e) {
                return { id: fileId, title: fileId, error: `JSON inválido: ${(e as Error).message}` }
              }
            })
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
  plugins: [react(), songsApi()],
  server: { watch: { ignored: ['**/songs/**'] } },
  test: { include: ['src/**/*.test.ts'] },
})
