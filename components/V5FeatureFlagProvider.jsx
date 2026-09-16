'use client';

import React, { createContext, useContext } from 'react';
import { V5_FEATURE_FLAGS } from '../lib/ui/feature-flags.mjs';

const V5FeatureFlagContext = createContext(V5_FEATURE_FLAGS);

export function V5FeatureFlagProvider({ children, flags = V5_FEATURE_FLAGS }) {
  return (
    <V5FeatureFlagContext.Provider value={flags}>
      {children}
    </V5FeatureFlagContext.Provider>
  );
}

export function useV5FeatureFlags() {
  return useContext(V5FeatureFlagContext);
}
