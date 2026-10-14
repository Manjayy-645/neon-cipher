function readFeatureFlag(value: string | undefined, defaultValue = false): boolean {
  return value === undefined ? defaultValue : value === 'true';
}

export const featureFlags = {
  map: readFeatureFlag(process.env.NEXT_PUBLIC_FEATURE_MAP, true),
  rig: readFeatureFlag(process.env.NEXT_PUBLIC_FEATURE_RIG, true),
  market: readFeatureFlag(process.env.NEXT_PUBLIC_FEATURE_MARKET, true),
  comms: readFeatureFlag(process.env.NEXT_PUBLIC_FEATURE_COMMS),
  duel: readFeatureFlag(process.env.NEXT_PUBLIC_FEATURE_DUEL),
  settings: readFeatureFlag(process.env.NEXT_PUBLIC_FEATURE_SETTINGS),
  devOverlay: readFeatureFlag(process.env.NEXT_PUBLIC_FEATURE_DEV_OVERLAY),
} as const;

export type FeatureFlag = keyof typeof featureFlags;

// In-memory and storage-backed runtime overrides for dev testing
const runtimeOverrides: Partial<Record<FeatureFlag, boolean>> = {};
const listeners = new Set<() => void>();

export function getFeatureFlagOverride(flag: FeatureFlag): boolean | undefined {
  if (runtimeOverrides[flag] !== undefined) {
    return runtimeOverrides[flag];
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`neon_dev_flag_${flag}`);
      if (stored !== null) {
        runtimeOverrides[flag] = stored === 'true';
        return runtimeOverrides[flag];
      }
    } catch {
      // ignore storage access errors
    }
  }
  return undefined;
}

export function setFeatureFlagOverride(flag: FeatureFlag, value: boolean | undefined): void {
  if (value === undefined) {
    delete runtimeOverrides[flag];
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`neon_dev_flag_${flag}`);
      } catch {}
    }
  } else {
    runtimeOverrides[flag] = value;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`neon_dev_flag_${flag}`, String(value));
      } catch {}
    }
  }
  listeners.forEach((cb) => cb());
}

export function clearFeatureFlagOverrides(): void {
  const flags = Object.keys(featureFlags) as FeatureFlag[];
  flags.forEach((f) => {
    delete runtimeOverrides[f];
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`neon_dev_flag_${f}`);
      } catch {}
    }
  });
  listeners.forEach((cb) => cb());
}

export function subscribeToFeatureFlags(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const override = getFeatureFlagOverride(flag);
  if (override !== undefined) {
    return override;
  }
  return featureFlags[flag];
}
