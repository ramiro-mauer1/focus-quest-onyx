'use client';

import { useEffect, useRef } from 'react';
import { animate, motion, useMotionValue, type Variants } from 'framer-motion';
import { useXP, type Skill } from '@/contexts/XPContext';

export type SystemState = 'idle' | 'flow';

type Props = { systemState?: SystemState };

const COLOR_IDLE = '#22D3EE';
const COLOR_FLOW = '#A855F7';

const SKILL_COLORS: Record<Skill, string> = {
  Intelecto: '#22d3ee',
  Vigor: '#10b981',
  Voluntad: '#d946ef',
};

const SATELLITE_ORDER: Skill[] = ['Intelecto', 'Vigor', 'Voluntad'];
const SATELLITE_ANGLE_STEP = 360 / SATELLITE_ORDER.length;

const SAT_GRAD_ID: Record<Skill, string> = {
  Intelecto: 'sat-chrome-int',
  Vigor: 'sat-chrome-vig',
  Voluntad: 'sat-chrome-vol',
};

const CENTER = 100;
const MAX_RADIUS = 86;
const MIN_RADIUS = 38;
const MAX_DURATION_S = 14;
const MIN_DURATION_S = 2.6;
const RADIUS_TRANSITION_S = 1.6;

function radiusForLevel(level: number): number {
  return Math.max(MIN_RADIUS, MAX_RADIUS - (level - 1) * 2.5);
}

function durationForLevel(level: number): number {
  return Math.max(MIN_DURATION_S, MAX_DURATION_S - (level - 1) * 0.4);
}

const STATE_FADE_S = 1.2;

