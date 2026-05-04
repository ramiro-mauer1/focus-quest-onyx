# Onyx — Notas para asistentes de IA

Este archivo es leído automáticamente por Claude Code (y debería ser revisado por cualquier asistente de IA antes de trabajar en este repo). Contiene reglas de seguridad y deuda técnica conocida que **NO** deben ignorarse.

## ⚠️ Seguridad — pendientes críticos antes de deploy

### 1. API key de Gemini está expuesta al cliente

Actualmente la key vive en `.env.local` como:

```
NEXT_PUBLIC_GEMINI_API_KEY=...
```

El prefijo `NEXT_PUBLIC_` hace que Next.js inyecte la variable en el bundle del navegador. Cualquier visitante puede abrir DevTools y leerla. **Esto es aceptable solo durante prototipado local.**

**Antes de cualquier deploy / push a un repo público, hay que:**

1. Renombrar la variable a `GEMINI_API_KEY` (sin `NEXT_PUBLIC_`).
2. Mover todas las llamadas a Gemini a un Route Handler del lado del servidor (ej: `app/api/gemini/route.ts`).
3. El cliente debe pegarle a ese endpoint interno, nunca directo a la API de Google.
4. Rotar la key actual (`AIzaSyBxiish...`) ya que estuvo embebida en el bundle público durante desarrollo.

### 2. Archivos sensibles que NUNCA deben commitearse

`.gitignore` ya cubre `.env`, `.env.local`, `.env.*.local`. **No removerlos.** Si se agregan otros archivos con secretos (credenciales JSON, tokens), añadirlos al `.gitignore` antes de crearlos.

### 3. Reglas para asistentes de IA editando este proyecto

- **Nunca** mostrar el contenido de `.env.local` en respuestas, PRs, o resúmenes.
- **Nunca** copiar el valor de una API key a código fuente, comentarios, o logs.
- Si se detecta una key hardcodeada, alertar al usuario y proponer moverla a env vars.
- Si se va a inicializar git (`git init`) en este proyecto, verificar primero que `.gitignore` esté presente y cubra los `.env*`.
- Si se va a hacer público el repo, exigir la migración server-side de la key antes de continuar.
