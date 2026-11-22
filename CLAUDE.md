# Onyx — Notas para asistentes de IA

Este archivo es leído automáticamente por Claude Code (y debería ser revisado por cualquier asistente de IA antes de trabajar en este repo). Contiene reglas de seguridad y deuda técnica conocida que **NO** deben ignorarse.

## ⚠️ Seguridad

### 1. API key de Gemini: solo del lado del servidor

La key vive en `.env.local` como `GEMINI_API_KEY` (sin prefijo `NEXT_PUBLIC_`) y solo la lee el Route Handler `app/api/generate-quests/route.ts`. El cliente (`components/BrainDump.tsx`) le pega a `/api/generate-quests`, nunca directo a la API de Google.

**Mantenerlo así:**

1. Nunca usar `NEXT_PUBLIC_` para la key: Next.js inyecta esas variables en el bundle del navegador y cualquiera puede leerlas en DevTools.
2. Toda llamada nueva a Gemini va en un Route Handler del servidor.
3. Nunca escribir la key, ni siquiera un fragmento, en código, docs, commits o logs.

### 2. Archivos sensibles que NUNCA deben commitearse

`.gitignore` ya cubre `.env`, `.env.local`, `.env.*.local`. **No removerlos.** Si se agregan otros archivos con secretos (credenciales JSON, tokens), añadirlos al `.gitignore` antes de crearlos.

### 3. Reglas para asistentes de IA editando este proyecto

- **Nunca** mostrar el contenido de `.env.local` en respuestas, PRs, o resúmenes.
- **Nunca** copiar el valor de una API key a código fuente, comentarios, o logs.
- Si se detecta una key hardcodeada, alertar al usuario y proponer moverla a env vars.
- Si se va a inicializar git (`git init`) en este proyecto, verificar primero que `.gitignore` esté presente y cubra los `.env*`.
- Si se va a hacer público el repo, exigir la migración server-side de la key antes de continuar.
