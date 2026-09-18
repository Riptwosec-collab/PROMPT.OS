'use client';

import React from 'react';

export default function GlowButton({ className = '', ...props }) {
  return (
    <button
      className={`rounded-xl border border-white/10 focus-visible:outline-none focus-visible:shadow-[var(--v5-focus-ring)] ${className}`}
      {...props}
    />
  );
}
