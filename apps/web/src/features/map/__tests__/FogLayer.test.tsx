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

  it('renders the fog above traffic and below map markers', () => {
    render(<FogLayer />);
    const root = screen.getByTestId('fog-layer-root');
    expect(root).toBeDefined();
    expect(root.className).toContain('z-[7]');
    expect(root.className).toContain('absolute');
    expect(root.className).toContain('inset-0');
  });

  it('feathers gently from the river across the Commercial side', () => {
    render(<FogLayer />);
    const haze = screen.getByTestId('locked-zone-haze');
    expect(haze).toBeDefined();
    expect(haze.className).toContain('left-[42%]');
    expect(haze.className).toContain('right-0');

    // The overlay stays translucent so streets and traffic remain visible below it.
    const opacity = parseFloat(haze.style.opacity);
    expect(opacity).toBeGreaterThanOrEqual(0.40);
    expect(opacity).toBeLessThanOrEqual(0.50);

    // The wide ramp avoids a hard vertical seam at the river.
    expect(haze.style.background).toContain('linear-gradient');
    expect(haze.style.background).toContain('transparent 0%');
    expect(haze.style.background).toContain('20%');
    expect(haze.style.background).toContain('48%');
    expect(haze.style.background).toContain(designTokens.color.overlay.hazeLocked); // #919190
  });

  it('renders two drifting cloud layers with a broad river feather', () => {
    render(<FogLayer />);
    const container = screen.getByTestId('fog-drifting-container');
    expect(container).toBeDefined();
    expect(container.className).toContain('left-[42%]');
    expect(container.style.maskImage).toContain('18%');
    expect(container.style.maskImage).toContain('48%');
    expect(container.style.maskImage).toContain('76%');

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
