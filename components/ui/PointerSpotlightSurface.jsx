'use client';

import React, { useEffect, useRef } from 'react';

const POINTER_QUERY = '(hover: hover) and (pointer: fine)';
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

export default function PointerSpotlightSurface({
  as: Tag = 'div',
  className = '',
  children,
  onPointerMove,
  onPointerLeave,
  ...props
}) {
  const surfaceRef = useRef(null);
  const frameRef = useRef(0);
  const pointRef = useRef(null);
  const enabledRef = useRef(false);

  useEffect(() => {
    const finePointer = window.matchMedia(POINTER_QUERY);
    const reducedMotion = window.matchMedia(REDUCED_QUERY);
    const sync = () => {
      enabledRef.current = finePointer.matches && !reducedMotion.matches;
    };

    sync();
    finePointer.addEventListener?.('change', sync);
    reducedMotion.addEventListener?.('change', sync);

    return () => {
      finePointer.removeEventListener?.('change', sync);
      reducedMotion.removeEventListener?.('change', sync);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const flushPoint = () => {
    frameRef.current = 0;
    const node = surfaceRef.current;
    const point = pointRef.current;
    if (!node || !point || !enabledRef.current) return;
    node.style.setProperty('--spotlight-x', `${point.x}px`);
    node.style.setProperty('--spotlight-y', `${point.y}px`);
  };

  const handlePointerMove = (event) => {
    onPointerMove?.(event);
    if (!enabledRef.current || !surfaceRef.current) return;
    const rect = surfaceRef.current.getBoundingClientRect();
    pointRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    if (!frameRef.current) frameRef.current = requestAnimationFrame(flushPoint);
  };

  const handlePointerLeave = (event) => {
    onPointerLeave?.(event);
    pointRef.current = null;
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }
    const node = surfaceRef.current;
    if (!node) return;
    node.style.setProperty('--spotlight-x', '50%');
    node.style.setProperty('--spotlight-y', '50%');
  };

  return (
    <Tag
      ref={surfaceRef}
      className={`v5-pointer-spotlight ${className}`.trim()}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...props}
    >
      {children}
    </Tag>
  );
}
