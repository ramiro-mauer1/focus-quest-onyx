/* ───────────────────────────────────────────────────────────────
   Core.jsx — React wrapper around the standalone TriadaCore engine.

   Drop-in, prop-driven. Pass your real state and it eases toward it.
   Works in any React 17/18 web app (Vite, Next.js client component,
   CRA). For React Native see the note at the bottom of README.md.

   import TriadaCore from './triada-core.js';   // the engine (vanilla)
   import Core from './Core.jsx';

   <Core
     systemState="idle"               // 'idle' | 'flow'
     level={4}                        // 1..50
     energy={0.32}                    // 0..1
     pillars={{ Intelecto: 7, Vigor: 4, Voluntad: 3 }}  // each 1..40
     size={320}                       // px (square). Omit to fill parent.
   />

   Imperative pulse() (e.g. on a braindump): grab a ref.
     const ref = useRef(null);
     <Core ref={ref} ... />
     ref.current.pulse();
   ─────────────────────────────────────────────────────────────── */
import React, {
  useRef, useEffect, useImperativeHandle, forwardRef,
} from 'react';
import TriadaCore from './triada-core.js';

const Core = forwardRef(function Core(props, ref) {
  const {
    systemState = 'idle',
    level = 4,
    energy = 0.32,
    pillars = { Intelecto: 7, Vigor: 4, Voluntad: 3 },
    size,                       // number → fixed square; undefined → fills parent
    style,
    className,
  } = props;

  const canvasRef = useRef(null);
  const coreRef = useRef(null);

  // create / destroy the engine once
  useEffect(() => {
    const core = new TriadaCore(canvasRef.current, {
      systemState, level, energy, pillars,
    });
    coreRef.current = core;
    core.start();
    return () => { core.stop(); coreRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // push prop changes into the engine (it eases the transition)
  useEffect(() => {
    if (coreRef.current) {
      coreRef.current.setState({ systemState, level, energy, pillars });
    }
  }, [systemState, level, energy, pillars]);

  // expose pulse() to parents
  useImperativeHandle(ref, () => ({
    pulse: () => { if (coreRef.current) coreRef.current.pulse(); },
  }), []);

  const boxStyle = size != null
    ? { width: size, height: size, ...style }
    : { width: '100%', height: '100%', ...style };

  return (
    <div className={className} style={{ position: 'relative', ...boxStyle }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
});

export default Core;
