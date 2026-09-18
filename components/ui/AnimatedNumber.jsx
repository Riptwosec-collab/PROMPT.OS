'use client';

import React, { useEffect } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';

const defaultFormat = (value) => String(Math.round(value));

export default function AnimatedNumber({
  value = 0,
  format = defaultFormat,
  reducedMotion = false,
  ...props
}) {
  const numericValue = Number(value);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
  const motionValue = useMotionValue(safeValue);
  const displayValue = useTransform(motionValue, (latest) => format(latest));

  useEffect(() => {
    if (reducedMotion) {
      motionValue.set(safeValue);
      return undefined;
    }

    const controls = animate(motionValue, safeValue, {
      type: 'tween',
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [motionValue, reducedMotion, safeValue]);

  if (reducedMotion) {
    return <span {...props}>{format(safeValue)}</span>;
  }

  return <motion.span {...props}>{displayValue}</motion.span>;
}
