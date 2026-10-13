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

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return featureFlags[flag];
}
