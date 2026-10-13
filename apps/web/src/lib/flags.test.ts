import { afterEach, describe, expect, it, vi } from 'vitest';

describe('feature flag defaults', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('enables the core pages by default and keeps Comms and Duel gated', async () => {
    for (const name of [
      'NEXT_PUBLIC_FEATURE_MAP',
      'NEXT_PUBLIC_FEATURE_RIG',
      'NEXT_PUBLIC_FEATURE_MARKET',
      'NEXT_PUBLIC_FEATURE_COMMS',
      'NEXT_PUBLIC_FEATURE_DUEL',
      'NEXT_PUBLIC_FEATURE_SETTINGS',
      'NEXT_PUBLIC_FEATURE_DEV_OVERLAY',
    ]) {
      vi.stubEnv(name, undefined);
    }

    const { featureFlags } = await import('./flags');

    expect(featureFlags.map).toBe(true);
    expect(featureFlags.rig).toBe(true);
    expect(featureFlags.market).toBe(true);
    expect(featureFlags.comms).toBe(false);
    expect(featureFlags.duel).toBe(false);
    expect(featureFlags.settings).toBe(false);
    expect(featureFlags.devOverlay).toBe(false);
  });

  it('respects explicit false flags for core pages', async () => {
    vi.stubEnv('NEXT_PUBLIC_FEATURE_MAP', 'false');
    vi.stubEnv('NEXT_PUBLIC_FEATURE_RIG', 'false');
    vi.stubEnv('NEXT_PUBLIC_FEATURE_MARKET', 'false');

    const { featureFlags } = await import('./flags');

    expect(featureFlags.map).toBe(false);
    expect(featureFlags.rig).toBe(false);
    expect(featureFlags.market).toBe(false);
  });
});
