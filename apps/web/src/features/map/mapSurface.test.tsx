import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import designTokens from '@neon-cipher/tokens/design-tokens.json';
import { getMapStyle, mapStyle } from './style';
import { DistrictLabel } from './DistrictLabel';
import { MapOverlay } from './MapOverlay';
import MapEngine from './MapEngine';
import { useMapStore } from '../../stores/map-store';
import { GameNode } from './nodeService';

// Mock maplibre-gl Map instance
const mockMap = {
  project: vi.fn(([lng, lat]: [number, number]) => ({
    x: (lng + 10) * 20,
    y: (10 - lat) * 20,
  })),
  on: vi.fn(),
  off: vi.fn(),
  touchZoomRotate: {
    disableRotation: vi.fn(),
  },
  getZoom: vi.fn(() => 3),
  getCenter: vi.fn(() => ({ lng: 0, lat: 0 })),
  flyTo: vi.fn(),
  jumpTo: vi.fn(),
  resize: vi.fn(),
  remove: vi.fn(),
} as any;

process.env.NEXT_PUBLIC_FEATURE_DEV_OVERLAY = 'true';

vi.mock('maplibre-gl', () => {
  return {
    Map: function () {
      return mockMap;
    },
    setWorkerUrl: vi.fn(),
  };
});

vi.mock('../../lib/flags', () => ({
  isFeatureEnabled: vi.fn((flag: string) => flag === 'devOverlay' || flag === 'map'),
}));

vi.mock('@/lib/flags', () => ({
  isFeatureEnabled: vi.fn((flag: string) => flag === 'devOverlay' || flag === 'map'),
}));

const mockNodes = [
  {
    id: 's1',
    name: 'Rust Lane Vending',
    type: 'vending',
    tier: 1,
    district: 'slums',
    x: 20,
    y: 12,
    status: 'available',
    requiresUnlock: false,
  },
  {
    id: 'c1',
    name: 'Meridian Ave ATM',
    type: 'atm',
    tier: 2,
    district: 'commercial',
    x: 73,
    y: 22,
    status: 'available',
    requiresUnlock: true,
  },
] as unknown as GameNode[];

