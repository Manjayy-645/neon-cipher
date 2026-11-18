import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { Navigation, getTabForPathname } from './Navigation';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({ usePathname: vi.fn(() => '/map') }));
vi.mock('next/navigation', () => ({ usePathname: mocks.usePathname }));

describe('Paper navigation: discoverable game modes', () => {
  beforeEach(() => { mocks.usePathname.mockReturnValue('/map'); });

  it('renders the five actual destinations in player-priority order', () => {
    render(<Navigation />);
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav).toHaveClass('border-t', 'border-line', 'bg-panel');
    const links = Array.from(nav.querySelectorAll('a'));
    expect(links.map((link) => link.textContent?.trim())).toEqual(['City', 'Battle', 'Missions', 'Rig', 'Market']);
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/map', '/duel', '/comms', '/rig', '/market']);
  });

  it('links Missions to existing campaign and co-op rather than showing Coming soon', () => {
    render(<Navigation />);
    expect(screen.getByTestId('nav-item-comms')).toHaveAttribute('href', '/comms');
    expect(screen.getByTestId('nav-item-comms').tagName).toBe('A');
  });

  it('links Battle to a real route with an honest progression description', () => {
    render(<Navigation />);
    expect(screen.getByTestId('nav-item-duel')).toHaveAttribute('href', '/duel');
    expect(screen.getByTestId('nav-item-duel')).toHaveAccessibleName(/chapter 4/i);
  });

  it('maps terminal play to City and multiplayer match routes to Battle', () => {
    expect(getTabForPathname('/terminal/node-1')).toBe('map');
    expect(getTabForPathname('/duel/match/abc')).toBe('duel');
    expect(getTabForPathname('/coop')).toBe('comms');
    expect(getTabForPathname('/story')).toBe('comms');
  });

  it('keeps current-page semantics on the active destination', () => {
    mocks.usePathname.mockReturnValue('/duel');
    render(<Navigation />);
    expect(screen.getByTestId('nav-item-duel')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('nav-item-map')).not.toHaveAttribute('aria-current');
  });
});
