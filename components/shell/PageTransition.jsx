'use client';

import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

export default function PageTransition({ activeKey, children }) {
  const reducedMotion = useReducedMotion();
  const enterTransition = reducedMotion
    ? { duration: 0.01 }
    : { duration: 0.2, ease: [0.22, 1, 0.36, 1] };

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={activeKey}
        className="h-full min-h-0"
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        exit={reducedMotion
          ? { opacity: 0, transition: { duration: 0.01 } }
          : { opacity: 0, y: 0, transition: { duration: 0.12, ease: [0.4, 0, 1, 1] } }}
        transition={enterTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
