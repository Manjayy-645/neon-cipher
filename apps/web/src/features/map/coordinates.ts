// src/features/map/coordinates.ts

// We use an arbitrary coordinate space for the map image.
// Top-Left: [-10, 10]
// Bottom-Right: [10, -10]
export const MAP_BOUNDS: [number, number, number, number] = [-10, -10, 10, 10]; // [minLng, minLat, maxLng, maxLat]

export const IMAGE_CORNERS: [[number, number], [number, number], [number, number], [number, number]] = [
  [-10, 10],   // top-left
  [10, 10],    // top-right
  [10, -10],   // bottom-right
  [-10, -10]   // bottom-left
];

/**
 * Converts a percent coordinate (0-100) to map Longitude/Latitude.
 * X is left-to-right, Y is top-to-bottom.
 */
export function percentToLngLat(percentX: number, percentY: number): [number, number] {
  const lng = -10 + (percentX / 100) * 20;
  const lat = 10 - (percentY / 100) * 20;
  return [lng, lat];
}

/**
 * Converts map Longitude/Latitude back to a percent coordinate (0-100).
 */
export function lngLatToPercent(lng: number, lat: number): [number, number] {
  const percentX = ((lng + 10) / 20) * 100;
  const percentY = ((10 - lat) / 20) * 100;
  return [percentX, percentY];
}
