'use client';

import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

export default function AuroraBackground() {
  const ref = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const syncVisibility = () => {
      node.dataset.paused = String(reducedMotion || document.visibilityState !== 'visible');
    };

    syncVisibility();
    document.addEventListener('visibilitychange', syncVisibility);

    if (reducedMotion) {
      return () => document.removeEventListener('visibilitychange', syncVisibility);
    }

    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    let frame = 0;
    const move = (event) => {
      if (!fine.matches || document.visibilityState !== 'visible') return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        node.style.setProperty('--pointer-x', `${event.clientX}px`);
        node.style.setProperty('--pointer-y', `${event.clientY}px`);
      });
    };

    window.addEventListener('pointermove', move, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', move);
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, [reducedMotion]);

  return <div ref={ref} className="v5-aurora" aria-hidden="true" />;
}
