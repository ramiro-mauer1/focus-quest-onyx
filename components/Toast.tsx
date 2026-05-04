'use client';

import { useEffect } from 'react';

type Tone = 'info' | 'levelup';

type Props = {
  message?: string;
  tone?: Tone;
  durationMs?: number;
  onDone: () => void;
};

const STYLE_BY_TONE: Record<Tone, { background: string; border: string; shadow: string; color: string }> = {
  info: {
    background:
      'linear-gradient(140deg, rgba(91,33,182,0.88) 0%, rgba(126,34,206,0.7) 55%, rgba(168,85,247,0.55) 100%)',
    border: 'rgba(168,85,247,0.5)',
    shadow:
      '0 0 28px rgba(168,85,247,0.32), 0 0 4px rgba(168,85,247,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
    color: '#f5f3ff',
  },
  levelup: {
    background:
      'linear-gradient(140deg, rgba(15,118,110,0.88) 0%, rgba(13,148,136,0.7) 55%, rgba(45,212,191,0.55) 100%)',
    border: 'rgba(45,212,191,0.6)',
    shadow:
      '0 0 32px rgba(45,212,191,0.4), 0 0 4px rgba(45,212,191,0.45), inset 0 1px 0 rgba(255,255,255,0.1)',
    color: '#f0fdfa',
  },
};

export default function Toast({
  message = '✓ Reporte recibido — procesando misiones...',
  tone = 'info',
  durationMs = 2600,
  onDone,
}: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, durationMs);
    return () => clearTimeout(t);
  }, [onDone, durationMs]);

  const s = STYLE_BY_TONE[tone];

  return (
    <div
      className="fixed bottom-[68px] left-1/2 z-[100] -translate-x-1/2
                 rounded-[12px] px-[22px] py-[10px] whitespace-nowrap
                 font-mono animate-toast-in backdrop-blur-[14px]"
      style={{
        fontSize: '11px',
        letterSpacing: '0.06em',
        background: s.background,
        border: `1px solid ${s.border}`,
        boxShadow: s.shadow,
        color: s.color,
      }}
    >
      {message}
    </div>
  );
}
