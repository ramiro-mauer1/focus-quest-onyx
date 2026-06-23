'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { GeneratedQuest } from '@/lib/gemini';

type Props = {
  onQuestsGenerated?: (quests: GeneratedQuest[]) => void;
  onError?: (msg: string) => void;
};

export default function BrainDump({ onQuestsGenerated, onError }: Props) {
  const [val, setVal] = useState('');
  const [focus, setFocus] = useState(false);
  const [loading, setLoading] = useState(false);
  const hasText = val.trim().length > 0;
  const canSubmit = hasText && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await fetch('/api/generate-quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: val }),
      });
      const data = (await res.json().catch(() => null)) as
        | { quests?: GeneratedQuest[]; error?: string }
        | null;
      if (!res.ok) {
        throw new Error(data?.error ?? `Error ${res.status} del servidor`);
      }
      if (!data?.quests) {
        throw new Error('Respuesta inválida del servidor');
      }
      onQuestsGenerated?.(data.quests);
      setVal('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      layout
      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
      className="rounded-[14px] px-4 py-[14px] backdrop-blur-[14px]
                 transition-[border-color,box-shadow,background-color] duration-[250ms]"
      style={{
        background: focus
          ? 'linear-gradient(180deg, rgba(30,27,75,0.42), rgba(15,23,42,0.55))'
          : 'rgba(15,23,42,0.5)',
        border: `1px solid ${focus ? 'rgba(168,85,247,0.42)' : 'rgba(148,163,184,0.1)'}`,
        boxShadow: focus
          ? '0 0 32px rgba(168,85,247,0.18), 0 0 4px rgba(168,85,247,0.28), inset 0 1px 0 rgba(255,255,255,0.05)'
          : 'inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <div
        className="flex items-center gap-[6px] font-mono mb-[10px]"
        style={{
          fontSize: '10px',
          letterSpacing: '0.13em',
          color: '#c084fc',
          textShadow: '0 0 8px rgba(168,85,247,0.35)',
        }}
      >
        <span className="opacity-[0.5]">&gt;</span>
        <span>
          {loading ? 'PROCESANDO BRAINDUMP...' : 'BRAINDUMPING...'}
        </span>
        <span
          className={`inline-block w-[6px] h-[11px] border border-[rgba(168,85,247,0.45)]
                      ${focus || loading ? 'bg-[#a855f7] animate-cursor-blink' : 'bg-transparent'}`}
          style={focus || loading ? { boxShadow: '0 0 6px rgba(168,85,247,0.7)' } : undefined}
        />
      </div>

      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        disabled={loading}
        placeholder="¿qué tenés que hacer hoy?"
        rows={3}
        className="text-[#cbd5e1]"
        style={{
          fontSize: '13.5px',
          lineHeight: 1.7,
          caretColor: '#a855f7',
          opacity: loading ? 0.55 : 1,
        }}
      />

      <div className="flex justify-end mt-[10px]">
        <motion.button
          whileHover={canSubmit ? { scale: 1.02 } : {}}
          whileTap={canSubmit ? { scale: 0.95 } : {}}
          className="enter-btn font-mono font-bold rounded-lg px-5 py-2 transition-colors duration-200"
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            fontSize: '11px',
            letterSpacing: '0.12em',
            background: canSubmit
              ? 'linear-gradient(140deg, rgba(91,33,182,0.9) 0%, rgba(126,34,206,0.7) 55%, rgba(168,85,247,0.55) 100%)'
              : 'rgba(15,23,42,0.55)',
            border: `1px solid ${canSubmit ? 'rgba(168,85,247,0.55)' : 'rgba(148,163,184,0.08)'}`,
            color: canSubmit ? '#f5f3ff' : '#334155',
            boxShadow: canSubmit
              ? '0 0 20px rgba(168,85,247,0.32), 0 0 2px rgba(168,85,247,0.4), inset 0 1px 0 rgba(255,255,255,0.08)'
              : 'inset 0 1px 0 rgba(255,255,255,0.02)',
            textShadow: canSubmit ? '0 0 8px rgba(168,85,247,0.45)' : 'none',
            cursor: canSubmit ? 'pointer' : 'default',
          }}
        >
          {loading ? 'GENERANDO...' : 'ENVIAR ↵'}
        </motion.button>
      </div>
    </motion.div>
  );
}
