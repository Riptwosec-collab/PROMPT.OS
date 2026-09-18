'use client';

import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

const POINTER_QUERY = '(hover: hover) and (pointer: fine)';

export default function MagneticAction({
  children,
  className = '',
  innerClassName = '',
  onPointerMove,
  onPointerLeave,
  onBlur,
  type = 'button',
  ...props
}) {
  const innerRef = useRef(null);
  const frameRef = useRef(0);
  const pointRef = useRef(null);
  const finePointerRef = useRef(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const media = window.matchMedia(POINTER_QUERY);
    const sync = () => {
      finePointerRef.current = media.matches;
    };
    sync();
    media.addEventListener?.('change', sync);
    return () => {
      media.removeEventListener?.('change', sync);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const reset = () => {
    pointRef.current = null;
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }
    if (innerRef.current) innerRef.current.style.transform = 'translate3d(0, 0, 0)';
  };

  const flush = () => {
    frameRef.current = 0;
    const node = innerRef.current;
    const point = pointRef.current;
    if (!node || !point || reducedMotion || !finePointerRef.current) return;
    const x = Math.max(-2, Math.min(2, point.x));
    const y = Math.max(-2, Math.min(2, point.y));
    node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const handlePointerMove = (event) => {
    onPointerMove?.(event);
    if (reducedMotion || !finePointerRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const normalizedX = ((event.clientX - (rect.left + rect.width / 2)) / Math.max(rect.width / 2, 1)) * 2;
    const normalizedY = ((event.clientY - (rect.top + rect.height / 2)) / Math.max(rect.height / 2, 1)) * 2;
    pointRef.current = { x: normalizedX, y: normalizedY };
    if (!frameRef.current) frameRef.current = requestAnimationFrame(flush);
  };

  const handlePointerLeave = (event) => {
    onPointerLeave?.(event);
    reset();
  };

  const handleBlur = (event) => {
    onBlur?.(event);
    reset();
  };

  return (
    <button
      type={type}
      className={`v5-magnetic-action ${className}`.trim()}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onBlur={handleBlur}
      {...props}
    >
      <span ref={innerRef} className={`v5-magnetic-inner ${innerClassName}`.trim()}>
        {children}
      </span>
    </button>
  );
}
