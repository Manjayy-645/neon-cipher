import { describe, it, expect } from 'vitest';
import {
  percentToLngLat,
  lngLatToPercent,
  IMAGE_CORNERS,
  MAP_BOUNDS,
} from './coordinates';
import { getGlyphForType, GLYPH_BY_TYPE, type NodeType } from './nodeService';

describe('Coordinates conversion (coordinates.ts)', () => {
  it('maps the four corners correctly to IMAGE_CORNERS with x-first and y-inverted', () => {
    // Top-left: (0%, 0%) -> [-10, 10]
    const topLeft = percentToLngLat(0, 0);
    expect(topLeft).toEqual(IMAGE_CORNERS[0]);
    expect(topLeft).toEqual([-10, 10]);

    // Top-right: (100%, 0%) -> [10, 10]
    const topRight = percentToLngLat(100, 0);
    expect(topRight).toEqual(IMAGE_CORNERS[1]);
    expect(topRight).toEqual([10, 10]);

    // Bottom-right: (100%, 100%) -> [10, -10]
    const bottomRight = percentToLngLat(100, 100);
    expect(bottomRight).toEqual(IMAGE_CORNERS[2]);
    expect(bottomRight).toEqual([10, -10]);

    // Bottom-left: (0%, 100%) -> [-10, -10]
    const bottomLeft = percentToLngLat(0, 100);
    expect(bottomLeft).toEqual(IMAGE_CORNERS[3]);
    expect(bottomLeft).toEqual([-10, -10]);
  });

  it('maps center (50%, 50%) to [0, 0]', () => {
    const center = percentToLngLat(50, 50);
    expect(center).toEqual([0, 0]);
  });

  it('verifies that output is [lng, lat] and y is inverted (0% is top edge, 100% is bottom edge)', () => {
    const [topLng, topLat] = percentToLngLat(50, 0);
    const [bottomLng, bottomLat] = percentToLngLat(50, 100);

    expect(topLng).toBe(0);
    expect(topLat).toBe(10); // Top latitude is positive (+10)

    expect(bottomLng).toBe(0);
    expect(bottomLat).toBe(-10); // Bottom latitude is negative (-10)

    expect(topLat).toBeGreaterThan(bottomLat);
  });

  it('performs lossless roundtrip between percentToLngLat and lngLatToPercent', () => {
    const testPoints = [
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100],
      [50, 50],
      [15, 20],
      [85, 85],
    ];

    for (const [px, py] of testPoints) {
      const [lng, lat] = percentToLngLat(px, py);
      const [roundPx, roundPy] = lngLatToPercent(lng, lat);
      expect(roundPx).toBeCloseTo(px);
      expect(roundPy).toBeCloseTo(py);
    }
  });

  it('encloses all image corners within MAP_BOUNDS', () => {
    const [minLng, minLat, maxLng, maxLat] = MAP_BOUNDS;
    for (const [lng, lat] of IMAGE_CORNERS) {
      expect(lng).toBeGreaterThanOrEqual(minLng);
      expect(lng).toBeLessThanOrEqual(maxLng);
      expect(lat).toBeGreaterThanOrEqual(minLat);
      expect(lat).toBeLessThanOrEqual(maxLat);
    }
  });
});

describe('Type to glyph lookup (nodeService.ts)', () => {
  const expectedTypes: Record<NodeType, string> = {
    atm: 'glyph-atm',
    vending: 'glyph-vending',
    register: 'glyph-register',
    camera: 'glyph-camera',
    meter: 'glyph-meter',
    relay: 'glyph-relay',
    safe: 'glyph-safe',
    coinbox: 'glyph-coinbox',
  };

  it.each(Object.entries(expectedTypes))('returns correct glyph for %s', (type, expectedGlyph) => {
    expect(getGlyphForType(type as NodeType)).toBe(expectedGlyph);
  });

  it('fails loudly for an unknown type and does not fall back to camera', () => {
    expect(() => getGlyphForType('unknown_type' as any)).toThrow(/Unknown node type/);
    expect(() => getGlyphForType('' as any)).toThrow(/Unknown node type/);
    expect(() => getGlyphForType('foo' as any)).toThrow(/Unknown node type/);
  });
});
