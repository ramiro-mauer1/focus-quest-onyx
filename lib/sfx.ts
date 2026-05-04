'use client';

const templates = new Map<string, HTMLAudioElement>();

function getTemplate(file: string): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  let tpl = templates.get(file);
  if (!tpl) {
    try {
      tpl = new Audio(`/sounds/${file}`);
      tpl.preload = 'auto';
      templates.set(file, tpl);
    } catch {
      return null;
    }
  }
  return tpl;
}

function play(file: string, volume: number) {
  const tpl = getTemplate(file);
  if (!tpl) return;
  try {
    const node = tpl.cloneNode(true) as HTMLAudioElement;
    node.volume = Math.max(0, Math.min(1, volume));
    const p = node.play();
    if (p && typeof (p as Promise<void>).catch === 'function') {
      (p as Promise<void>).catch(() => {
        /* archivo ausente, autoplay bloqueado, o el usuario aún no interactuó */
      });
    }
  } catch {
    /* noop */
  }
}

export const SFX = {
  taskDone: () => play('task-done.mp3', 0.55),
  dailyDone: () => play('daily-sound.mp3', 0.55),
  levelUp: () => play('level-up.mp3', 0.7),
};
