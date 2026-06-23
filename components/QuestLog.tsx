'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from 'framer-motion';
import type { GeneratedQuest, QuestSkill, QuestType } from '@/lib/gemini';
import { useXP } from '@/contexts/XPContext';
import { SFX } from '@/lib/sfx';
import DailyProtocol from '@/components/DailyProtocol';

const REMOVE_DELAY_MS = 1200;
const COMPLETION_FX_DELAY_MS = 950;

type TypeStyle = {
  accent: string;
  glow: string;
  border: string;
  tag: string;
};

const TYPE_STYLE: Record<QuestType, TypeStyle> = {
  Principal: {
    accent: '#ef4444',
    glow: 'rgba(239,68,68,0.15)',
    border: 'rgba(239,68,68,0.5)',
    tag: 'PRINCIPAL',
  },
  Secundaria: {
    accent: '#22c55e',
    glow: 'rgba(34,197,94,0.13)',
    border: 'rgba(34,197,94,0.45)',
    tag: 'SECUNDARIA',
  },
  Diaria: {
    accent: '#38bdf8',
    glow: 'rgba(56,189,248,0.12)',
    border: 'rgba(56,189,248,0.42)',
    tag: 'DIARIA',
  },
};

const SKILL_COLOR: Record<QuestSkill, string> = {
  Intelecto: '#22d3ee',
  Vigor: '#10b981',
  Voluntad: '#d946ef',
};

const SKILL_ABBR: Record<QuestSkill, string> = {
  Intelecto: 'INT',
  Vigor: 'VIG',
  Voluntad: 'VOL',
};

export type IndexedQuest = GeneratedQuest & {
  id: number;
  subDone: boolean[];
};

type Props = {
  quests: IndexedQuest[];
  onUpdateQuest: (id: number, patch: Partial<IndexedQuest>) => void;
  onRemoveQuest: (id: number) => void;
};

const SWIPE_DELETE_THRESHOLD = 0.4;

type MissionCardProps = {
  quest: IndexedQuest;
  onUpdate: (patch: Partial<IndexedQuest>) => void;
  onDelete: () => void;
};

