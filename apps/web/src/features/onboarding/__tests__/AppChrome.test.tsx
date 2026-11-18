import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConditionalHud, ConditionalNav } from '../components/AppChrome';
import { useOnboardingStore } from '../onboardingStore';
import { useOverlayStore } from '@/stores/overlay-store';
import { useDuelStore } from '@/stores/duel-store';
import type { DuelSession } from '@/features/duel/types';

const route = vi.hoisted(() => ({ path: '/map' }));
vi.mock('next/navigation', () => ({ usePathname: () => route.path }));
vi.mock('@/features/hud/Hud', () => ({ Hud: () => <header>Global player controls</header> }));
vi.mock('@/app/Navigation', () => ({ Navigation: () => <nav>Global navigation</nav> }));

beforeEach(() => {
  route.path = '/map';
  useOnboardingStore.setState({ step: 'done', skipped: true, callsign: null });
  useOverlayStore.setState({ modals: [], focusedFlows: [] });
  useDuelStore.setState({ activeSession: null });
});
function Chrome() { return <><ConditionalHud /><ConditionalNav /></>; }
describe('focused game navigation', () => {
  it('keeps ordinary destinations accessible', () => {
    render(<Chrome />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
  it.each(['/terminal/n1', '/coop', '/duel/match/example'])('lets %s own its confirmed exit', (path) => {
    route.path = path;
    render(<Chrome />);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  });
  it('protects an active duel mounted on the Battle hub', () => {
    route.path = '/duel';
    useDuelStore.setState({ activeSession: { status: 'active' } as DuelSession });
    render(<Chrome />);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
  it('yields to a mission briefing or co-op console in Missions', () => {
    route.path = '/comms';
    useOverlayStore.setState({ focusedFlows: ['practice'] });
    render(<Chrome />);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
