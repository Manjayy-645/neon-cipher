import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  CHARACTER_PORTRAITS,
  PLAYER_AVATARS,
  CHARACTERS,
} from '@neon-cipher/game-rules';

describe('Character Portraits Verification', () => {
  const publicDir = path.resolve(__dirname, '../../../../public');
  const portraitsDir = path.join(publicDir, 'Character portraits');

  it('directory public/Character portraits exists', () => {
    expect(fs.existsSync(portraitsDir)).toBe(true);
  });

  it('verifies all CHARACTER_PORTRAITS correspond to existing files', () => {
    Object.entries(CHARACTER_PORTRAITS).forEach(([name, relativePath]) => {
      // relativePath is like '/Character portraits/Nix.png'
      const filePath = path.join(publicDir, relativePath.replace(/^\//, ''));
      expect(fs.existsSync(filePath), `Portrait file for ${name} at ${filePath} should exist`).toBe(true);
    });
  });

  it('verifies all PLAYER_AVATARS correspond to existing files and total 6 avatars', () => {
    expect(PLAYER_AVATARS).toHaveLength(6);
    PLAYER_AVATARS.forEach((av) => {
      const filePath = path.join(publicDir, av.url.replace(/^\//, ''));
      expect(fs.existsSync(filePath), `Avatar file for ${av.name} at ${filePath} should exist`).toBe(true);
    });
  });

  it('verifies CHARACTERS configs have assigned character portraits', () => {
    expect(CHARACTERS.nix.portrait).toBe(CHARACTER_PORTRAITS.nix);
    expect(CHARACTERS.glitch.portrait).toBe(CHARACTER_PORTRAITS.glitch);
    expect(CHARACTERS.alex.portrait).toBe(CHARACTER_PORTRAITS.alex);
    expect(CHARACTERS.null_byte.portrait).toBe(CHARACTER_PORTRAITS.null_byte);
  });
});
