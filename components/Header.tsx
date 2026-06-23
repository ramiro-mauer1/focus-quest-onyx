'use client';

import { Brain, BicepsFlexed, Sparkles, type LucideIcon } from 'lucide-react';
import { getXPForNextLevel, useXP, type Skill } from '@/contexts/XPContext';

function formatXP(n: number): string {
  if (n < 1000) return String(n);
  const k = n / 1000;
  if (k >= 10) return `${Math.round(k)}K`;
  return `${(Math.round(k * 10) / 10).toFixed(1)}K`;
}

type Pillar = {
  key: Skill;
  label: string;
  Icon: LucideIcon;
  color: string;
};

const PILLARS: Pillar[] = [
  { key: 'Intelecto', label: 'INTELECTO', Icon: Brain,    color: '#22d3ee' },
  { key: 'Vigor',     label: 'VIGOR',     Icon: BicepsFlexed, color: '#10b981' },
  { key: 'Voluntad',  label: 'VOLUNTAD',  Icon: Sparkles, color: '#d946ef' },
];

export default function Header() {
  const { level, currentXP, xpForNextLevel, skills } = useXP();
  const pct = Math.min(100, (currentXP / xpForNextLevel) * 100);

  return (
    <div
      className="sticky top-0 z-50 px-4 pb-[10px]
                 bg-[rgba(4,6,15,0.82)] backdrop-blur-[22px]
                 border-b border-[rgba(168,85,247,0.08)]"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 10px)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.02) inset, 0 12px 32px -16px rgba(0,0,0,0.6)',
      }}
    >
      <div className="flex justify-center mb-[9px]">
        <div className="grid grid-cols-3 gap-[10px] w-full max-w-[360px]">
          {PILLARS.map(({ key, label, Icon, color }) => {
            const skill = skills[key];
            const skillTarget = getXPForNextLevel(skill.level);
            const skillPct = Math.min(100, (skill.currentXP / skillTarget) * 100);
            return (
              <div key={key} className="flex flex-col items-center gap-[4px]">
                <div
                  className="relative w-full h-[44px] rounded-[10px] overflow-hidden
                             flex items-center justify-center
                             bg-[rgba(15,23,42,0.78)]"
                  style={{
                    border: `1px solid ${color}33`,
                    boxShadow: `0 0 14px ${color}1f, inset 0 1px 0 rgba(255,255,255,0.04)`,
                  }}
                >
                  <div
                    aria-hidden
                    className="absolute left-0 bottom-0 w-full pointer-events-none transition-[height] duration-[400ms]"
                    style={{
                      height: `${skillPct}%`,
                      background: `linear-gradient(to top, ${color}3d, ${color}1a)`,
                      borderTop: skillPct > 0 ? `1px solid ${color}99` : 'none',
                      boxShadow: skillPct > 0 ? `0 -2px 10px ${color}55` : 'none',
                    }}
                  />
                  <Icon
                    size={18}
                    color={color}
                    strokeWidth={1.6}
                    className="relative z-10"
                  />
                </div>
                <div className="flex items-baseline gap-[5px]">
                  <span
                    className="font-mono font-bold leading-[1]"
                    style={{
                      fontSize: '7px',
                      color,
                      letterSpacing: '0.08em',
                      opacity: 0.7,
                    }}
                  >
                    LV
                  </span>
                  <span
                    className="font-mono font-bold leading-[1]"
                    style={{
                      fontSize: '11px',
                      color,
                      letterSpacing: '0.04em',
                      textShadow: `0 0 6px ${color}80`,
                    }}
                  >
                    {skill.level}
                  </span>
                </div>
                <span
                  className="font-mono font-bold text-center leading-[1.1]"
                  style={{
                    fontSize: '7px',
                    color,
                    letterSpacing: '0.13em',
                    textShadow: `0 0 8px ${color}50`,
                    opacity: 0.78,
                  }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-[10px]">
        <div
          className="shrink-0 text-center rounded-lg px-2 py-[3px]
                     border border-[rgba(168,85,247,0.36)]"
          style={{
            background: 'var(--grad-violet-deep)',
            boxShadow: 'var(--glow-violet-xs), var(--inset-top-strong)',
          }}
        >
          <div
            className="font-mono text-[#c084fc]"
            style={{ fontSize: '6px', letterSpacing: '0.1em' }}
          >
            NIV
          </div>
          <div
            className="font-mono font-bold text-[#f5f3ff] leading-[1.1]"
            style={{
              fontSize: '16px',
              textShadow: '0 0 12px rgba(168,85,247,0.55), 0 0 2px rgba(233,213,255,0.45)',
            }}
          >
            {level}
          </div>
        </div>

        <div className="flex-1">
          <div
            className="h-[3px] rounded-full overflow-hidden mb-1
                       bg-[rgba(59,7,100,0.32)]
                       border border-[rgba(168,85,247,0.12)]"
            style={{ boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.4)' }}
          >
            <div
              className="h-full rounded-full transition-[width] duration-[400ms]
                         bg-gradient-to-r from-[#5b21b6] via-[#a855f7] to-[#e9d5ff]"
              style={{
                width: `${pct}%`,
                boxShadow: '0 0 10px rgba(168,85,247,0.55), 0 0 2px rgba(233,213,255,0.6)',
              }}
            />
          </div>
          <div className="flex justify-between">
            <span
              className="font-mono text-[var(--text-3)]"
              style={{ fontSize: '8px', letterSpacing: '0.08em' }}
            >
              EXPERIENCIA
            </span>
            <span
              className="font-mono text-[#a855f7]"
              style={{ fontSize: '8px', letterSpacing: '0.06em' }}
            >
              {formatXP(currentXP)} / {formatXP(xpForNextLevel)} XP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
