import { percentToLngLat } from './coordinates';

export interface CameraPreset {
  center: [number, number];
  zoom: number;
  padding?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export const DISTRICT_ZOOM_THRESHOLD = 3.5;
export const CAMERA_EASE_DURATION = 600; // between 500ms and 700ms

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export const CAMERA_PRESETS: Record<'overview' | 'slums' | 'commercial', CameraPreset> = {
  overview: {
    center: [0, 0],
    zoom: 3.0,
    padding: { top: 60, bottom: 70, left: 16, right: 16 },
  },
  slums: {
    center: percentToLngLat(27, 50),
    zoom: 4.2,
    padding: { top: 70, bottom: 80, left: 16, right: 16 },
  },
  commercial: {
    center: percentToLngLat(72, 50),
    zoom: 4.2,
    padding: { top: 70, bottom: 80, left: 16, right: 16 },
  },
};
