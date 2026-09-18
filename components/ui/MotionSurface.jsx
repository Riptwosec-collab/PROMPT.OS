'use client';

import React from 'react';
import { motion } from 'motion/react';
import { getTransition } from '../../lib/ui/motion-tokens.mjs';

export default function MotionSurface({
  transitionKind = 'standard',
  reducedMotion = false,
  transition,
  ...props
}) {
  return (
    <motion.div
      transition={transition || getTransition(transitionKind, reducedMotion)}
      {...props}
    />
  );
}
