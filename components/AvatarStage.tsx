'use client';

import { useEffect, useRef } from 'react';
import { animate, motion, useMotionValue, type Variants } from 'framer-motion';
import { useXP, type Skill } from '@/contexts/XPContext';
import Core from './Core';

export type SystemState = 'idle' | 'flow';

type Props = { systemState?: SystemState };

const COLOR_IDLE = '#22D3EE';
const COLOR_FLOW = '#A855F7';

const SKILL_COLORS: Record<Skill, string> = {
  Intelecto: '#22d3ee',
  Vigor: '#10b981',
  Voluntad: '#d946ef',
};

const CENTER = 100;
const STATE_FADE_S = 1.2;

const fadeVariants: Variants = {
  idle: { opacity: 1, transition: { duration: STATE_FADE_S, ease: 'easeInOut' } },
  flow: { opacity: 0, transition: { duration: STATE_FADE_S, ease: 'easeInOut' } },
};

const fadeReverseVariants: Variants = {
  idle: { opacity: 0, transition: { duration: STATE_FADE_S, ease: 'easeInOut' } },
  flow: { opacity: 1, transition: { duration: STATE_FADE_S, ease: 'easeInOut' } },
};

export default function AvatarStage({ systemState = 'idle' }: Props) {
  const { skills, level, currentXP, xpForNextLevel } = useXP();
  const isFlow = systemState === 'flow';
  const accent = isFlow ? COLOR_FLOW : COLOR_IDLE;

  const coreRef = useRef<any>(null);
  const prevXPRef = useRef(currentXP);
  const prevLevelRef = useRef(level);

  useEffect(() => {
    const xpGained = currentXP > prevXPRef.current;
    const leveledUp = level > prevLevelRef.current;
    if (xpGained || leveledUp) {
      coreRef.current?.pulse();
    }
    prevXPRef.current = currentXP;
    prevLevelRef.current = level;
  }, [currentXP, level]);

  const handleSecretReset = () => {
    if (window.confirm('¿Resetear TODO el progreso (XP, Diarias, Misiones) para testeo?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col items-center gap-[10px]">
      <div className="relative" style={{ width: 280, height: 280 }}>
        {/* Triada Core — bottom layer, captures pointer/touch */}
        <div
          id="avatar-core-target"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ filter: isFlow ? 'saturate(1.18) brightness(1.08)' : undefined, transition: `filter ${STATE_FADE_S}s ease-in-out` }}
          onDoubleClick={handleSecretReset}
        >
          <Core 
            ref={coreRef}
            systemState={systemState}
            level={level}
            energy={xpForNextLevel > 0 ? Math.min(1, Math.max(0, currentXP / xpForNextLevel)) : 0}
            pillars={{
              Intelecto: skills.Intelecto.level,
              Vigor: skills.Vigor.level,
              Voluntad: skills.Voluntad.level
            }}
            size={260}
          />
        </div>

        {/* SVG overlay — orbit paths, reticles, satellites (no pointer events) */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width="280"
          height="280"
          viewBox="0 0 200 200"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <filter
              id="satellite-glow"
              x="-100%"
              y="-100%"
              width="300%"
              height="300%"
            >
              <feGaussianBlur stdDeviation="2.6" />
            </filter>
          </defs>

          {/* Inner HUD reticle — slow CW */}
          <motion.circle
            cx={CENTER}
            cy={CENTER}
            r={61}
            fill="none"
            stroke={accent}
            strokeWidth={0.55}
            strokeOpacity={0.42}
            strokeDasharray="1.4 6"
            style={{
              transformOrigin: '100px 100px',
              transition: `stroke ${STATE_FADE_S}s ease-in-out`,
            }}
            animate={{ rotate: 360 }}
            transition={{ rotate: { duration: 80, repeat: Infinity, ease: 'linear' } }}
          />

          {/* Outer HUD reticle — slower CCW */}
          <motion.circle
            cx={CENTER}
            cy={CENTER}
            r={65.5}
            fill="none"
            stroke={accent}
            strokeWidth={0.4}
            strokeOpacity={0.22}
            strokeDasharray="0.8 14"
            style={{
              transformOrigin: '100px 100px',
              transition: `stroke ${STATE_FADE_S}s ease-in-out`,
            }}
            animate={{ rotate: -360 }}
            transition={{ rotate: { duration: 120, repeat: Infinity, ease: 'linear' } }}
          />
        </svg>
      </div>

      <div className="text-center mt-[4px]">
        <div
          className="font-mono font-bold text-[#f1f5f9]"
          style={{
            fontSize: '13px',
            letterSpacing: '0.34em',
            paddingLeft: '0.34em',
            textShadow: `0 0 14px ${accent}66, 0 0 3px ${accent}40`,
            transition: `text-shadow ${STATE_FADE_S}s ease-in-out`,
          }}
        >
          CORE
        </div>
        <div
          className="relative mt-[5px] font-mono font-semibold h-[14px]"
          style={{ fontSize: '10px', letterSpacing: '0.12em' }}
        >
          <motion.span
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap"
            variants={fadeVariants}
            animate={systemState}
            style={{ color: COLOR_IDLE, textShadow: `0 0 8px ${COLOR_IDLE}55` }}
          >
            ◆ EN ESPERA
          </motion.span>
          <motion.span
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap"
            variants={fadeReverseVariants}
            animate={systemState}
            style={{ color: COLOR_FLOW, textShadow: `0 0 10px ${COLOR_FLOW}90` }}
          >
            ◆ FLUJO ÓPTIMO
          </motion.span>
        </div>
      </div>
    </div>
  );
}