function MissionCard({ quest, onUpdate, onDelete }: MissionCardProps) {
  const { addXP } = useXP();
  const style = TYPE_STYLE[quest.type] ?? TYPE_STYLE.Principal;
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const bgOpacity = useTransform(x, [0, 24, 120], [0, 0.55, 1]);
  const iconOpacity = useTransform(x, [0, 18, 90], [0, 0.7, 1]);
  const iconScale = useTransform(x, [0, 90], [0.6, 1]);

  const [open, setOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const totalXP = quest.subMissions.reduce((s, m) => s + m.xp, 0);
  const doneCount = quest.subDone.filter(Boolean).length;
  const totalCount = quest.subMissions.length;
  const allDone = totalCount > 0 && doneCount === totalCount;

  useEffect(() => {
    if (!allDone || completing) return;
    setCompleting(true);
    const fx = setTimeout(() => {
      SFX.taskDone();
    }, COMPLETION_FX_DELAY_MS);
    const remove = setTimeout(() => onDelete(), REMOVE_DELAY_MS);
    timersRef.current.push(fx, remove);
  }, [allDone, completing, onDelete]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const width = cardRef.current?.offsetWidth ?? 300;
    if (info.offset.x > width * SWIPE_DELETE_THRESHOLD) {
      onDelete();
    }
  };

  const toggleSub = (subIdx: number, e: MouseEvent) => {
    e.stopPropagation();
    if (quest.subDone[subIdx]) return;
    const sub = quest.subMissions[subIdx];
    if (!sub) return;

    const next = quest.subDone.slice();
    next[subIdx] = true;
    onUpdate({ subDone: next });

    const primarySkill = sub.skills[0]?.name ?? 'Intelecto';
    const color = SKILL_COLOR[primarySkill as QuestSkill] ?? style.accent;
    window.dispatchEvent(
      new CustomEvent('spawn-particles', {
        detail: { startX: e.clientX, startY: e.clientY, color },
      }),
    );

    SFX.taskDone();
    const impacts = sub.skills.map((s) => ({ skill: s.name, weight: s.weight }));
    addXP(sub.xp, impacts);
  };

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: completing ? 0.55 : 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className="relative mb-2"
    >
      {/* Swipe-to-delete background */}
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-[13px] flex items-center px-[14px] pointer-events-none overflow-hidden"
        style={{
          opacity: bgOpacity,
          background:
            'linear-gradient(90deg, rgba(127,29,29,0.18) 0%, rgba(239,68,68,0.32) 100%)',
          border: '1px solid rgba(239,68,68,0.28)',
          boxShadow: 'inset 0 0 16px rgba(239,68,68,0.12)',
        }}
      >
        <motion.div
          className="flex items-center gap-[7px]"
          style={{ opacity: iconOpacity, scale: iconScale }}
        >
          <Trash2 size={15} color="#fca5a5" strokeWidth={1.7} />
          <span
            className="font-mono font-bold"
            style={{
              fontSize: '8.5px',
              letterSpacing: '0.13em',
              color: '#fca5a5',
              textShadow: '0 0 6px rgba(239,68,68,0.4)',
            }}
          >
            DESCARTAR
          </span>
        </motion.div>
      </motion.div>

      <motion.div
        ref={cardRef}
        drag={completing ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0, right: 0.7 }}
        dragDirectionLock
        onDragEnd={handleDragEnd}
        className="relative rounded-[13px] overflow-hidden backdrop-blur-[10px]"
        style={{
          x,
          background: allDone ? 'rgba(15,23,42,0.34)' : 'rgba(15,23,42,0.55)',
          border: `1px solid ${allDone ? 'rgba(148,163,184,0.1)' : style.border}`,
          boxShadow: allDone
            ? 'inset 0 1px 0 rgba(255,255,255,0.03)'
            : `0 0 24px ${style.glow}, 0 0 4px ${style.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
          touchAction: 'pan-y',
        }}
      >
        <div
          onClick={() => !completing && setOpen((o) => !o)}
          className="flex items-center gap-[11px] px-[14px] py-3 cursor-pointer select-none"
        >
          <div className="flex-1 min-w-0">
            <div
              className="text-[14px] font-semibold leading-[1.3] truncate"
              style={{
                color: allDone ? '#475569' : 'var(--text-1)',
                letterSpacing: '0.01em',
                textDecoration: allDone ? 'line-through' : 'none',
              }}
            >
              {quest.title}
            </div>
            <div className="flex items-center gap-2 mt-[3px]">
              <span
                className="font-mono font-bold rounded-[4px] px-[6px] py-[1px]"
                style={{
                  fontSize: '7.5px',
                  letterSpacing: '0.1em',
                  color: style.accent,
                  background: `${style.accent}1f`,
                  border: `1px solid ${style.accent}33`,
                  boxShadow: `0 0 6px ${style.accent}1a`,
                }}
              >
                {style.tag}
              </span>
              <span className="text-[10px] text-[var(--text-3)]">
                {doneCount}/{totalCount} · {totalXP} XP
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-[5px] shrink-0">
            <div
              className="w-8 h-[3px] rounded-full bg-[rgba(15,23,42,0.6)]"
              style={{ boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.4)' }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-[400ms]"
                style={{
                  width: `${(doneCount / Math.max(totalCount, 1)) * 100}%`,
                  background: `linear-gradient(90deg, ${style.accent}aa, ${style.accent})`,
                  boxShadow: `0 0 6px ${style.accent}cc, 0 0 1px ${style.accent}`,
                }}
              />
            </div>
            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <ChevronDown size={13} color="#475569" strokeWidth={1.6} />
            </motion.div>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="sub-list"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              style={{ overflow: 'hidden' }}
            >
              <div className="px-[13px] pb-[13px]">
                <div
                  className="h-px mb-[10px]"
                  style={{
                    background: `linear-gradient(90deg, ${style.accent}30, transparent)`,
                  }}
                />
                {quest.subMissions.map((sub, idx) => {
                  const isDone = !!quest.subDone[idx];
                  return (
                    <motion.div
                      layout="position"
                      whileHover={!isDone ? { scale: 1.015, backgroundColor: 'rgba(30,41,59,0.7)' } : {}}
                      whileTap={!isDone ? { scale: 0.98 } : {}}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      key={`${sub.title}-${idx}`}
                      onClick={(e: any) => toggleSub(idx, e)}
                      className="flex items-center gap-[11px] rounded-[9px] px-[11px] py-[9px] mb-[5px] last:mb-0 transition-colors duration-200"
                      style={{
                        background: isDone
                          ? 'rgba(15,23,42,0.24)'
                          : 'rgba(15,23,42,0.5)',
                        border: `1px solid ${
                          isDone ? 'rgba(148,163,184,0.06)' : 'rgba(148,163,184,0.1)'
                        }`,
                        boxShadow: isDone
                          ? 'none'
                          : 'inset 0 1px 0 rgba(255,255,255,0.025)',
                        cursor: isDone ? 'default' : 'pointer',
                        pointerEvents: isDone ? 'none' : 'auto',
                      }}
                    >
                      <div
                        className="shrink-0 w-[17px] h-[17px] rounded-[5px] flex items-center justify-center transition-all duration-[250ms]"
                        style={{
                          border: `1.5px solid ${
                            isDone ? style.accent : 'rgba(148,163,184,0.28)'
                          }`,
                          background: isDone
                            ? `linear-gradient(140deg, ${style.accent}33, ${style.accent}14)`
                            : 'rgba(15,23,42,0.4)',
                          boxShadow: isDone
                            ? `0 0 8px ${style.accent}55, inset 0 1px 0 rgba(255,255,255,0.1)`
                            : 'inset 0 1px 0 rgba(255,255,255,0.03)',
                        }}
                      >
                        {isDone && (
                          <motion.svg width="9" height="7" viewBox="0 0 10 8" fill="none">
                            <motion.path
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                              d="M1 4L3.5 6.5L9 1"
                              stroke={style.accent}
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </motion.svg>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <span
                          className="text-[13px] leading-[1.4] transition-colors duration-300"
                          style={{
                            color: isDone ? '#334155' : 'var(--text-1)',
                            textDecoration: isDone ? 'line-through' : 'none',
                          }}
                        >
                          {sub.title}
                        </span>
                        <div className="flex items-center gap-[4px] mt-[3px] flex-wrap">
                          {sub.skills.map((s, i) => {
                            const skillColor = SKILL_COLOR[s.name];
                            const intensity = isDone ? 0.4 : 0.6 + s.weight * 0.4;
                            return (
                              <span
                                key={`${s.name}-${i}`}
                                className="font-mono font-bold rounded-[3px] px-[5px] py-[1px]"
                                style={{
                                  fontSize: '7px',
                                  letterSpacing: '0.1em',
                                  color: isDone ? '#334155' : skillColor,
                                  background: isDone
                                    ? 'transparent'
                                    : `${skillColor}1c`,
                                  border: `1px solid ${
                                    isDone
                                      ? 'rgba(148,163,184,0.08)'
                                      : `${skillColor}40`
                                  }`,
                                  opacity: intensity,
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
                          color: isDone ? '#1e293b' : style.accent,
                          textShadow: isDone ? 'none' : `0 0 6px ${style.accent}50`,
                        }}
                      >
                        +{sub.xp} XP
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export default function QuestLog({ quests, onUpdateQuest, onRemoveQuest }: Props) {
  return (
    <div>
      <DailyProtocol />

      <div
        className="font-mono text-[#475569] mb-3 pl-[1px]"
        style={{ fontSize: '10px', letterSpacing: '0.15em' }}
      >
        ◈ DIARIO DE MISIONES
      </div>

      {quests.length === 0 && (
        <div
          className="rounded-[13px] px-4 py-8 text-center backdrop-blur-[10px] relative overflow-hidden"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(91,33,182,0.18) 0%, transparent 70%), rgba(15,23,42,0.42)',
            border: '1px solid rgba(168,85,247,0.16)',
            boxShadow:
              '0 0 24px rgba(168,85,247,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <div
            className="font-mono"
            style={{
              fontSize: '11px',
              letterSpacing: '0.14em',
              color: '#a78bfa',
              textShadow: '0 0 10px rgba(168,85,247,0.35)',
            }}
          >
            ◇ NO HAY MISIONES ACTIVAS
          </div>
          <div className="text-[12px] text-[var(--text-3)] mt-2 leading-[1.5]">
            Volcá lo que tenés que hacer en el día.<br />
            El Oráculo lo transformará en misiones.
          </div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {quests.map((q) => (
          <MissionCard
            key={q.id}
            quest={q}
            onUpdate={(patch) => onUpdateQuest(q.id, patch)}
            onDelete={() => onRemoveQuest(q.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
