import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FogLayer } from '../FogLayer';
import { useMapStore } from '../../../stores/map-store';
import { useToastStore } from '../../../stores/toast-store';
import { NIX_GUIDE_LINES } from '../nixGuideLines';
import designTokens from '@neon-cipher/tokens/design-tokens.json';

vi.mock('@/lib/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: vi.fn(() => false),
}));

import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';

describe('Fog over Commercial Requirements', () => {
  beforeEach(() => {
    act(() => {
      useMapStore.setState({
        unlocks: { bridge: false },
        activeNixSituation: null,
        isNixBubbleOpen: false,
      });
      useToastStore.setState({ toast: null });
    });
    vi.mocked(usePrefersReducedMotion).mockReturnValue(false);
  });

  it('renders root container on the east side at z-[6] under the Commercial tag', () => {
    render(<FogLayer />);
    const root = screen.getByTestId('fog-layer-root');
    expect(root).toBeDefined();
    expect(root.className).toContain('z-[6]');
    expect(root.className).toContain('absolute');
    expect(root.className).toContain('inset-0');
  });

  it('renders base feathered gradient over Commercial half (right-0 w-1/2) with 55-70% opacity and 14% ramp-in', () => {
    render(<FogLayer />);
    const haze = screen.getByTestId('locked-zone-haze');
    expect(haze).toBeDefined();
    expect(haze.className).toContain('right-0');
    expect(haze.className).toContain('w-1/2');

    // 55% to 70% opacity
    const opacity = parseFloat(haze.style.opacity);
    expect(opacity).toBeGreaterThanOrEqual(0.55);
    expect(opacity).toBeLessThanOrEqual(0.70);

    // Ramps in over first 14% at the river
    expect(haze.style.background).toContain('linear-gradient');
    expect(haze.style.background).toContain('transparent 0%');
    expect(haze.style.background).toContain('14%');
    expect(haze.style.background).toContain(designTokens.color.overlay.hazeLocked); // #919190
  });

  it('renders two drifting layers with 40-60 second loops, transform-only drifting, and river feathering mask', () => {
    render(<FogLayer />);
    const container = screen.getByTestId('fog-drifting-container');
    expect(container).toBeDefined();
    expect(container.style.maskImage).toContain('14%');

    const layer1 = screen.getByTestId('fog-cloud-layer-1');
    const layer2 = screen.getByTestId('fog-cloud-layer-2');
    expect(layer1).toBeDefined();
    expect(layer2).toBeDefined();

    // Uses fog tint token
    expect(layer1.style.backgroundImage).toContain(designTokens.color.overlay.fogTint); // #7E878C
    expect(layer2.style.backgroundImage).toContain(designTokens.color.overlay.fogTint);

    // 40 to 60s loops
    expect(layer1.style.animation).toMatch(/fogDriftLeft (4[0-9]|5[0-9]|60)s linear infinite/);
    expect(layer2.style.animation).toMatch(/fogDriftRight (4[0-9]|5[0-9]|60)s linear infinite/);
  });

  it('under prefers-reduced-motion: renders static fog without drifting loops', () => {
    vi.mocked(usePrefersReducedMotion).mockReturnValue(true);
    render(<FogLayer />);

    const layer1 = screen.getByTestId('fog-cloud-layer-1');
    const layer2 = screen.getByTestId('fog-cloud-layer-2');
    expect(layer1.style.animation).toBe('none');
    expect(layer2.style.animation).toBe('none');
  });

  it('blocks interaction: tapping the fog displays locked toast and triggers Nix unlock line', () => {
    render(<FogLayer />);
    const tapArea = screen.getByTestId('fog-tap-area');
    expect(tapArea).toBeDefined();

    fireEvent.click(tapArea);

    // Toast triggered
    const toast = useToastStore.getState().toast;
    expect(toast).not.toBeNull();
    expect(toast?.message).toContain('Cross the bridge');

    // Nix situation triggered
    expect(useMapStore.getState().activeNixSituation).toBe('lockedTap');
    expect(useMapStore.getState().isNixBubbleOpen).toBe(true);
    expect(NIX_GUIDE_LINES.lockedTap).toBe('Fogged out. Cross the bridge before you go poking around there.');
  });

  it('on unlock: fog thins and drifts away over 1.2s (duration-[1200ms]) and removes tap barrier', () => {
    const { rerender } = render(<FogLayer />);
    expect(screen.queryByTestId('fog-tap-area')).not.toBeNull();

    act(() => {
      useMapStore.setState({ unlocks: { bridge: true } });
    });
    rerender(<FogLayer />);

    const haze = screen.getByTestId('locked-zone-haze');
    expect(haze.style.opacity).toBe('0');
    expect(haze.className).toContain('duration-[1200ms]');

    const container = screen.getByTestId('fog-drifting-container');
    expect(container.className).toContain('opacity-0');
    expect(container.className).toContain('duration-[1200ms]');

    // Interaction blocking removed
    expect(screen.queryByTestId('fog-tap-area')).toBeNull();
  });
});
