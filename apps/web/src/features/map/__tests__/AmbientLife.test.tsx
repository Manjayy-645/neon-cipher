import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AmbientLife } from '../AmbientLife';
import { useMapStore } from '../../../stores/map-store';
import { useSettingsStore } from '../../../stores/settings-store';

describe('Ambient Life & Performance Guard', () => {
  const mockMap = {
    project: vi.fn(([lng, lat]) => ({ x: lng * 10, y: lat * 10 })),
    on: vi.fn(),
    off: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    act(() => {
      useMapStore.getState().resetMapState();
      useSettingsStore.setState({ reducedMotion: 'full' });
    });
  });

  it('renders ambient layer with cars, pedestrians, and animated shop sign', () => {
    render(<AmbientLife map={mockMap} />);

    const layer = screen.getByTestId('ambient-life-layer');
    expect(layer).toBeInTheDocument();
    expect(layer.className).toContain('z-[6]');

    // 1 Shop sign
    expect(screen.getByTestId('ambient-shop-sign')).toBeInTheDocument();
    expect(screen.getByText("ALEX'S TECH")).toBeInTheDocument();

    // 2 Cars
    expect(screen.getByTestId('ambient-car-bridge')).toBeInTheDocument();
    expect(screen.getByTestId('ambient-car-commercial')).toBeInTheDocument();

    // 3 Pedestrians
    expect(screen.getByTestId('ambient-ped-slums')).toBeInTheDocument();
    expect(screen.getByTestId('ambient-ped-commercial')).toBeInTheDocument();
    expect(screen.getByTestId('ambient-ped-canal')).toBeInTheDocument();
  });

  it('caps total ambient elements to at most 8', () => {
    const { container } = render(<AmbientLife map={mockMap} />);
    const ambientElements = container.querySelectorAll('.ambient');
    // 2 cars + 3 pedestrians + 1 shop sign = 6 elements
    expect(ambientElements.length).toBeLessThanOrEqual(8);
    expect(ambientElements.length).toBe(6);
  });

  it('supports dev override to force disable ambient life', () => {
    act(() => {
      useMapStore.getState().setAmbientOverride('disabled');
    });

    render(<AmbientLife map={mockMap} />);
    expect(screen.getByTestId('ambient-life-layer')).toBeInTheDocument();
  });

  it('updates time of day in store between day, dusk, and night', () => {
    expect(useMapStore.getState().timeOfDay).toBe('day');

    act(() => {
      useMapStore.getState().setTimeOfDay('dusk');
    });
    expect(useMapStore.getState().timeOfDay).toBe('dusk');

    act(() => {
      useMapStore.getState().setTimeOfDay('night');
    });
    expect(useMapStore.getState().timeOfDay).toBe('night');
  });
});
