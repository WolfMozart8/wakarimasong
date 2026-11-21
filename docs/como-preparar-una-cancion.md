# Cómo preparar una canción

## Pasos

1. **Consigue la letra en japonés** (con kanji) y el enlace del video de YouTube. Si la letra trae lecturas entre paréntesis o furigana especiales (escrito 運命, cantado さだめ), consérvalas: son justo lo que hay que explicar.
2. **Pide el archivo a Claude** en una sesión de este proyecto: pega la letra y el enlace y di «prepara esta canción». Claude crea `songs/<nombre>.json` siguiendo los criterios de abajo.
3. **Arranca la app:** `npm run dev` y abre la dirección que aparece.
4. **Sincroniza:** en la biblioteca pulsa «Sincronizar», reproduce y pulsa Espacio al empezar cada línea. Ajusta con −0.1 / +0.1 y guarda.
5. **Revisa** las explicaciones mientras escuchas. Lo que no te convenza se corrige a mano en el archivo o pidiéndoselo a Claude. Si el archivo queda mal formado, la app dice qué línea y qué palabra fallan.

El nombre del archivo solo puede llevar minúsculas, números y guiones (`butterfly.json`). El `youtubeId` es lo que va después de `v=` en el enlace del video.

## Tarjetas de repaso

En una canción, toca una palabra y pulsa «＋ Tarjeta». El enlace «Repaso» del menú muestra las que tocan hoy: ves la palabra en su línea, intentas recordarla, y marcas si la sabías (tecla 2) o no (tecla 1). Las que aciertas vuelven a salir tras 1, 3, 7, 14 y 30 días; las que fallas se repiten ese mismo día y empiezan de nuevo. Las tarjetas se guardan en `data/flashcards.json`, que no entra en git.

## Criterios de anotación

La forma exacta de los datos está en `src/types.ts`; `songs/demo.json` es un ejemplo completo.

**Líneas.** Una línea del archivo = una frase cantada que quepa en pantalla (hasta unas 8 palabras). Las líneas largas se parten donde respira el cantante.
- Si la gramática cruza el salto de línea de la letra (何が… / …届くのだろう; 便利だって / 叫んでる), se juntan en una sola línea, aunque llegue a 9 palabras: las flechas solo unen palabras de la misma línea. Si aun así no cabe, se explica la relación en `role` y en `notes`.
- Las partes repetidas (estribillos) llevan la misma anotación cada vez, con su propio `id` de línea.
- Las marcas que añaden los sitios de letras (por ejemplo «[…ご利用ありがとうございます]») se quitan.
- No se inventan tiempos: `start` se deja vacío y se marca con la herramienta de sincronizar.

**Palabras (`tokens`).**
- Un verbo o adjetivo conjugado es **una sola palabra** con sus terminaciones (行って, 食べられる, 忘れない), no trozos sueltos. La conjugación se explica en `base` y `form`.
- Las partículas van separadas y siempre con `role`: qué hacen **en esta línea**, no la lista de usos del diccionario.
- `gloss` es corto (1–3 palabras) y es el sentido en esta línea.
- `emoji` solo cuando representa bien la palabra; mejor ninguno que uno confuso.

**Formas (`base` + `form`).** Obligatorio para todo lo que no esté en forma de diccionario.
- `form.name`: nombre corto y constante en toda la app («forma て», «pasado (た)», «potencial (られる)», «pasiva (られる)», «negativo (ない)», «deseo (たい)», «volitiva (よう)»…).
- `form.why`: por qué se usa aquí y con qué palabra de la letra se relaciona. Si la forma es ambigua (られる potencial o pasiva; て que encadena o que da causa), decir cuál es y qué pista lo decide.

**Terminaciones que confunden (た / て / ず…).** Una palabra que acaba en た o て no siempre es pasado ni siempre encadena. En `form.why` se dice cuál es y qué pista la distingue:
- た al final de frase = pasado (泣いた). た delante de un sustantivo = describe (置いた レコード, 乾いた 胸, 慣れた 君): no cierra la frase.
- てた = ていた abreviado (言ってた): acaba en た pero es て + いた.
- て / で al final de un trozo = encadena («…y luego…»); ないで = «no hagas…».
- たら = condición, たって = «aunque»: la た no es pasado.
- Raíz (連用形) sin て: 叩き, 重ね, 解き; ず = negativo de enlace. Una ね o せ final puede ser parte del verbo, no una partícula.

**Independencia.** Cada canción se explica por sí sola: no se remite a otras canciones («en la canción X se usa así»).

**Flechas (`links`).** Se leen como una frase: *origen —etiqueta→ destino*.
- `possession`: dueño → cosa (私 —dueño de→ 犬).
- `destination`: verbo → lugar o resultado (行って —hacia→ 学校).
- `object`: verbo → lo que recibe la acción (食べる —qué→ りんご).
- `subject` / `topic`: quien hace → verbo (犬 —quién va→ 行って).
- `modifies`: lo que describe → lo descrito (adjetivo o frase relativa → sustantivo).
- `connects`: verbo encadenado → verbo que sigue.
- Máximo 3–4 flechas por línea: solo las relaciones que ayudan a entender la frase.

**Casos especiales.**
- `sungAs`: cuando se canta algo distinto de la lectura normal de lo escrito. `reading` lleva la lectura de diccionario y `sungAs.reading` lo que suena.
- `note`: dobles sentidos, homófonos (会った / あった), kanji o lecturas inusuales, pares que se confunden (変える / 変わる), licencias poéticas.
- Si una frase sigue en la línea siguiente, decirlo en `notes` de la línea.

**Traducción.** `translation` es natural; `literal` sigue el orden japonés palabra por palabra para que se vea la estructura.
