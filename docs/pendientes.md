# Pendientes e ideas

Ideas conversadas que aún no se construyen, de la más cercana a la más lejana.

## 1. Modo escucha («¿qué entiendo?»)

Practicar el oído con las canciones que ya están preparadas, sin IA.

- Suena una línea con el texto oculto.
- Escribes lo que oyes (kana o romaji) o solo marcas «entendí / a medias / nada».
- Se muestra la línea real con sus explicaciones y se compara con lo que escribiste.
- Cada intento se guarda con fecha (`data/`), para ver en una segunda pasada qué entiendes ahora que antes no.
- Las palabras de las líneas falladas se pueden mandar a tarjetas con un clic.

Reutiliza los tiempos, el reproductor y las tarjetas que ya existen.

## 2. Diálogos de anime

La pantalla y el formato de anotación sirven tal cual para diálogo. Lo que falta:

- **Video local:** los episodios no están en YouTube; hace falta un reproductor para un archivo del PC (`Transport` ya está pensado para tener varias fuentes).
- **Importar subtítulos japoneses (.srt / .ass):** traen el texto y los tiempos; sincronizar a mano 300–400 líneas por episodio no es viable.
- **Quién habla:** un campo opcional de personaje por línea.
- **Anotación por volumen:** una escena de 2–3 minutos se prepara en una sesión igual que una canción; un episodio entero necesita el script automático (enfoque B del diseño: analizador + API, con costo por episodio).

Primer paso razonable: una escena corta con video local y subtítulos importados.

## 3. Subtítulos generados desde el audio

Para material sin texto disponible.

- Hace falta un programa de reconocimiento de voz (por ejemplo Whisper, que corre gratis en el PC). Claude no puede oír audio directamente.
- Funciona bien con diálogo hablado claro; mal con canciones (la música confunde) y con voces superpuestas.
- El resultado tiene errores, así que sirve como borrador a corregir, no como «texto original» contra el que compararse.
- Solo con video local: no se puede extraer el audio de YouTube.

Tiene sentido después del punto 2, cuando ya exista el video local.

## 4. Exportar video

Video con la letra anotada. Pendiente de revisar en detalle; el problema principal es el derecho a usar el audio. `LineView` no depende de YouTube para poder reutilizarse aquí.

## Mejoras pequeñas

- Marcar en la línea las palabras que ya están en tarjetas.
- Tarjetas inversas (español → japonés) y repaso por audio.
- `npm test` falla desde Git Bash por la letra de unidad en minúscula; funciona desde PowerShell.
