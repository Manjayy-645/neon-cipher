import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { Hud } from '../Hud';
import { usePlayerStore } from '../../../stores/player-store';
import { useSettingsStore } from '../../../stores/settings-store';

const { mockPush, mockBack, mockPathname } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockBack: vi.fn(),
  mockPathname: vi.fn(() => '/map'),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
  usePathname: () => mockPathname(),
}));

describe('HUD Component (STYLE S2)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockPush.mockClear();
    mockBack.mockClear();
    mockPathname.mockReturnValue('/map');
    useSettingsStore.setState({ isDrawerOpen: false });
    usePlayerStore.setState({
      credits: 4200,
      coins: 18,
      handle: 'NIX_77',
      sectorHeat: 38,
      avatarUrl: '/icons/glyph-camera.svg',
    });
  });

  it('renders with height 56px, surface panel, and 1px line below', () => {
    const { container } = render(<Hud />);
    const header = container.querySelector('header');
    expect(header).not.toBeNull();
    expect(header?.className).toContain('h-[56px]');
    expect(header?.className).toContain('bg-panel');
    expect(header?.className).toContain('border-b');
    expect(header?.className).toContain('border-line');
    expect(header?.className).toContain('px-3');
  });

  it('renders left group with 36px avatar slot, handle in 12px mono bold, and credits in money.text', () => {
    render(<Hud />);
    const handleEl = screen.getByText('NIX_77');
    expect(handleEl).toBeDefined();
    expect(handleEl.className).toContain('font-data');
    expect(handleEl.className).toContain('text-[12px]');
    expect(handleEl.className).toContain('font-bold');
    expect(handleEl.className).toContain('tracking-[1px]');

    const creditsEl = screen.getByText('$4,200');
    expect(creditsEl).toBeDefined();
    expect(creditsEl.className).toContain('font-data');
    expect(creditsEl.className).toContain('text-[12px]');
    expect(creditsEl.className).toContain('font-semibold');
    expect(creditsEl.className).toContain('text-money-text');
  });

  it('renders coin glyph (16px) and coin count (12px mono, ink)', () => {
    const { container } = render(<Hud />);
    const coinSvg = container.querySelector('svg.w-\\[16px\\].h-\\[16px\\]');
    expect(coinSvg).not.toBeNull();

    const coinsEl = screen.getByText('18');
    expect(coinsEl).toBeDefined();
    expect(coinsEl.className).toContain('font-data');
    expect(coinsEl.className).toContain('text-[12px]');
    expect(coinsEl.className).toContain('text-ink');
  });

  it('renders city name in serif, centered and single line with truncation', () => {
    render(<Hud />);
    const cityEl = screen.getByText('Low Meridian');
    expect(cityEl).toBeDefined();
    expect(cityEl.className).toContain('font-heading');
    expect(cityEl.className).toContain('tracking-[0.5px]');
    expect(cityEl.className).toContain('truncate');
  });

  it('renders sector heat with aria-label, 8 segments, and danger text', () => {
    const { container } = render(<Hud />);
    const heatMeter = screen.getByRole('meter');
    expect(heatMeter).toBeDefined();
    expect(heatMeter.getAttribute('aria-label')).toBe('Sector heat 38 percent');

    const labelEl = screen.getByText('SECTOR HEAT');
    expect(labelEl).toBeDefined();
    expect(labelEl.className).toContain('font-data');
    expect(labelEl.className).toContain('tracking-[1px]');

    const percentEl = screen.getByText('38%');
    expect(percentEl).toBeDefined();
    expect(percentEl.className).toContain('text-danger-text');
    expect(percentEl.className).toContain('font-semibold');
    // Heat meter must NEVER be green
    expect(percentEl.className).not.toContain('text-accent');

    // 8 segments
    const segmentsContainer = heatMeter.querySelector('[aria-hidden="true"]');
    expect(segmentsContainer?.children).toHaveLength(8);

    // 38% of 8 segments is 3 active segments
    const activeSegments = segmentsContainer?.querySelectorAll('.bg-danger');
    const emptySegments = segmentsContainer?.querySelectorAll('.bg-heat-track');
    expect(activeSegments).toHaveLength(3);
    expect(emptySegments).toHaveLength(5);
  });

  it('renders hairline vertical dividers (1px line, 24px tall) between groups', () => {
    const { container } = render(<Hud />);
    const dividers = container.querySelectorAll('.w-\\[1px\\].h-\\[24px\\].bg-line');
    expect(dividers).toHaveLength(2);
  });

  it('supports custom cityName prop and applies truncation for long city names', () => {
    render(<Hud cityName="Neo-Kyoto Sector 04 Sub-District" />);
    const customCityEl = screen.getByText('Neo-Kyoto Sector 04 Sub-District');
    expect(customCityEl).toBeDefined();
    expect(customCityEl.className).toContain('font-heading');
    expect(customCityEl.className).toContain('text-[19px]');
    expect(customCityEl.className).toContain('truncate');
    expect(customCityEl.getAttribute('title')).toBe('Neo-Kyoto Sector 04 Sub-District');
  });

  it('renders fallback placeholder in avatar slot when avatarUrl is empty or placeholder', () => {
    usePlayerStore.setState({ avatarUrl: '' });
    const { container } = render(<Hud />);
    const img = container.querySelector('header img');
    expect(img).toBeNull();
    const fallback = screen.getByTestId('avatar-fallback');
    expect(fallback).toBeDefined();
    expect(fallback.textContent).toBe('N'); // Initial of NIX_77
  });

  it('clamps sector heat meter between 0 and 100 and computes active segments correctly', () => {
    // 0% heat
    act(() => {
      usePlayerStore.setState({ sectorHeat: 0 });
    });
    const { rerender } = render(<Hud />);
    let heatMeter = screen.getByRole('meter');
    expect(heatMeter.getAttribute('aria-label')).toBe('Sector heat 0 percent');
    let segmentsContainer = heatMeter.querySelector('[aria-hidden="true"]');
    expect(segmentsContainer?.querySelectorAll('.bg-danger')).toHaveLength(0);
    expect(segmentsContainer?.querySelectorAll('.bg-heat-track')).toHaveLength(8);

    // 100% heat
    act(() => {
      usePlayerStore.setState({ sectorHeat: 100 });
    });
    rerender(<Hud />);
    heatMeter = screen.getByRole('meter');
    expect(heatMeter.getAttribute('aria-label')).toBe('Sector heat 100 percent');
    segmentsContainer = heatMeter.querySelector('[aria-hidden="true"]');
    expect(segmentsContainer?.querySelectorAll('.bg-danger')).toHaveLength(8);
    expect(segmentsContainer?.querySelectorAll('.bg-heat-track')).toHaveLength(0);

    // Over 100% clamped to 100%
    act(() => {
      usePlayerStore.setState({ sectorHeat: 110 });
    });
    rerender(<Hud />);
    heatMeter = screen.getByRole('meter');
    expect(heatMeter.getAttribute('aria-label')).toBe('Sector heat 100 percent');
    expect(heatMeter.getAttribute('aria-valuenow')).toBe('100');
  });

  it('guarantees layout stability at 360px without wrapping or overflowing', () => {
    const { container } = render(<Hud />);
    const header = container.querySelector('header');
    expect(header).not.toBeNull();

    // Must be a grid container with minmax(0, ...) columns and items-center
    expect(header?.className).toContain('grid');
    expect(header?.className).toContain('items-center');
    expect(header?.className).toContain('minmax(0,1fr)');

    // 12px padding (px-3) so percent is never clipped
    expect(header?.className).toContain('px-3');

    // Middle city element must min-w-0 to truncate gracefully
    const centerGroup = container.querySelector('.min-w-0.text-center');
    expect(centerGroup).not.toBeNull();

    // Fixed elements must have shrink-0 to prevent collapse
    const shrinkElements = container.querySelectorAll('.shrink-0');
    expect(shrinkElements.length).toBeGreaterThanOrEqual(5);
  });

  it('toggles to /profile when avatar button is clicked from another page', () => {
    mockPathname.mockReturnValue('/map');
    render(<Hud />);
    const avatarBtn = screen.getByTestId('hud-avatar-btn');
    expect(avatarBtn.getAttribute('aria-label')).toBe('Open decker profile');
    fireEvent.click(avatarBtn);
    expect(mockPush).toHaveBeenCalledWith('/profile');
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('returns to the city fallback when profile was loaded directly', () => {
    mockPathname.mockReturnValue('/profile');
    render(<Hud />);
    const avatarBtn = screen.getByTestId('hud-avatar-btn');
    expect(avatarBtn.getAttribute('aria-label')).toBe('Exit decker profile');
    fireEvent.click(avatarBtn);
    expect(mockPush).toHaveBeenCalledWith('/map');
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('displays accent ring indicator on avatar slot when on /profile', () => {
    mockPathname.mockReturnValue('/profile');
    render(<Hud />);
    const avatarSlot = screen.getByTestId('hud-avatar-slot');
    expect(avatarSlot.className).toContain('ring-accent');
    expect(avatarSlot.className).toContain('border-accent');
  });

  it('separates settings button from avatar and opens settings drawer when clicked without navigating', () => {
    const openDrawerSpy = vi.spyOn(useSettingsStore.getState(), 'openDrawer');
    render(<Hud />);
    const settingsBtn = screen.getByTestId('hud-settings-btn');
    expect(settingsBtn).toBeDefined();
    expect(settingsBtn.getAttribute('aria-label')).toBe('Open settings');
    fireEvent.click(settingsBtn);
    expect(openDrawerSpy).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('provides accessible touch targets of at least 44px for both avatar and settings controls', () => {
    render(<Hud />);
    const avatarBtn = screen.getByTestId('hud-avatar-btn');
    const settingsBtn = screen.getByTestId('hud-settings-btn');
    expect(avatarBtn.className).toContain('min-h-[44px]');
    expect(settingsBtn.className).toMatch(/min-h-\[36px\]|min-h-\[44px\]/);
    expect(settingsBtn.className).toContain('before:');
  });
});

