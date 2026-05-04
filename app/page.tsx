'use client';

import { useEffect, useRef, useState } from 'react';
import Header from '@/components/Header';
import AvatarStage from '@/components/AvatarStage';
import BrainDump from '@/components/BrainDump';
import QuestLog from '@/components/QuestLog';
import Toast from '@/components/Toast';
import type { GeneratedQuest } from '@/lib/gemini';
import { useXP } from '@/contexts/XPContext';
import { SFX } from '@/lib/sfx';
import ParticleOverlay from '@/components/ParticleOverlay';

const ACTIVE_QUESTS_KEY = 'onyx_active_quests';

type IndexedQuest = GeneratedQuest & { id: number };
type ToastEntry = { id: string; message: string; tone: 'info' | 'levelup' };

export default function HomePage() {
  const { pendingLevelUps, consumeLevelUp, comboMultiplier } = useXP();
  const systemState = comboMultiplier > 1 ? 'flow' : 'idle';
  const [error, setError] = useState<string | null>(null);
  const [quests, setQuests] = useState<IndexedQuest[]>([]);
  const [questsLoaded, setQuestsLoaded] = useState(false);
  const [toastQueue, setToastQueue] = useState<ToastEntry[]>([]);

  const nextQuestId = useRef(0);
  const nextToastId = useRef(0);
  const seenLevelUps = useRef<Set<number>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ACTIVE_QUESTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as IndexedQuest[];
        if (Array.isArray(parsed)) {
          const validSkills = new Set(['Intelecto', 'Vigor', 'Voluntad']);
          const cleaned = parsed.filter(
            (q) =>
              Array.isArray(q.skills) &&
              q.skills.every((s) => validSkills.has(s.name)),
          );
          setQuests(cleaned);
          const maxId = cleaned.reduce((m, q) => Math.max(m, q.id), -1);
          nextQuestId.current = maxId + 1;
        }
      }
    } catch {
      /* noop */
    }
    setQuestsLoaded(true);
  }, []);

  useEffect(() => {
    if (!questsLoaded) return;
    try {
      localStorage.setItem(ACTIVE_QUESTS_KEY, JSON.stringify(quests));
    } catch {
      /* noop */
    }
  }, [quests, questsLoaded]);

  const enqueueToast = (entry: Omit<ToastEntry, 'id'>) =>
    setToastQueue((q) => [...q, { ...entry, id: String(nextToastId.current++) }]);

  const dismissTopToast = () => setToastQueue((q) => q.slice(1));

  const handleGenerated = (qs: GeneratedQuest[]) => {
    const indexed = qs.map((q) => ({ ...q, id: nextQuestId.current++ }));
    setQuests((prev) => [...prev, ...indexed]);
    enqueueToast({
      message: '✓ Braindump recibido — procesando misiones...',
      tone: 'info',
    });
  };

  const handleRemoveQuest = (id: number) => {
    setQuests((prev) => prev.filter((q) => q.id !== id));
  };

  useEffect(() => {
    if (pendingLevelUps.length === 0) return;
    for (const event of pendingLevelUps) {
      if (seenLevelUps.current.has(event.id)) continue;
      seenLevelUps.current.add(event.id);
      SFX.levelUp();
      if (event.scope !== 'General') {
        enqueueToast({
          message: `▲ ¡Nivel de ${event.scope} aumentado!`,
          tone: 'levelup',
        });
      }
      consumeLevelUp(event.id);
    }
  }, [pendingLevelUps, consumeLevelUp]);

  const currentToast = toastQueue[0];

  return (
    <>
      <Header />
      <div className="px-4 pt-6">
        <div className="flex justify-center mb-6">
          <AvatarStage systemState={systemState} />
        </div>
        <div className="mb-[22px]">
          <BrainDump
            onQuestsGenerated={handleGenerated}
            onError={(msg) => setError(msg)}
          />
        </div>
        <QuestLog quests={quests} onRemoveQuest={handleRemoveQuest} />
      </div>
      {currentToast && (
        <Toast
          key={currentToast.id}
          message={currentToast.message}
          tone={currentToast.tone}
          onDone={dismissTopToast}
        />
      )}
      {error && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] max-w-[400px] mx-4
                     rounded-[10px] px-4 py-3 backdrop-blur-[14px] cursor-pointer"
          onClick={() => setError(null)}
          style={{
            background:
              'linear-gradient(140deg, rgba(127,29,29,0.78) 0%, rgba(153,27,27,0.6) 55%, rgba(239,68,68,0.42) 100%)',
            border: '1px solid rgba(239,68,68,0.5)',
            boxShadow:
              '0 0 28px rgba(239,68,68,0.28), 0 0 4px rgba(239,68,68,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <div
            className="font-mono font-bold text-[#fecaca] mb-1"
            style={{ fontSize: '9px', letterSpacing: '0.13em' }}
          >
            ⚠ ERROR DEL ORÁCULO
          </div>
          <div className="text-[12px] text-[#fee2e2] leading-[1.4] break-words">
            {error}
          </div>
          <div
            className="font-mono text-[#fca5a5] mt-2 text-right"
            style={{ fontSize: '9px', letterSpacing: '0.1em' }}
          >
            tap para cerrar
          </div>
        </div>
      )}
      <ParticleOverlay />
    </>
  );
}
