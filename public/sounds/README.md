# public/sounds

Colocar aquí los archivos de audio.

Archivos esperados por el código:

- `task-done.mp3` — sonido corto al completar una misión (gatilla con el confeti en `QuestLog.tsx`).
- `level-up.mp3` — sonido tipo power-up / campanada al subir de nivel (gatilla desde el efecto que consume `pendingLevelUps` en `app/page.tsx`).

Notas:

- El reproductor (`lib/sfx.ts`) tolera la ausencia del archivo: si el `.play()` falla (404, autoplay bloqueado, etc.) la promesa se atrapa silenciosamente y la app sigue funcionando.
- Una vez subidos los MP3 reales, no hace falta tocar el código — el helper los toma de `/sounds/<archivo>.mp3`.
- Este README es temporal; podés borrarlo cuando los assets estén en su lugar.
