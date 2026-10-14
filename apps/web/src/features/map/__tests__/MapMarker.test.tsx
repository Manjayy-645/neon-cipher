import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MapMarker } from '../MapMarker';
import { MarkerIcon } from '../../../components/ui/MarkerIcon';
import { useMapStore } from '../../../stores/map-store';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { GameNode } from '../nodeService';

describe('STYLE S5: Map Marker and MarkerIcon', () => {
  const baseNode: GameNode = {
    id: 'node-1',
    name: 'Union Relay',
    type: 'relay',
    district: 'slums',
    tier: 1,
    status: 'available',
    x: 45,
    y: 50,
    digits: 3,
    allowDuplicates: false,
    attempts: 8,
    timerSeconds: 90,
    bounty: 120,
    traceRisk: 10,
    requiresUnlock: false,
  };

  beforeEach(() => {
    useMapStore.setState({
      selectedNodeId: null,
      unlocks: { bridge: true },
    });
    useOnboardingStore.getState().reset();
  });

  describe('MarkerIcon Plate Shapes, Rings, and Colors', () => {
    it('renders available state: surface.panelLight fill, 4px accent ring, 52px plate', () => {
      const { container } = render(<MarkerIcon node={{ ...baseNode, status: 'available' }} />);
      const iconWrapper = container.querySelector('[data-testid="marker-icon"]');
      expect(iconWrapper).not.toBeNull();
      expect(iconWrapper?.getAttribute('style')).toContain('width: 52px');
      expect(iconWrapper?.getAttribute('style')).toContain('height: 52px');

      const circle = container.querySelector('svg circle');
      expect(circle).not.toBeNull();
      expect(circle?.getAttribute('stroke-width')).toBe('4');
      expect(circle?.getAttribute('stroke')).toContain('var(--accent');
      expect(circle?.getAttribute('fill')).toContain('var(--surface-panel-light');
    });

    it('renders owned state: accent fill, cream glyph, 2px ink outline', () => {
      const { container } = render(<MarkerIcon node={{ ...baseNode, status: 'owned' }} />);
      const circle = container.querySelector('svg circle');
      expect(circle).not.toBeNull();
      expect(circle?.getAttribute('stroke-width')).toBe('2');
      expect(circle?.getAttribute('stroke')).toContain('var(--ink');
      expect(circle?.getAttribute('fill')).toContain('var(--accent');

      // Glyph has cream filter
      const img = container.querySelector('img');
      expect(img?.getAttribute('style')).toContain('invert(93%)');
    });

    it('renders contested state: panelLight fill, 4px danger ring, DIAMOND shape (rotated square, radius 6)', () => {
      const { container } = render(<MarkerIcon node={{ ...baseNode, status: 'contested' }} />);
      const rect = container.querySelector('svg rect');
      expect(rect).not.toBeNull();
      expect(rect?.getAttribute('transform')).toContain('rotate(45 26 26)');
      expect(rect?.getAttribute('rx')).toBe('6');
      expect(rect?.getAttribute('ry')).toBe('6');
      expect(rect?.getAttribute('stroke-width')).toBe('4');
      expect(rect?.getAttribute('stroke')).toContain('var(--danger');
      expect(rect?.getAttribute('fill')).toContain('var(--surface-panel-light');
    });

    it('renders cooldown state: light warm gray fill, 3px gray ring', () => {
      const { container } = render(<MarkerIcon node={{ ...baseNode, status: 'cooldown' }} />);
      const circle = container.querySelector('svg circle');
      expect(circle).not.toBeNull();
      expect(circle?.getAttribute('stroke-width')).toBe('3');
      expect(circle?.getAttribute('stroke')).toContain('var(--status-cooldown');
      expect(circle?.getAttribute('fill')).toContain('var(--heat-track');
    });

    it('renders locked state: light gray fill, lock glyph, 80 percent opacity', () => {
      const { container } = render(<MarkerIcon node={baseNode} isLocked={true} />);
      const iconWrapper = container.querySelector('[data-testid="marker-icon"]');
      expect(iconWrapper?.className).toContain('opacity-80');

      const lock = container.querySelector('[data-testid="lock-glyph"]');
      expect(lock).not.toBeNull();
    });

    it('applies soft green glow shadow filter when selected', () => {
      const { container } = render(<MarkerIcon node={baseNode} isSelected={true} />);
      const iconWrapper = container.querySelector('[data-testid="marker-icon"]');
      expect(iconWrapper?.getAttribute('style')).toContain('drop-shadow(0 0 5px rgba(66,105,71,0.95))');
      expect(iconWrapper?.getAttribute('style')).toContain('drop-shadow(0 1px 1px rgba(40,30,20,0.45))');
    });
  });

  describe('MapMarker Component Interactions & Badges', () => {
    it('renders tier badge below, overlapping plate by 8px, 14px tall, radius 7px, padding 0 6px', () => {
      const { container } = render(<MapMarker node={baseNode} />);
      const badge = container.querySelector('.-mt-\\[8px\\]');
      expect(badge).not.toBeNull();
      expect(badge?.className).toContain('h-[14px]');
      expect(badge?.className).toContain('px-[6px]');
      expect(badge?.className).toContain('rounded-[7px]');
      expect(badge?.className).toContain('text-[10px]');
      expect(badge?.className).toContain('font-data');
      expect(badge?.className).toContain('font-semibold');
      expect(badge?.textContent).toBe('T1');
    });

    it('formats countdown as mm:ss in badge for cooldown nodes', () => {
      const { container: c1 } = render(
        <MapMarker node={{ ...baseNode, status: 'cooldown', timerSeconds: 90 }} />
      );
      expect(c1.querySelector('.-mt-\\[8px\\]')?.textContent).toBe('01:30');

      const { container: c2 } = render(
        <MapMarker node={{ ...baseNode, status: 'cooldown', timerSeconds: 45 }} />
      );
      expect(c2.querySelector('.-mt-\\[8px\\]')?.textContent).toBe('00:45');
    });

    it('displays LOCKED on badge when node is locked', () => {
      useMapStore.setState({ unlocks: { bridge: false } });
      const { container } = render(
        <MapMarker node={{ ...baseNode, requiresUnlock: true }} />
      );
      expect(container.querySelector('.-mt-\\[8px\\]')?.textContent).toBe('LOCKED');
    });

    it('turns badge accent when marker is selected', () => {
      useMapStore.setState({ selectedNodeId: 'node-1' });
      const { container } = render(<MapMarker node={baseNode} />);
      const badge = container.querySelector('.-mt-\\[8px\\]');
      expect(badge?.className).toContain('bg-accent');
      expect(badge?.className).toContain('text-white');
    });

    it('has focus-visible styles with 3px white ring plus 2px accent outline', () => {
      const { container } = render(<MapMarker node={baseNode} />);
      const button = container.querySelector('button');
      expect(button?.className).toContain('focus-visible:ring-[3px]');
      expect(button?.className).toContain('focus-visible:ring-white');
      expect(button?.className).toContain('focus-visible:shadow-[0_0_0_5px_var(--accent)]');
    });

    it('is tappable even when locked so player can learn why it is locked', () => {
      useMapStore.setState({ unlocks: { bridge: false } });
      render(<MapMarker node={{ ...baseNode, requiresUnlock: true }} />);
      const button = screen.getByRole('button');
      act(() => {
        fireEvent.click(button);
      });
      expect(useMapStore.getState().selectedNodeId).toBe('node-1');
    });

    it('highlights and keeps the onboarding corner-store target tappable', () => {
      useOnboardingStore.setState({ step: 'map.district', skipped: false });
      const targetNode = { ...baseNode, id: 'n4', name: 'Corner Store Register' };
      const otherNode = { ...baseNode, id: 'n1', name: 'Alley Relay' };
      render(
        <>
          <MapMarker node={targetNode} />
          <MapMarker node={otherNode} />
        </>
      );

      const target = screen.getByRole('button', { name: /Corner Store Register/i });
      expect(target).toHaveAttribute('data-tour', 'node-n4');
      expect(target).toHaveStyle({ opacity: '1', pointerEvents: 'auto' });
      expect(screen.getAllByRole('button')[1]).toHaveStyle({
        opacity: '0.45',
        pointerEvents: 'none',
      });

      act(() => {
        fireEvent.click(target);
      });
      expect(useMapStore.getState().activeNodeId).toBe('n4');
    });
  });
});
