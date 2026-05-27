'use client';

import { useEffect, useRef } from 'react';
import { animate, motion, useMotionValue, type Variants } from 'framer-motion';
import { useXP, type Skill } from '@/contexts/XPContext';
import EarthCore from './EarthCore';

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

const CENTER = 100;
const MAX_RADIUS = 98;
const MIN_RADIUS = 68;
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

const fadeVariants: Variants = {
  idle: { opacity: 1, transition: { duration: STATE_FADE_S, ease: 'easeInOut' } },
  flow: { opacity: 0, transition: { duration: STATE_FADE_S, ease: 'easeInOut' } },
};

const fadeReverseVariants: Variants = {
  idle: { opacity: 0, transition: { duration: STATE_FADE_S, ease: 'easeInOut' } },
  flow: { opacity: 1, transition: { duration: STATE_FADE_S, ease: 'easeInOut' } },
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
      {/* Atmospheric halo around satellite */}
      <motion.circle
        cx={CENTER}
        cy={targetCy}
        initial={false}
        animate={{ cy: targetCy }}
        transition={{ cy: { duration: RADIUS_TRANSITION_S, ease: 'easeOut' } }}
        r={6}
        fill={color}
        opacity={0.14}
        filter="url(#satellite-glow)"
      />

      {/* Pearl body — dark base + Fresnel rim in skill color */}
      <motion.circle
        cx={CENTER}
        cy={targetCy}
        initial={false}
        animate={{ cy: targetCy }}
        transition={{ cy: { duration: RADIUS_TRANSITION_S, ease: 'easeOut' } }}
        r={3}
        fill="#05070d"
      />
      <motion.circle
        cx={CENTER}
        cy={targetCy}
        initial={false}
        animate={{ cy: targetCy }}
        transition={{ cy: { duration: RADIUS_TRANSITION_S, ease: 'easeOut' } }}
        r={3}
        fill={`url(#sat-body-${skill})`}
      />
      <motion.circle
        cx={CENTER}
        cy={targetCy}
        initial={false}
        animate={{ cy: targetCy }}
        transition={{ cy: { duration: RADIUS_TRANSITION_S, ease: 'easeOut' } }}
        r={2.95}
        fill="none"
        stroke={color}
        strokeWidth={0.5}
        opacity={0.85}
      />
      <motion.circle
        cx={CENTER - 0.85}
        cy={targetCy - 1}
        initial={false}
        animate={{ cy: targetCy - 1 }}
        transition={{ cy: { duration: RADIUS_TRANSITION_S, ease: 'easeOut' } }}
        r={0.7}
        fill="#ffffff"
        opacity={0.85}
      />

      {/* XP gain flash */}
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

  const orbitalPaths = SATELLITE_ORDER.map((skill) => ({
    skill,
    radius: radiusForLevel(skills[skill].level),
    color: SKILL_COLORS[skill],
  }));

  return (
    <div className="flex flex-col items-center gap-[10px]">
      <div className="relative" style={{ width: 240, height: 240 }}>
        {/* Earth (cobe canvas) — bottom layer, captures pointer/touch */}
        <div
          id="avatar-core-target"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ filter: isFlow ? 'saturate(1.18) brightness(1.08)' : undefined, transition: `filter ${STATE_FADE_S}s ease-in-out` }}
        >
          <EarthCore size={200} flow={isFlow} onDoubleClick={handleSecretReset} />
        </div>

        {/* SVG overlay — orbit paths, reticles, satellites (no pointer events) */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width="240"
          height="240"
          viewBox="0 0 200 200"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {SATELLITE_ORDER.map((skill) => (
              <radialGradient
                key={skill}
                id={`sat-body-${skill}`}
                cx="38%"
                cy="32%"
                r="78%"
              >
                <stop offset="0%" stopColor={SKILL_COLORS[skill]} stopOpacity="0.32" />
                <stop offset="55%" stopColor="#0a0e1a" stopOpacity="0" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
              </radialGradient>
            ))}
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

          {/* Orbital paths */}
          {orbitalPaths.map(({ skill, radius, color }) => (
            <motion.circle
              key={`path-${skill}`}
              cx={CENTER}
              cy={CENTER}
              initial={false}
              animate={{ r: radius }}
              transition={{ r: { duration: RADIUS_TRANSITION_S, ease: 'easeOut' } }}
              fill="none"
              stroke={color}
              strokeWidth={0.4}
              strokeOpacity={0.16}
              strokeDasharray="1.2 3.2"
            />
          ))}

          {/* Satellites */}
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
