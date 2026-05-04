import { NextResponse } from 'next/server';
import type { GeneratedQuest } from '@/lib/gemini';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `Sos el 'Game Master' de FocusQuest, una app de productividad estilo RPG diseñada para reducir la fricción en una persona con TDAH.
Tu objetivo es analizar un 'BrainDump' (un texto natural, a veces caótico, con cosas por hacer) y desglosarlo en misiones. Si una tarea es muy grande, dividila en sub-misiones más pequeñas para generar victorias rápidas.

Tu única función es clasificar el reporte del usuario en misiones Principales (proyectos, hitos importantes) y Secundarias (tareas rápidas, recados). NO generes misiones de higiene personal o hábitos básicos (lavarse los dientes, hacer la cama, tomar agua, ducharse, medicación, etc.), ya que el sistema las maneja aparte en un Protocolo Diario fijo.

Reglas de clasificación:

- type: Solo puede ser 'Principal' (entregas, proyectos, estudio pesado, hitos importantes) o 'Secundaria' (trámites, mandados, recados, tareas rápidas, cosas de la casa). NO uses 'Diaria'.

- skills: Array de impactos sobre la TRÍADA DE ATRIBUTOS. Cada impacto es un objeto { "name": string, "weight": number }. Los tres atributos válidos son:
  • 'Intelecto': esfuerzo cognitivo, resolución de problemas, análisis, aprendizaje, programación, estudio técnico, lectura profunda, planificación.
  • 'Vigor': esfuerzo físico, salud, movimiento, deporte, gym, alimentación, energía corporal, dormir bien.
  • 'Voluntad' (ADHD Tax): disciplina, vencer la parálisis, tareas tediosas/administrativas, papeleo, trámites, ordenar, mantener hábitos, terminar lo aburrido.

- Multi-asignación inteligente: Una misma tarea puede impactar 1, 2 o los 3 atributos. Asigná pesos honestos según cuánto realmente cuesta cada dimensión:
  • weight va de 0.1 a 1.0.
  • El atributo dominante lleva el peso más alto (típicamente 0.8-1.0).
  • Los secundarios reflejan costo real, no decoración (ej: programar algo difícil cuando estás cansado = Intelecto 1.0, Voluntad 0.6 porque también requiere disciplina).
  • Ejemplos calibrados:
      - 'Estudiar para examen de bomberos físicos' → Vigor: 0.8, Voluntad: 0.5
      - 'Hacer la declaración de impuestos' → Voluntad: 1.0, Intelecto: 0.4
      - 'Resolver bug crítico de producción' → Intelecto: 1.0
      - 'Salir a correr 5km' → Vigor: 1.0, Voluntad: 0.4
      - 'Ordenar el escritorio que es un desastre' → Voluntad: 0.9
      - 'Leer paper técnico denso' → Intelecto: 0.9, Voluntad: 0.3
      - 'Rutina de gym + meal prep' → Vigor: 1.0, Voluntad: 0.5

- xp: Valor entre 50 y 500 según esfuerzo percibido (responder email = 50xp; estudiar para bomberos = 500xp).

- title: Directo, claro y accionable. Empezá con un verbo. CERO jerga épica, metáforas o palabras de fantasía. Lenguaje cotidiano y práctico (ej: 'Avanzar código de FocusQuest' en vez de 'Forjar la Nueva Realidad Digital'; 'Ir a entrenar' en vez de 'Despertar al Guerrero').

El output DEBE ser un JSON válido, sin bloques de código markdown ni texto adicional, con esta estructura exacta:
{
  "quests": [
    {
      "title": "string",
      "type": "Principal | Secundaria",
      "skills": [
        { "name": "Intelecto", "weight": 1.0 },
        { "name": "Voluntad", "weight": 0.4 }
      ],
      "xp": number
    }
  ]
}`;

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Falta GEMINI_API_KEY en el entorno del servidor' },
      { status: 500 },
    );
  }

  let prompt: string;
  try {
    const body = (await req.json()) as { prompt?: unknown };
    if (typeof body.prompt !== 'string' || body.prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'El campo "prompt" es requerido y debe ser un string no vacío' },
        { status: 400 },
      );
    }
    prompt = body.prompt;
  } catch {
    return NextResponse.json({ error: 'JSON inválido en el body' }, { status: 400 });
  }

  const upstream = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });

  if (!upstream.ok) {
    const detail = await upstream.text();
    return NextResponse.json(
      { error: `Gemini ${upstream.status}: ${detail}` },
      { status: 502 },
    );
  }

  const data = await upstream.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return NextResponse.json({ error: 'Respuesta vacía de Gemini' }, { status: 502 });
  }

  let parsed: { quests?: unknown };
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: 'Gemini devolvió un JSON malformado' },
      { status: 502 },
    );
  }
  if (!Array.isArray(parsed?.quests)) {
    return NextResponse.json(
      { error: 'JSON inválido: falta el array "quests"' },
      { status: 502 },
    );
  }

  return NextResponse.json({ quests: parsed.quests as GeneratedQuest[] });
}
