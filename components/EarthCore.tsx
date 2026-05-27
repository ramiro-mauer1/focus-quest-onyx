'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import createGlobe from 'cobe';

declare module 'cobe' {
  interface COBEOptions {
    onRender?: (state: Record<string, number>) => void;
  }
}

type Props = {
  size?: number;
  flow?: boolean;
  onDoubleClick?: () => void;
};

export default function EarthCore({ size = 200, flow = false, onDoubleClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phiRef = useRef(0);
  const thetaRef = useRef(0.22);
  const flowRef = useRef(flow);

  const dragStartRef = useRef<{
    x: number;
    y: number;
    phi: number;
    theta: number;
  } | null>(null);
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    flowRef.current = flow;
  }, [flow]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: dpr,
      width: size * dpr,
      height: size * dpr,
      phi: 0,
      theta: 0.22,
      dark: 0.35,
      diffuse: 1.45,
      mapSamples: 16000,
      mapBrightness: 6.6,
      mapBaseBrightness: 0.18,
      baseColor: [0.18, 0.12, 0.34],
      markerColor: [0.95, 0.65, 1.0],
      glowColor: [0.55, 0.32, 0.85],
      markers: [],
      onRender: (state) => {
        if (!isDraggingRef.current) {
          phiRef.current += flowRef.current ? 0.014 : 0.0048;
        }
        state.phi = phiRef.current;
        state.theta = thetaRef.current;
      },
    });

    return () => globe.destroy();
  }, [size]);

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      phi: phiRef.current,
      theta: thetaRef.current,
    };
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    phiRef.current = dragStartRef.current.phi + dx / 110;
    thetaRef.current = Math.max(
      -1.2,
      Math.min(1.2, dragStartRef.current.theta + dy / 220),
    );
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    if (canvasRef.current?.hasPointerCapture(e.pointerId)) {
      canvasRef.current.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={onDoubleClick}
      style={{
        width: size,
        height: size,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        contain: 'layout paint size',
      }}
    />
  );
}