describe('STYLE S4: Map surface requirements', () => {
  beforeEach(() => {
    act(() => {
      useMapStore.setState({
        unlocks: { bridge: false },
        selectedNodeId: null,
        sheetHeight: 280,
      });
    });
    vi.clearAllMocks();
  });

  describe('1. Map fallback background & ground palette', () => {
    it('uses resolved hex from design-tokens.json for background layer, never CSS var', () => {
      const dayStyle = getMapStyle('day');
      const dayBgLayer = dayStyle.layers.find((layer) => layer.id === 'background');
      expect(dayBgLayer).toBeDefined();
      // @ts-expect-error background paint
      const dayBgColor = dayBgLayer?.paint?.['background-color'];
      expect(dayBgColor).toBe(designTokens.color.surface.panel);
      expect(dayBgColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(dayBgColor).not.toContain('var(');

      const nightStyle = getMapStyle('night');
      const nightBgLayer = nightStyle.layers.find((layer) => layer.id === 'background');
      expect(nightBgLayer).toBeDefined();
      // @ts-expect-error background paint
      const nightBgColor = nightBgLayer?.paint?.['background-color'];
      expect(nightBgColor).toBe(designTokens.color.surface.dark);
      expect(nightBgColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(nightBgColor).not.toContain('var(');
    });

    it('MapEngine root container fills space (flex-1) with bg-panel ground token', () => {
      const { container } = render(<MapEngine />);
      const root = container.firstElementChild as HTMLElement;
      expect(root).not.toBeNull();
      expect(root.className).toContain('flex-1');
      expect(root.className).toContain('bg-panel');
      expect(root.className).toContain('w-full');
      expect(root.className).toContain('h-full');
    });
  });

  describe('2. Locked-zone haze overlay', () => {
    it('renders on the Commercial side (right-0, w-1/2) with pointer-events-none', () => {
      render(<MapEngine />);
      const haze = screen.getByTestId('locked-zone-haze');
      expect(haze).toBeDefined();
      expect(haze.className).toContain('right-0');
      expect(haze.className).toContain('w-1/2');
      expect(haze.className).toContain('pointer-events-none');
    });

    it('ramps in over the first 14% of width using token overlay.hazeLocked (#919190)', () => {
      render(<MapEngine />);
      const haze = screen.getByTestId('locked-zone-haze');
      const backgroundStyle = haze.style.background;
      expect(backgroundStyle).toContain('linear-gradient');
      expect(backgroundStyle).toContain('transparent 0%');
      expect(backgroundStyle).toContain('14%');
      expect(backgroundStyle).toContain(designTokens.color.overlay.hazeLocked); // #919190
    });

    it('is at about 55 to 70 percent opacity when locked and fades out over 1.2 seconds when unlocked', () => {
      act(() => {
        useMapStore.setState({ unlocks: { bridge: false } });
      });
      const { rerender } = render(<MapEngine />);
      const haze = screen.getByTestId('locked-zone-haze');
      expect(parseFloat(haze.style.opacity)).toBeGreaterThanOrEqual(0.55);
      expect(parseFloat(haze.style.opacity)).toBeLessThanOrEqual(0.70);
      expect(haze.className).toContain('duration-[1200ms]');

      // Unlock bridge
      act(() => {
        useMapStore.setState({ unlocks: { bridge: true } });
      });
      rerender(<MapEngine />);
      expect(haze.style.opacity).toBe('0');
    });
  });

  describe('3. District labels on the map', () => {
    it('renders serif UPPERCASE 16-18px, ink color, letter-spacing 1px on a pill of surface.panelLight at 75% opacity, radius 999, padding 4px 12px with no colored boxes', () => {
      render(<DistrictLabel name="Slums" />);
      const label = screen.getByTestId('district-label');
      expect(label).toBeDefined();
      expect(label.textContent).toBe('Slums');

      // Serif uppercase
      expect(label.className).toContain('font-heading');
      expect(label.className).toContain('uppercase');

      // 16 to 18px
      expect(label.className).toContain('text-[16px]');

      // ink color
      expect(label.className).toContain('text-ink');

      // letter-spacing 1px
      expect(label.className).toContain('tracking-[1px]');

      // pill of surface.panelLight at 75% opacity
      expect(label.className).toContain('bg-panel-light/75');
      expect(label.style.backgroundColor).toBe('rgba(239, 231, 218, 0.75)');

      // radius 999
      expect(label.className).toContain('rounded-pill');

      // padding 4px 12px
      expect(label.className).toContain('py-[4px]');
      expect(label.className).toContain('px-[12px]');

      // pointer-events none
      expect(label.className).toContain('pointer-events-none');
    });

    it('shows district labels when zoomed out (< 3.5), and fades them out when zoomed in past district view (>= 3.5)', () => {
      // Zoom 3: District view
      const { rerender } = render(<MapOverlay map={mockMap} nodes={mockNodes} zoom={3} />);
      expect(screen.getByTestId('district-container-S')).toBeDefined();
      expect(screen.getByTestId('district-container-C')).toBeDefined();
      expect(screen.getAllByText('Slums').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Commercial').length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByTestId('marker-s1')).toBeNull();

      // Zoom 4: Zoomed in past district view
      rerender(<MapOverlay map={mockMap} nodes={mockNodes} zoom={4} />);
      // Markers are rendered
      expect(screen.getByTestId('marker-s1')).toBeDefined();
      // District container either fades out (opacity: 0) or unmounts
      const exitingDistrict = screen.queryByTestId('district-container-S');
      if (exitingDistrict) {
        expect(exitingDistrict.style.opacity).toBe('0');
      }
    });
  });

  describe('4. Dev overlays (zoom, fps)', () => {
    it('uses label type style, panel light, 1px line, radius 6, top-left', () => {
      render(<MapEngine />);
      const devOverlay = screen.getByTestId('dev-overlay');
      expect(devOverlay).toBeDefined();

      // top-left
      expect(devOverlay.className).toContain('top-2');
      expect(devOverlay.className).toContain('left-2');

      // panel light
      expect(devOverlay.className).toContain('bg-panel-light');

      // 1px line
      expect(devOverlay.className).toContain('border');
      expect(devOverlay.className).toContain('border-line');

      // radius 6
      expect(devOverlay.className).toContain('rounded-sm');

      // label type style (mono, uppercase, letter-spacing 1.5px, muted ink)
      expect(devOverlay.className).toContain('font-data');
      expect(devOverlay.className).toContain('text-label');
      expect(devOverlay.className).toContain('uppercase');
      expect(devOverlay.className).toContain('tracking-[1.5px]');
      expect(devOverlay.className).toContain('text-ink-muted');

      // shows zoom and fps
      expect(devOverlay.textContent).toContain('ZOOM:');
      expect(devOverlay.textContent).toContain('FPS:');
    });
  });

  describe('5. Optional grain overlay', () => {
    it('renders at under 4 percent opacity behind markers pointer-events none', () => {
      render(<MapEngine />);
      const grain = screen.getByTestId('grain-overlay');
      expect(grain).toBeDefined();
      expect(grain.className).toContain('pointer-events-none');
      expect(grain.className).toContain('z-[5]');

      const opacity = parseFloat((grain as HTMLElement).style.opacity);
      expect(opacity).toBeLessThan(0.04);
      expect(opacity).toBeGreaterThan(0);
    });
  });
});

