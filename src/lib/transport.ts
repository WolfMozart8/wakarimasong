import { useEffect, useRef, useState } from 'react'

/** Lo que la app necesita de un reproductor: YouTube o, sin video, un cronómetro. */
export interface Transport {
  getTime(): number
  seek(t: number): void
  play(): void
  pause(): void
  setRate(r: number): void
  isPlaying(): boolean
  destroy(): void
}

export function createClockTransport(duration: number): Transport {
  let base = 0
  let startedAt: number | null = null
  let rate = 1
  const now = () =>
    Math.min(duration, startedAt === null ? base : base + ((performance.now() - startedAt) / 1000) * rate)
  const freeze = () => {
    base = now()
    if (startedAt !== null) startedAt = performance.now()
  }
  return {
    getTime: now,
    seek(t) {
      base = Math.max(0, Math.min(duration, t))
      if (startedAt !== null) startedAt = performance.now()
    },
    play() {
      if (now() >= duration) base = 0
      startedAt = performance.now()
    },
    pause() {
      base = now()
      startedAt = null
    },
    setRate(r) {
      freeze()
      rate = r
    },
    isPlaying: () => startedAt !== null && now() < duration,
    destroy() {},
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
let apiPromise: Promise<any> | null = null
function loadYouTubeApi(): Promise<any> {
  apiPromise ??= new Promise((resolve, reject) => {
    const w = window as any
    if (w.YT?.Player) return resolve(w.YT)
    const prev = w.onYouTubeIframeAPIReady
    w.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve(w.YT)
    }
    const s = document.createElement('script')
    s.src = 'https://www.youtube.com/iframe_api'
    s.onerror = () => {
      apiPromise = null
      reject(new Error('No se pudo cargar el reproductor de YouTube. ¿Hay conexión a internet?'))
    }
    document.head.appendChild(s)
  })
  return apiPromise
}

export async function createYouTubeTransport(host: HTMLElement, videoId: string): Promise<Transport> {
  const YT = await loadYouTubeApi()
  // YouTube reemplaza el elemento por un iframe; se le da uno propio para no chocar con React.
  const mount = document.createElement('div')
  host.appendChild(mount)
  return new Promise((resolve, reject) => {
    const player = new YT.Player(mount, {
      videoId,
      width: '100%',
      height: '100%',
      playerVars: { playsinline: 1, rel: 0 },
      events: {
        onReady: () =>
          resolve({
            getTime: () => player.getCurrentTime?.() ?? 0,
            seek: (t) => player.seekTo(t, true),
            play: () => player.playVideo(),
            pause: () => player.pauseVideo(),
            setRate: (r) => player.setPlaybackRate(r),
            isPlaying: () => player.getPlayerState?.() === 1,
            destroy: () => {
              player.destroy()
              host.replaceChildren()
            },
          }),
        onError: (e: any) =>
          reject(new Error(`YouTube no pudo reproducir el video (código ${e.data}). Revisa "youtubeId" o si el video permite insertarse.`)),
      },
    })
  })
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Crea el reproductor adecuado y expone tiempo y estado para pintar. */
export function useTransport(youtubeId: string | undefined, clockDuration: number) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [transport, setTransport] = useState<Transport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    let cancelled = false
    let created: Transport | null = null
    setTransport(null)
    setError(null)
    const ready = (t: Transport) => {
      if (cancelled) return t.destroy()
      created = t
      setTransport(t)
    }
    if (youtubeId && hostRef.current) {
      createYouTubeTransport(hostRef.current, youtubeId).then(ready, (e: Error) => {
        if (!cancelled) setError(e.message)
      })
    } else {
      ready(createClockTransport(clockDuration))
    }
    return () => {
      cancelled = true
      created?.destroy()
    }
  }, [youtubeId, clockDuration])

  useEffect(() => {
    if (!transport) return
    const tick = () => {
      setTime(transport.getTime())
      setPlaying(transport.isPlaying())
    }
    tick()
    const h = setInterval(tick, 100)
    return () => clearInterval(h)
  }, [transport])

  return { hostRef, transport, time, playing, error }
}
