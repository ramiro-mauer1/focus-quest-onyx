'use client';

import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { ChevronDown, Cpu, HeartPulse, MapPin, Trash2, type LucideIcon } from 'lucide-react';
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

const REMOVE_DELAY_MS = 800;

type GroupConfig = {
  Icon: LucideIcon;
  accent: string;
  glow: string;
  border: string;
  label: string;
  tag: string;
};

const GROUP_BY_TYPE: Record<QuestType, GroupConfig> = {
  Principal: {
    Icon: Cpu,
    accent: '#ef4444',
    glow: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.22)',
    label: 'Trabajo del Oráculo',
    tag: 'PRINCIPAL',
  },
  Secundaria: {
    Icon: MapPin,
    accent: '#22c55e',
    glow: 'rgba(34,197,94,0.10)',
    border: 'rgba(34,197,94,0.2)',
    label: 'Operación Logística',
    tag: 'SECUNDARIA',
  },
  Diaria: {
    Icon: HeartPulse,
    accent: '#38bdf8',
    glow: 'rgba(56,189,248,0.09)',
    border: 'rgba(56,189,248,0.18)',
    label: 'Protocolo Diario',
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

const ORDER: QuestType[] = ['Principal', 'Secundaria', 'Diaria'];

type Indexed = GeneratedQuest & { id: number };
type Props = { quests: Indexed[]; onRemoveQuest: (id: number) => void };

const SWIPE_DELETE_THRESHOLD = 0.4;

type QuestItemProps = {
  quest: Indexed;
  cfg: GroupConfig;
  isDone: boolean;
  onComplete: (quest: Indexed, e: MouseEvent) => void;
  onDelete: (id: number) => void;
};

function QuestItem({ quest, cfg, isDone, onComplete, onDelete }: QuestItemProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const bgOpacity = useTransform(x, [0, 24, 120], [0, 0.55, 1]);
  const iconOpacity = useTransform(x, [0, 18, 90], [0, 0.7, 1]);
  const iconScale = useTransform(x, [0, 90], [0.6, 1]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const width = cardRef.current?.offsetWidth ?? 300;
    if (info.offset.x > width * SWIPE_DELETE_THRESHOLD) {
      onDelete(quest.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative mb-[5px]"
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-[9px] flex items-center px-[14px] pointer-events-none overflow-hidden"
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
        drag={isDone ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0, right: 0.7 }}
        dragDirectionLock
        onDragEnd={handleDragEnd}
        onClick={(e) => onComplete(quest, e)}
        aria-disabled={isDone}
        className="relative flex items-center gap-[11px] rounded-[9px] px-[11px] py-[9px] transition-colors duration-200"
        style={{
          x,
          background: isDone ? 'rgba(15,23,42,0.24)' : 'rgba(15,23,42,0.5)',
          border: `1px solid ${
            isDone ? 'rgba(148,163,184,0.06)' : 'rgba(148,163,184,0.1)'
          }`,
          boxShadow: isDone ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.025)',
          cursor: isDone ? 'default' : 'pointer',
          pointerEvents: isDone ? 'none' : 'auto',
          touchAction: 'pan-y',
        }}
      >
        <div
          className="shrink-0 w-[17px] h-[17px] rounded-[5px] flex items-center justify-center transition-all duration-[250ms]"
          style={{
            border: `1.5px solid ${isDone ? cfg.accent : 'rgba(148,163,184,0.28)'}`,
            background: isDone
              ? `linear-gradient(140deg, ${cfg.accent}33, ${cfg.accent}14)`
              : 'rgba(15,23,42,0.4)',
            boxShadow: isDone
              ? `0 0 8px ${cfg.accent}55, inset 0 1px 0 rgba(255,255,255,0.1)`
              : 'inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        >
          {isDone && (
            <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
              <path
                d="M1 4L3.5 6.5L9 1"
                stroke={cfg.accent}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        <div className="flex-1 relative min-w-0">
          <span
            className="text-[13px] leading-[1.4] transition-colors duration-300"
            style={{ color: isDone ? '#334155' : 'var(--text-1)' }}
          >
            {quest.title}
          </span>
          <div className="flex items-center gap-[4px] mt-[3px] flex-wrap">
            {(quest.skills ?? []).map((s, i) => {
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
                    background: isDone ? 'transparent' : `${skillColor}1c`,
                    border: `1px solid ${
                      isDone ? 'rgba(148,163,184,0.08)' : `${skillColor}40`
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
          <div className={`strike${isDone ? ' done' : ''}`} />
        </div>

        <span
          className="font-mono text-[10px] shrink-0"
          style={{
            color: isDone ? '#1e293b' : cfg.accent,
            textShadow: isDone ? 'none' : `0 0 6px ${cfg.accent}50`,
          }}
        >
          +{quest.xp} XP
        </span>
      </motion.div>
    </motion.div>
  );
}

export default function QuestLog({ quests, onRemoveQuest }: Props) {
  const { addXP } = useXP();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState<Record<number, boolean>>({});
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const grouped = useMemo(() => {
    const g: Record<QuestType, Indexed[]> = { Principal: [], Secundaria: [], Diaria: [] };
    quests.forEach((q) => {
      if (g[q.type]) g[q.type].push(q);
    });
    return g;
  }, [quests]);

  const toggleGroup = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  const completeTask = (quest: Indexed, e: MouseEvent) => {
    if (done[quest.id]) return;

    setDone((d) => ({ ...d, [quest.id]: true }));

    const primarySkill = (quest.skills ?? [])[0]?.name || 'Intelecto';
    const color = SKILL_COLOR[primarySkill as QuestSkill] || '#a855f7';

    window.dispatchEvent(
      new CustomEvent('spawn-particles', {
        detail: { startX: e.clientX, startY: e.clientY, color },
      })
    );

    const xpDelay = setTimeout(() => {
      SFX.taskDone();
      const impacts = (quest.skills ?? []).map((s) => ({ skill: s.name, weight: s.weight }));
      addXP(quest.xp, impacts);
    }, 1050);
    timersRef.current.push(xpDelay);

    const t = setTimeout(() => onRemoveQuest(quest.id), REMOVE_DELAY_MS + 1050);
    timersRef.current.push(t);
  };

  const visibleGroups = ORDER.filter((t) => grouped[t].length > 0);

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
            Volcá tu primer reporte arriba.<br />
            El Oráculo va a desglosarlo en misiones.
          </div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {visibleGroups.map((type) => {
          const cfg = GROUP_BY_TYPE[type];
          const items = grouped[type];
          const isOpen = open[type] !== false;
          const completed = items.filter((t) => done[t.id]).length;
          const totalXP = items.reduce((s, t) => s + t.xp, 0);
          const allDone = completed === items.length;
          const { Icon } = cfg;

          return (
            <motion.div
              key={type}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0, scale: 0.97 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="rounded-[13px] mb-2 overflow-hidden backdrop-blur-[10px]"
              style={{
                background: allDone ? 'rgba(15,23,42,0.32)' : 'rgba(15,23,42,0.55)',
                border: `1px solid ${
                  isOpen ? cfg.border : allDone ? 'rgba(148,163,184,0.06)' : 'rgba(148,163,184,0.1)'
                }`,
                boxShadow: isOpen
                  ? `0 0 24px ${cfg.glow}, 0 0 4px ${cfg.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`
                  : 'inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              <div
                onClick={() => toggleGroup(type)}
                className="flex items-center gap-[11px] px-[14px] py-3 cursor-pointer select-none"
              >
                <div
                  className="shrink-0 w-9 h-9 rounded-[9px] flex items-center justify-center transition-all duration-200"
                  style={{
                    background: `linear-gradient(140deg, ${cfg.accent}1f, ${cfg.accent}08)`,
                    border: `1.5px solid ${cfg.accent}${isOpen ? '5c' : '2e'}`,
                    boxShadow: isOpen
                      ? `0 0 14px ${cfg.accent}40, inset 0 1px 0 rgba(255,255,255,0.06)`
                      : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}
                >
                  <Icon size={16} color={allDone ? '#334155' : cfg.accent} strokeWidth={1.6} />
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    className="text-[14px] font-semibold leading-[1.3]"
                    style={{ color: allDone ? '#334155' : 'var(--text-1)', letterSpacing: '0.01em' }}
                  >
                    {cfg.label}
                  </div>
                  <div className="flex items-center gap-2 mt-[3px]">
                    <span
                      className="font-mono font-bold rounded-[4px] px-[6px] py-[1px]"
                      style={{
                        fontSize: '7.5px',
                        letterSpacing: '0.1em',
                        color: cfg.accent,
                        background: `${cfg.accent}1f`,
                        border: `1px solid ${cfg.accent}33`,
                        boxShadow: `0 0 6px ${cfg.accent}1a`,
                      }}
                    >
                      {cfg.tag}
                    </span>
                    <span className="text-[10px] text-[var(--text-3)]">
                      {completed}/{items.length} · {totalXP} XP
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
                        width: `${(completed / items.length) * 100}%`,
                        background: `linear-gradient(90deg, ${cfg.accent}aa, ${cfg.accent})`,
                        boxShadow: `0 0 6px ${cfg.accent}cc, 0 0 1px ${cfg.accent}`,
                      }}
                    />
                  </div>
                  <div
                    className="flex transition-transform duration-[220ms]"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    <ChevronDown size={13} color="#475569" strokeWidth={1.6} />
                  </div>
                </div>
              </div>

              {isOpen && (
                <div className="px-[13px] pb-[13px]">
                  <div
                    className="h-px mb-[10px]"
                    style={{ background: `linear-gradient(90deg, ${cfg.accent}30, transparent)` }}
                  />
                  <AnimatePresence initial={false}>
                    {items.map((q) => (
                      <QuestItem
                        key={q.id}
                        quest={q}
                        cfg={cfg}
                        isDone={!!done[q.id]}
                        onComplete={completeTask}
                        onDelete={onRemoveQuest}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
