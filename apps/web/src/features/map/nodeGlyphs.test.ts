import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  NODE_TYPES,
  GLYPH_BY_TYPE,
  FALLBACK_GLYPH,
  getGlyphForType,
  type NodeType,
} from './nodeService';

describe('Node Types and Icon Glyphs Integrity', () => {
  const iconsDir = path.resolve(process.cwd(), 'public/icons');

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('NODE_TYPES is exported as the single source of truth for node types', () => {
    expect(Array.isArray(NODE_TYPES)).toBe(true);
    expect(NODE_TYPES).toEqual([
      'atm',
      'vending',
      'register',
      'camera',
      'meter',
      'relay',
      'safe',
      'coinbox',
    ]);
  });

  it('NODE_TYPES does NOT include "router"', () => {
    // Explicitly enforce that "router" is not added without prior confirmation
    expect(NODE_TYPES).not.toContain('router');
  });

  it('GLYPH_BY_TYPE contains an entry for every type in NODE_TYPES', () => {
    NODE_TYPES.forEach((type) => {
      expect(GLYPH_BY_TYPE[type]).toBe(`glyph-${type}`);
    });
    expect(Object.keys(GLYPH_BY_TYPE).sort()).toEqual([...NODE_TYPES].sort());
  });

  it('every NODE_TYPES entry resolves to an existing file under public/icons', () => {
    NODE_TYPES.forEach((type) => {
      const glyphName = GLYPH_BY_TYPE[type];
      const filePath = path.join(iconsDir, `${glyphName}.svg`);
      const exists = fs.existsSync(filePath);
      expect(exists, `Expected icon file ${filePath} to exist for node type "${type}"`).toBe(true);
    });
  });

  it('fallback glyph resolves to an existing file under public/icons', () => {
    const fallbackPath = path.join(iconsDir, `${FALLBACK_GLYPH}.svg`);
    expect(
      fs.existsSync(fallbackPath),
      `Expected fallback icon file ${fallbackPath} to exist`
    ).toBe(true);
  });

  it('returns valid glyph asset names for all valid node types', () => {
    NODE_TYPES.forEach((type) => {
      expect(getGlyphForType(type)).toBe(`glyph-${type}`);
    });
  });

  describe('getGlyphForType error handling', () => {
    it('fails loudly in development/test when unknown type is provided', () => {
      vi.stubEnv('NODE_ENV', 'development');
      expect(() => getGlyphForType('router')).toThrow(/Unknown node type "router"/);
      expect(() => getGlyphForType('nonexistent_device')).toThrow(
        /Unknown node type "nonexistent_device"/
      );
      vi.unstubAllEnvs();
    });

    it('renders a neutral fallback glyph and logs an error in production instead of crashing', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.stubEnv('NODE_ENV', 'production');
      const glyph = getGlyphForType('router');
      expect(glyph).toBe(FALLBACK_GLYPH);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown node type "router"')
      );
      vi.unstubAllEnvs();
    });
  });
});
