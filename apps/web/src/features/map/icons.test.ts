import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Icon SVG Normalization (public/icons)', () => {
  const iconsDir = path.resolve(__dirname, '../../../public/icons');

  function getSvgFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getSvgFiles(fullPath));
      } else if (entry.name.endsWith('.svg')) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const svgFiles = getSvgFiles(iconsDir);

  it('found svg files in public/icons', () => {
    expect(svgFiles.length).toBeGreaterThan(0);
  });

  describe.each(svgFiles.map(f => [path.relative(iconsDir, f), f]))(
    'Icon: %s',
    (_relPath, fullPath) => {
      const content = fs.readFileSync(fullPath, 'utf8');
      const svgMatch = content.match(/<svg([^>]*)>/i);

      it('has a valid <svg> tag', () => {
        expect(svgMatch).not.toBeNull();
      });

      it('does NOT have fixed width or height attributes', () => {
        const attrs = svgMatch ? svgMatch[1] : '';
        const widthMatch = attrs.match(/\bwidth=["']?([^"'\s>]+)/i);
        const heightMatch = attrs.match(/\bheight=["']?([^"'\s>]+)/i);
        expect(widthMatch).toBeNull();
        expect(heightMatch).toBeNull();
      });

      it('has a valid viewBox attribute', () => {
        const attrs = svgMatch ? svgMatch[1] : '';
        const viewBoxMatch = attrs.match(/\bviewBox=["']([^"']+)["']/i);
        expect(viewBoxMatch).not.toBeNull();
        if (viewBoxMatch) {
          const parts = viewBoxMatch[1].trim().split(/[\s,]+/).map(Number);
          expect(parts).toHaveLength(4);
          const [minX, minY, vbWidth, vbHeight] = parts;
          expect(Number.isFinite(minX)).toBe(true);
          expect(Number.isFinite(minY)).toBe(true);
          expect(vbWidth).toBeGreaterThan(0);
          expect(vbHeight).toBeGreaterThan(0);
        }
      });

      it('has preserveAspectRatio="xMidYMid meet"', () => {
        const attrs = svgMatch ? svgMatch[1] : '';
        expect(attrs).toContain('preserveAspectRatio="xMidYMid meet"');
      });
    }
  );
});
