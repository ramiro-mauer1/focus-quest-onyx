'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { DAILY_QUESTS, type DailyQuestDef } from '@/constants/dailyQuests';
import { useXP, type Skill } from '@/contexts/XPContext';
import { SFX } from '@/lib/sfx';

const STORAGE_KEY = 'onyx_daily_v1';
const ACCENT = '#2dd4bf';

const SKILL_COLOR: Record<Skill, string> = {
  Intelecto: '#22d3ee',
  Vigor: '#10b981',
  Voluntad: '#d946ef',
};

const SKILL_ABBR: Record<Skill, string> = {
  Intelecto: 'INT',
  Vigor: 'VIG',
  Voluntad: 'VOL',
};

type StoredState = { date: string; completed: string[] };

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function loadState(): StoredState {
  const today = todayKey();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: today, completed: [] };
    const parsed = JSON.parse(raw) as StoredState;
    if (parsed.date !== today) return { date: today, completed: [] };
    return parsed;
  } catch {
    return { date: today, completed: [] };
  }
}

function saveState(state: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* noop */
  }
}

export default function DailyProtocol() {
  const { addXP } = useXP();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const s = loadState();
    setCompleted(new Set(s.completed));
    setHydrated(true);

    const now = new Date();
    const next = new Date(now);
    next.setDate(now.getDate() + 1);
    next.setHours(0, 0, 0, 50);
    const ms = next.getTime() - now.getTime();
    const timer = setTimeout(() => {
      setCompleted(new Set());
      saveState({ date: todayKey(), completed: [] });
    }, ms);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState({ date: todayKey(), completed: Array.from(completed) });
  }, [completed, hydrated]);

  const completeDaily = (q: DailyQuestDef, e: MouseEvent) => {
    if (completed.has(q.id)) return;

    setCompleted((prev) => {
      const next = new Set(prev);
      next.add(q.id);
      return next;
    });

    const primarySkill = q.skills[0]?.name || 'Vigor';
    const color = SKILL_COLOR[primarySkill] || ACCENT;

    window.dispatchEvent(
      new CustomEvent('spawn-particles', {
        detail: { startX: e.clientX, startY: e.clientY, color },
      })
    );

    setTimeout(() => {
      SFX.dailyDone();
      addXP(
        q.xp,
        q.skills.map((s) => ({ skill: s.name, weight: s.weight })),
      );
    }, 1050);
  };

  const visible = DAILY_QUESTS.filter((q) => {
    if (completed.has(q.id)) return false;
    if (q.unlockAfter && !completed.has(q.unlockAfter)) return false;
    return true;
  });

  const hasPending = hydrated && visible.length > 0;
  const pendingCount = visible.length;

  return (
    <div className="mb-5">
      <motion.div
        role="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="font-mono mb-3 pl-[1px] flex items-center gap-2 cursor-pointer select-none"
        style={{ fontSize: '10px', letterSpacing: '0.15em', color: ACCENT }}
      >
        <span>◇ OBJETIVOS DIARIOS</span>
        <span className="text-[#475569]">·</span>
        <span className="text-[#475569]">FIJOS</span>
        {hydrated && (
          <span className="text-[#475569] ml-1">
            {DAILY_QUESTS.length - pendingCount}/{DAILY_QUESTS.length}
          </span>
        )}
        <motion.div
          className={`chev-wrap ml-auto ${hasPending ? 'pending' : ''}`}
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <ChevronDown size={13} color={ACCENT} strokeWidth={1.7} />
        </motion.div>
      </motion.div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="daily-body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="rounded-[13px] backdrop-blur-[10px] p-[10px]"
              style={{
                background:
                  'radial-gradient(ellipse 100% 60% at 50% 0%, rgba(45,212,191,0.06) 0%, transparent 70%), rgba(15,23,42,0.5)',
                border: `1px solid ${ACCENT}30`,
                boxShadow: `0 0 24px ${ACCENT}14, inset 0 1px 0 rgba(255,255,255,0.04)`,
              }}
            >
        {!hydrated && (
          <div
            className="text-center py-3 font-mono"
            style={{ fontSize: '10px', color: '#475569', letterSpacing: '0.1em' }}
          >
            ◇ CARGANDO OBJETIVOS...
          </div>
        )}

        {hydrated && visible.length === 0 && (
          <div
            className="text-center py-3 font-mono"
            style={{ fontSize: '10px', color: ACCENT, letterSpacing: '0.1em' }}
          >
            ✓ OBJETIVOS DEL DÍA COMPLETOS
          </div>
        )}

        {hydrated && (
          <AnimatePresence initial={false}>
            {visible.map((q) => (
              <motion.div
                key={q.id}
                layout="position"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                whileHover={{ scale: 1.015, backgroundColor: 'rgba(30,41,59,0.7)' }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => completeDaily(q, e)}
                className="flex items-center gap-[11px] rounded-[9px] px-[11px] py-[9px] mb-[5px] cursor-pointer transition-colors duration-200"
                style={{
                  background: 'rgba(15,23,42,0.5)',
                  border: `1px solid ${ACCENT}28`,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.025)',
                }}
              >
                <div
                  className="shrink-0 w-[17px] h-[17px] rounded-[5px] flex items-center justify-center transition-all duration-[250ms]"
                  style={{
                    border: `1.5px solid ${ACCENT}80`,
                    background: 'rgba(15,23,42,0.4)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}
                />

                <div className="flex-1 min-w-0">
                  <span
                    className="text-[13px] leading-[1.4]"
                    style={{ color: 'var(--text-1)' }}
                  >
                    {q.title}
                  </span>
                  <div className="flex items-center gap-[4px] mt-[3px] flex-wrap">
                    {q.skills.map((s, i) => {
                      const sc = SKILL_COLOR[s.name];
                      return (
                        <span
                          key={`${s.name}-${i}`}
                          className="font-mono font-bold rounded-[3px] px-[5px] py-[1px]"
                          style={{
                            fontSize: '7px',
                            letterSpacing: '0.1em',
                            color: sc,
                            background: `${sc}1c`,
                            border: `1px solid ${sc}40`,
                            opacity: 0.6 + s.weight * 0.4,
                          }}
                        >
                          {SKILL_ABBR[s.name] ?? s.name.toUpperCase()}
                          {s.weight < 1 ? (
                            <span style={{ opacity: 0.65, marginLeft: 3 }}>
                              ×{s.weight.toFixed(1)}
                            </span>
                          ) : null}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <span
                  className="font-mono text-[10px] shrink-0"
                  style={{
                    color: ACCENT,
                    textShadow: `0 0 6px ${ACCENT}50`,
                  }}
                >
                  +{q.xp} XP
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
