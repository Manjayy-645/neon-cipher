import { describe, it, expect } from 'vitest';
import { getMapStyle, mapStyle, type MapTheme } from './style';
import designTokens from '@neon-cipher/tokens/design-tokens.json';

/**
 * Recursively scans an object or array to find any string values containing 'var('.
 */
function findCssVarOccurrences(obj: unknown, path = ''): string[] {
  const violations: string[] = [];

  if (typeof obj === 'string') {
    if (obj.includes('var(')) {
      violations.push(`${path}: "${obj}"`);
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      violations.push(...findCssVarOccurrences(item, `${path}[${index}]`));
    });
  } else if (obj !== null && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      violations.push(...findCssVarOccurrences(value, currentPath));
    }
  }

  return violations;
}

describe('MapLibre style (apps/web/src/features/map/style.ts)', () => {
  const themes: (MapTheme | undefined)[] = ['day', 'dusk', 'night', 'default', undefined];

  it.each(themes)('ensures getMapStyle(%s) does not contain any "var(" in the style', (theme) => {
    const style = getMapStyle(theme);
    const violations = findCssVarOccurrences(style);

    expect(violations).toEqual([]);
  });

  it('ensures static mapStyle export does not contain any "var("', () => {
    const violations = findCssVarOccurrences(mapStyle);
    expect(violations).toEqual([]);
  });

  it('ensures background layer uses literal hex colors from design-tokens.json', () => {
    const dayStyle = getMapStyle('day');
    const nightStyle = getMapStyle('night');

    const dayBgLayer = dayStyle.layers.find((layer) => layer.id === 'background');
    const nightBgLayer = nightStyle.layers.find((layer) => layer.id === 'background');

    expect(dayBgLayer).toBeDefined();
    expect(dayBgLayer?.paint).toBeDefined();
    // @ts-expect-error background paint background-color
    expect(dayBgLayer?.paint?.['background-color']).toBe(designTokens.color.surface.panel);
    // @ts-expect-error background paint background-color
    expect(dayBgLayer?.paint?.['background-color']).toMatch(/^#[0-9a-fA-F]{6}$/);

    expect(nightBgLayer).toBeDefined();
    expect(nightBgLayer?.paint).toBeDefined();
    // @ts-expect-error background paint background-color
    expect(nightBgLayer?.paint?.['background-color']).toBe(designTokens.color.surface.dark);
    // @ts-expect-error background paint background-color
    expect(nightBgLayer?.paint?.['background-color']).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('fails if a CSS variable string is injected into the style specification', () => {
    const dummyStyleWithVar = {
      version: 8,
      layers: [
        {
          id: 'background',
          paint: {
            'background-color': 'var(--ink)',
          },
        },
      ],
    };

    const violations = findCssVarOccurrences(dummyStyleWithVar);
    expect(violations).toEqual(['layers[0].paint.background-color: "var(--ink)"']);
  });
});