const coreVariants: Variants = {
  idle: {
    scale: [1, 1.05, 1],
    transition: {
      scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  flow: {
    scale: [1, 1.18, 1],
    transition: {
      scale: { duration: 1.1, repeat: Infinity, ease: 'easeInOut' },
    },
  },
};

const fadeVariants: Variants = {
  idle: { opacity: 1, transition: { duration: STATE_FADE_S, ease: 'easeInOut' } },
  flow: { opacity: 0, transition: { duration: STATE_FADE_S, ease: 'easeInOut' } },
};

const fadeReverseVariants: Variants = {
  idle: { opacity: 0, transition: { duration: STATE_FADE_S, ease: 'easeInOut' } },
  flow: { opacity: 1, transition: { duration: STATE_FADE_S, ease: 'easeInOut' } },
};

const rimVariants: Variants = {
  idle: {
    stroke: '#67e8f9',
    opacity: [0.35, 0.6, 0.35],
    transition: {
      stroke: { duration: STATE_FADE_S, ease: 'easeInOut' },
      opacity: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  flow: {
    stroke: '#c084fc',
    opacity: [0.35, 0.6, 0.35],
    transition: {
      stroke: { duration: STATE_FADE_S, ease: 'easeInOut' },
      opacity: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
    },
  },
};

const specIdleVariants: Variants = {
  idle: {
    opacity: [0.6, 0.85, 0.6],
    transition: { opacity: { duration: 3, repeat: Infinity, ease: 'easeInOut' } },
  },
  flow: {
    opacity: 0,
    transition: { opacity: { duration: STATE_FADE_S, ease: 'easeInOut' } },
  },
};

const specFlowVariants: Variants = {
  idle: {
    opacity: 0,
    transition: { opacity: { duration: STATE_FADE_S, ease: 'easeInOut' } },
  },
  flow: {
    opacity: [0.6, 0.9, 0.6],
    transition: { opacity: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } },
  },
};

type SatelliteProps = {
  skill: Skill;
  color: string;
  level: number;
  currentXP: number;
  initialAngle: number;
};

function Satellite({ skill, color, level, currentXP, initialAngle }: SatelliteProps) {
  const gRef = useRef<SVGGElement>(null);
  const angleRef = useRef(initialAngle);
  const velocityRef = useRef(360 / (durationForLevel(level) * 1000));

  const flashOpacity = useMotionValue(0);
  const flashScale = useMotionValue(1);

  const prevXPRef = useRef(currentXP);
  const prevLevelRef = useRef(level);

  useEffect(() => {
    velocityRef.current = 360 / (durationForLevel(level) * 1000);
  }, [level]);

  useEffect(() => {
    let raf: number;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      angleRef.current += velocityRef.current * dt;
      if (gRef.current) {
        gRef.current.setAttribute(
          'transform',
          `rotate(${angleRef.current} ${CENTER} ${CENTER})`,
        );
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const xpGained = currentXP > prevXPRef.current;
    const leveledUp = level > prevLevelRef.current;
    if (xpGained || leveledUp) {
      animate(flashOpacity, [0, 0.9, 0], { duration: 0.7, ease: 'easeOut' });
      animate(flashScale, [1, 2.6, 1], { duration: 0.7, ease: 'easeOut' });
    }
    prevXPRef.current = currentXP;
    prevLevelRef.current = level;
  }, [currentXP, level, flashOpacity, flashScale]);

  const radius = radiusForLevel(level);
  const targetCy = CENTER - radius;

  return (
    <g ref={gRef} transform={`rotate(${initialAngle} ${CENTER} ${CENTER})`}>
      <motion.circle
        cx={CENTER}
        cy={targetCy}
        initial={false}
        animate={{ cy: targetCy }}
        transition={{ cy: { duration: RADIUS_TRANSITION_S, ease: 'easeOut' } }}
        r={7}
        fill={color}
        opacity={0.28}
        filter="url(#satellite-glow)"
      />

      <motion.circle
        cx={CENTER}
        cy={targetCy}
        initial={false}
        animate={{ cy: targetCy }}
        transition={{ cy: { duration: RADIUS_TRANSITION_S, ease: 'easeOut' } }}
        r={3.5}
        fill={`url(#${SAT_GRAD_ID[skill]})`}
        style={{ filter: `drop-shadow(0 0 5px ${color})` }}
      />

      {/* Specular dot */}
      <motion.circle
        cx={CENTER}
        cy={targetCy - 1.4}
        initial={false}
        animate={{ cy: targetCy - 1.4 }}
        transition={{ cy: { duration: RADIUS_TRANSITION_S, ease: 'easeOut' } }}
        r={1.3}
        fill="url(#sat-spec)"
      />

      <motion.circle
        cx={CENTER}
        cy={targetCy}
        initial={false}
        animate={{ cy: targetCy }}
        transition={{ cy: { duration: RADIUS_TRANSITION_S, ease: 'easeOut' } }}
        r={4}
        fill={color}
        style={{
          opacity: flashOpacity,
          scale: flashScale,
          transformOrigin: 'center',
          transformBox: 'fill-box',
          filter: `drop-shadow(0 0 14px ${color})`,
        }}
      />
    </g>
  );
}

export default function AvatarStage({ systemState = 'idle' }: Props) {
  const { skills } = useXP();
  const isFlow = systemState === 'flow';
  const accent = isFlow ? COLOR_FLOW : COLOR_IDLE;

  const handleSecretReset = () => {
    if (window.confirm('¿Resetear TODO el progreso (XP, Diarias, Misiones) para testeo?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col items-center gap-[10px]">
      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* ── Aura gradients (outer pulse) ─────────────────────── */}
          <radialGradient id="core-grad-idle" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={COLOR_IDLE} stopOpacity="1" />
            <stop offset="55%" stopColor={COLOR_IDLE} stopOpacity="0.45" />
            <stop offset="100%" stopColor={COLOR_IDLE} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="core-grad-flow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={COLOR_FLOW} stopOpacity="1" />
            <stop offset="55%" stopColor={COLOR_FLOW} stopOpacity="0.5" />
            <stop offset="100%" stopColor={COLOR_FLOW} stopOpacity="0" />
          </radialGradient>

          {/* ── Chrome body gradients (orb curvature + depth) ──── */}
          <radialGradient id="chrome-body-idle" cx="45%" cy="38%" r="55%" fx="42%" fy="34%">
            <stop offset="0%"  stopColor="#b5f5f8" stopOpacity="1" />
            <stop offset="22%" stopColor={COLOR_IDLE} stopOpacity="0.95" />
            <stop offset="58%" stopColor="#0e7490" stopOpacity="0.88" />
            <stop offset="85%" stopColor="#083344" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#042f2e" stopOpacity="1" />
          </radialGradient>
          <radialGradient id="chrome-body-flow" cx="45%" cy="38%" r="55%" fx="42%" fy="34%">
            <stop offset="0%"  stopColor="#e9d5ff" stopOpacity="1" />
            <stop offset="22%" stopColor={COLOR_FLOW} stopOpacity="0.95" />
            <stop offset="58%" stopColor="#7e22ce" stopOpacity="0.88" />
            <stop offset="85%" stopColor="#3b0764" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#1e0338" stopOpacity="1" />
          </radialGradient>

          {/* ── Specular top catch-light ──────────────────────── */}
          <radialGradient id="chrome-spec-idle" cx="48%" cy="28%" r="38%">
            <stop offset="0%"  stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="40%" stopColor={COLOR_IDLE} stopOpacity="0.25" />
            <stop offset="100%" stopColor={COLOR_IDLE} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="chrome-spec-flow" cx="48%" cy="28%" r="38%">
            <stop offset="0%"  stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="40%" stopColor={COLOR_FLOW} stopOpacity="0.25" />
            <stop offset="100%" stopColor={COLOR_FLOW} stopOpacity="0" />
          </radialGradient>

          {/* ── Satellite chrome gradients (Tríada) ──────────────── */}
          <radialGradient id="sat-chrome-int" cx="45%" cy="36%" r="56%" fx="38%" fy="30%">
            <stop offset="0%"  stopColor="#cffafe" />
            <stop offset="28%" stopColor="#22d3ee" />
            <stop offset="68%" stopColor="#0e7490" />
            <stop offset="100%" stopColor="#083344" />
          </radialGradient>
          <radialGradient id="sat-chrome-vig" cx="45%" cy="36%" r="56%" fx="38%" fy="30%">
            <stop offset="0%"  stopColor="#d1fae5" />
            <stop offset="28%" stopColor="#10b981" />
            <stop offset="68%" stopColor="#065f46" />
            <stop offset="100%" stopColor="#022c22" />
          </radialGradient>
          <radialGradient id="sat-chrome-vol" cx="45%" cy="36%" r="56%" fx="38%" fy="30%">
            <stop offset="0%"  stopColor="#fae8ff" />
            <stop offset="28%" stopColor="#d946ef" />
            <stop offset="68%" stopColor="#86198f" />
            <stop offset="100%" stopColor="#3b0764" />
          </radialGradient>
          <radialGradient id="sat-spec" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          {/* ── Filters ──────────────────────────────────────── */}
          <filter id="satellite-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <filter id="core-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        <motion.g variants={fadeVariants} animate={systemState}>
          <motion.circle
            cx={CENTER}
            cy={CENTER}
            r={42}
            fill="url(#core-grad-idle)"
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '100px 100px' }}
          />
        </motion.g>

        <motion.g variants={fadeReverseVariants} animate={systemState}>
          <motion.circle
            cx={CENTER}
            cy={CENTER}
            r={42}
            fill="url(#core-grad-flow)"
            animate={{
              scale: [1, 1.22, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '100px 100px' }}
          />
        </motion.g>

        {SATELLITE_ORDER.map((skill, i) => (
          <Satellite
            key={skill}
            skill={skill}
            color={SKILL_COLORS[skill]}
            level={skills[skill].level}
            currentXP={skills[skill].currentXP}
            initialAngle={i * SATELLITE_ANGLE_STEP}
          />
        ))}

        {/* ── Chrome core: layered orb ──────────────────────── */}
        <motion.g
          id="avatar-core-target"
          variants={coreVariants}
          animate={systemState}
          onDoubleClick={handleSecretReset}
          style={{
            transformOrigin: '100px 100px',
            filter: `drop-shadow(0 0 14px ${accent})`,
            transition: `filter ${STATE_FADE_S}s ease-in-out`,
            cursor: 'crosshair',
          }}
        >
          {/* L0 — Dark base (depth under the orb) */}
          <circle cx={CENTER} cy={CENTER} r={18} fill="#020617" opacity={0.7} />

          {/* L1 — Chrome body: IDLE */}
          <motion.circle
            cx={CENTER} cy={CENTER} r={18}
            fill="url(#chrome-body-idle)"
            variants={fadeVariants}
            animate={systemState}
          />
          {/* L1 — Chrome body: FLOW */}
          <motion.circle
            cx={CENTER} cy={CENTER} r={18}
            fill="url(#chrome-body-flow)"
            variants={fadeReverseVariants}
            animate={systemState}
          />

          {/* L2 — Rim highlight ring */}
          <motion.circle
            cx={CENTER} cy={CENTER} r={17}
            fill="none"
            strokeWidth={1.2}
            variants={rimVariants}
            animate={systemState}
          />

          {/* L3 — Specular catch-light: IDLE */}
          <motion.ellipse
            cx={CENTER - 2} cy={CENTER - 7} rx={9} ry={7}
            fill="url(#chrome-spec-idle)"
            variants={specIdleVariants}
            animate={systemState}
          />
          {/* L3 — Specular catch-light: FLOW */}
          <motion.ellipse
            cx={CENTER - 2} cy={CENTER - 7} rx={9} ry={7}
            fill="url(#chrome-spec-flow)"
            variants={specFlowVariants}
            animate={systemState}
          />
        </motion.g>

      </svg>

      <div className="text-center mt-[4px]">
        <div
          className="font-mono font-bold text-[#f1f5f9]"
          style={{
            fontSize: '14px',
            letterSpacing: '0.4em',
            paddingLeft: '0.4em',
            textShadow: `0 0 18px ${accent}99, 0 0 4px ${accent}55`,
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
