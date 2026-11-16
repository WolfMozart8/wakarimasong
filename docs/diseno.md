# App para aprender japonés con canciones — diseño y plan

## Contexto

Quieres aprender japonés (nivel básico-intermedio) con canciones que tú eliges, por ejemplo el opening de Digimon. La traducción sola no basta: hay que **ver** cómo funciona la gramática de cada línea mientras suena la canción.

- Partículas con su función visible (に = destino, の = pertenencia) mediante flechas.
- Verbos conjugados explicados: forma base, en qué forma están, por qué, y con qué otra palabra se conectan.
- Casos raros de las letras: lecturas especiales (escrito 明日, cantado "asa"), kanji inusuales, dobles sentidos.
- Apoyo visual con emojis; imágenes más adelante.

La carpeta `d:\projects\lang_genre` está vacía: proyecto nuevo.

## Decisiones tuyas

- **Uso personal**, pocas canciones elegidas, cada una preparada una vez.
- **Enfoque A:** yo (Claude) preparo el archivo de cada canción en una sesión y tú lo revisas. Sin clave de API ni costos.

Enfoques descartados: **B** (script automático con API: cuesta por canción y la calidad sin revisión es menor; se puede añadir después) y **C** (video primero: sin interacción y con problema legal por el audio).

## Fuera de alcance en esta versión

- Exportar video.
- Imágenes generadas o de Google (el archivo de datos deja un campo opcional para añadirlas luego).
- Análisis automático de canciones, cuentas de usuario, publicación en internet.
- Ejercicios o repaso tipo tarjetas.

Sería un fracaso si: las explicaciones son genéricas de diccionario en vez de explicar *esta* línea, o si las anotaciones tapan la letra y no se puede seguir la canción.

## Decisiones mías (corrígelas si quieres)

- **Tecnología:** app web local con Vite + React + TypeScript; pruebas con Vitest. Se abre en el navegador con `npm run dev`.
- **Video:** reproductor oficial embebido de YouTube (IFrame Player API). No se descarga nada.
- **Idioma de las explicaciones:** español.
- **Letra:** tú pegas la letra de la canción; yo la anoto. No la saco de memoria ni de sitios web.
- **Sincronización:** por línea (no por palabra), marcada a mano con una herramienta dentro de la app.
- **Guardado:** el servidor local de desarrollo escribe los tiempos directamente en el archivo de la canción.

## Qué verás

**Biblioteca:** lista de canciones disponibles.

**Reproductor:**

```
┌──────────────────────────────────────────────┐
│            [ video de YouTube ]              │
├──────────────────────────────────────────────┤
│  わたし         いぬ         がっこう        い  │
│   私     の     犬     は    学校     に    行って │
│  yo    └──▶  perro  tema  escuela └──▶   ir   │
│   🧑   "de"    🐕          🏫   "hacia"   🚶   │
│                                              │
│  "Mi perro va a la escuela y…"               │
├──────────────────────────────────────────────┤
│ 行って → 行く (ir) · forma て                    │
│ Une esta acción con la siguiente.            │
├──────────────────────────────────────────────┤
│ línea anterior / línea siguiente (lista)     │
└──────────────────────────────────────────────┘
```

- La línea activa cambia sola según el tiempo del video.
- Cada palabra muestra: lectura encima (furigana), significado corto y emoji debajo.
- Colores por tipo: partículas, verbos, adjetivos, sustantivos.
- Flechas curvas entre palabras con una etiqueta ("de", "hacia", "objeto de"…).
- Tocar una palabra pausa y abre el detalle: forma base, nombre de la forma, por qué se usa aquí, y notas (doble sentido, lectura especial).
- Lectura especial: se muestra lo escrito y lo cantado, marcado con un aviso (明日 → cantado あさ).
- Controles: repetir línea, velocidad, mostrar/ocultar romaji, tocar una línea de la lista para saltar a ella.

**Modo sincronizar:** suena la canción y pulsas una tecla al comenzar cada línea; se puede retroceder y ajustar; guarda en el archivo.

## Archivo de datos por canción

`songs/<id>.json`:

```ts
Song  { id, title, artist, youtubeId, lines: Line[] }
Line  { id, start?: number, end?: number,   // segundos
        tokens: Token[], links: Link[],
        translation: string,                // natural
        literal?: string, notes?: string[], image?: string }
Token { id, surface, reading?, romaji?, gloss, emoji?,
        kind: 'noun'|'verb'|'adj'|'particle'|'aux'|'adv'|'expr'|'other',
        role?: string,                      // función de la partícula aquí
        base?: { surface, reading, meaning },
        form?: { name, why },               // "forma て", por qué aquí
        sungAs?: { reading, note },         // escrito ≠ cantado
        note?: string }                     // doble sentido, kanji raro…
Link  { from: tokenId, to: tokenId,
        type: 'possession'|'destination'|'object'|'subject'|'topic'|'modifies'|'connects',
        label: string }
```

## Estructura del proyecto

```
songs/                    archivos de canciones + demo.json
src/
  types.ts                tipos de arriba
  lib/validateSong.ts     valida un archivo y da errores legibles
  lib/activeLine.ts       tiempo → línea activa
  lib/arrowLayout.ts      posiciones de palabras → trazos de flechas sin solaparse
  lib/youtube.ts          envoltura del reproductor (tiempo, saltar, velocidad)
  components/Library.tsx
  components/Player.tsx
  components/LineView.tsx   palabras + capa SVG de flechas
  components/TokenDetail.tsx
  components/SyncTool.tsx
vite.config.ts            incluye el guardado local de canciones
docs/como-preparar-una-cancion.md   pasos y criterios de anotación
```

`LineView` no depende de YouTube: recibe una línea y la dibuja. Así se podrá reutilizar para exportar video más adelante.

## Orden de construcción

1. Crear el proyecto (git, Vite, React, TypeScript, Vitest) y guardar este diseño en `docs/`.
2. Tipos y `validateSong`, con pruebas primero.
3. `songs/demo.json`: frases inventadas por mí que cubren todos los casos (の, に, を, forma て, られる, lectura especial, doble sentido). Sirve para desarrollar sin letra con derechos.
4. `LineView` + `arrowLayout` (pruebas para el cálculo de flechas) + `TokenDetail`.
5. Reproductor de YouTube + `activeLine` (con pruebas) + controles.
6. Modo sincronizar y guardado en archivo.
7. Biblioteca.
8. Guía `como-preparar-una-cancion.md`.
9. Primera canción real: tú pegas la letra y el enlace del opening de Digimon; yo genero el archivo, tú sincronizas y revisas.

## Verificación

- `npm test`: validación de canciones, línea activa y cálculo de flechas pasan.
- `npm run dev` y abrir la demo en el navegador:
  - la línea activa sigue al video y al saltar en la barra de tiempo;
  - las flechas apuntan a la palabra correcta y no tapan el texto, también al cambiar el ancho de la ventana;
  - tocar una palabra pausa y muestra forma base, forma y motivo;
  - la lectura especial muestra escrito y cantado;
  - sincronizar tres líneas, recargar la página y comprobar que los tiempos quedaron en el archivo.
- Un archivo de canción con errores muestra un mensaje claro en vez de una pantalla en blanco.
