'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export type SpawnParticlesEvent = {
  startX: number;
  startY: number;
  color: string;
};

type Particle = {
  id: string;
  x: number;
  y: number;
  color: string;
  delay: number;
  duration: number;
  tx: number; // target x
  ty: number; // target y
  bx: number; // burst x (intermediate)
  by: number; // burst y (intermediate)
};

export default function ParticleOverlay() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const handleSpawn = (e: Event) => {
      const { startX, startY, color } = (e as CustomEvent<SpawnParticlesEvent>).detail;
      
      const targetEl = document.getElementById('avatar-core-target');
      let targetX = window.innerWidth / 2;
      let targetY = window.innerHeight / 4; // Fallback roughly where the avatar is
      
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        targetX = rect.left + rect.width / 2;
        targetY = rect.top + rect.height / 2;
      }

      // Generate 12-15 particles
      const count = 12 + Math.floor(Math.random() * 4);
      const newParticles: Particle[] = Array.from({ length: count }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const radius = 15 + Math.random() * 35; // How far they burst
        const burstX = startX + Math.cos(angle) * radius;
        const burstY = startY + Math.sin(angle) * radius;
        
        return {
          id: `${Date.now()}-${Math.random()}`,
          x: startX,
          y: startY,
          color,
          bx: burstX,
          by: burstY,
          tx: targetX,
          ty: targetY,
          delay: Math.random() * 0.15, // Slight stagger
          duration: 0.9 + Math.random() * 0.3, // Flight time ~1050ms
        };
      });

      setParticles((prev) => [...prev, ...newParticles]);
      
      // Cleanup particles from DOM after animation completes
      setTimeout(() => {
        setParticles((prev) => prev.filter(p => !newParticles.find(np => np.id === p.id)));
      }, 2000);
    };

    window.addEventListener('spawn-particles', handleSpawn);
    return () => window.removeEventListener('spawn-particles', handleSpawn);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: p.x, y: p.y, scale: 0, opacity: 0 }}
            animate={{
              x: [p.x, p.bx, p.tx],
              y: [p.y, p.by, p.ty],
              scale: [0, 1, 0.1],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: ['easeOut', 'easeIn'],
              times: [0, 0.25, 1] // Burst ends at 25%, then accelerates towards core
            }}
            className="absolute top-0 left-0 rounded-full"
            style={{
              width: 5,
              height: 5,
              marginLeft: -2.5,
              marginTop: -2.5,
              background: p.color,
              boxShadow: `0 0 6px ${p.color}, 0 0 2px rgba(255,255,255,0.6)`,
              filter: 'brightness(1.1)'
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
