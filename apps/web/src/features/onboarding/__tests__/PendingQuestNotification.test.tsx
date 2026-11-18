import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PendingQuestNotification } from '../components/PendingQuestNotification';
import { useOnboardingStore } from '../onboardingStore';
import { Modal } from '@/components/ui/Modal';
import { useFocusedFlow, useOverlayStore } from '@/stores/overlay-store';
import { useMapStore } from '@/stores/map-store';
import { useCampaignStore } from '@/stores/campaign-store';

const mockPush = vi.fn();
let currentPathname = '/map';

vi.mock('next/navigation', () => ({
  usePathname: () => currentPathname,
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

describe('PendingQuestNotification Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMapStore.setState({ selectedNodeId: null, activeNodeId: null, sheetState: 'peek' });
    useOnboardingStore.getState().reset();
    currentPathname = '/map';
  });

  it('yields to the selected-node dossier on the city map', () => {
    useOnboardingStore.setState({ step: 'cold.intro', skipped: false });
    useMapStore.setState({ selectedNodeId: 'n1', sheetState: 'half' });
    render(<PendingQuestNotification />);
    expect(screen.queryByTestId('pending-quest-notification')).not.toBeInTheDocument();
  });

  it('renders pending quest notification when user is on a different page than the incomplete task', () => {
    useOnboardingStore.setState({
      step: 'cold.intro',
      skipped: false,
    });
    currentPathname = '/map';

    render(<PendingQuestNotification />);

    const notification = screen.getByTestId('pending-quest-notification');
    expect(notification).toBeInTheDocument();
    expect(screen.getByText(/PENDING QUEST/i)).toBeInTheDocument();
    expect(screen.getByText('Tutorial: Breach Soda Machine')).toBeInTheDocument();
    expect(screen.getByText(/Target: Rusty Soda Machine/i)).toBeInTheDocument();
  });

  it('does not render when user is on the quest route', () => {
    useOnboardingStore.setState({
      step: 'cold.intro',
      skipped: false,
    });
    currentPathname = '/terminal/tutorial-soda';

    const { container } = render(<PendingQuestNotification />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render on splash page', () => {
    useOnboardingStore.setState({
      step: 'cold.intro',
      skipped: false,
    });
    currentPathname = '/';

    const { container } = render(<PendingQuestNotification />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render when onboarding is done and no campaign chapter is active', () => {
    useOnboardingStore.setState({
      step: 'done',
      skipped: false,
    });
    useCampaignStore.setState({
      activeChapterId: null,
    });
    currentPathname = '/map';

    const { container } = render(<PendingQuestNotification />);
    expect(container.firstChild).toBeNull();
  });

  it('navigates to quest target route when RESUME button is clicked', () => {
    useOnboardingStore.setState({
      step: 'ch2.hack',
      skipped: false,
    });
    currentPathname = '/market';

    render(<PendingQuestNotification />);

    const actionBtn = screen.getByTestId('pending-quest-action');
    fireEvent.click(actionBtn);

    expect(mockPush).toHaveBeenCalledWith('/terminal/n4');
  });

  it('dismisses notification when dismiss button is clicked', () => {
    useOnboardingStore.setState({
      step: 'market.buy',
      skipped: false,
    });
    currentPathname = '/map';

    render(<PendingQuestNotification />);

    expect(screen.getByTestId('pending-quest-notification')).toBeInTheDocument();

    const dismissBtn = screen.getByTestId('pending-quest-dismiss');
    fireEvent.click(dismissBtn);

    expect(screen.queryByTestId('pending-quest-notification')).toBeNull();
  });

  it('renders active campaign chapter quest when onboarding is done', () => {
    useOnboardingStore.setState({
      step: 'done',
      skipped: true,
      callsign: 'ZERO_COOL',
    });
    useCampaignStore.setState({
      activeChapterId: 'chapter-2',
      chapters: {
        'chapter-2': { id: 'chapter-2', status: 'active' },
      },
    });
    currentPathname = '/market';

    render(<PendingQuestNotification />);

    expect(screen.getByTestId('pending-quest-notification')).toBeInTheDocument();
    expect(screen.getByText('Chapter 02: The Corner Store Job')).toBeInTheDocument();
    expect(screen.getByText(/Target: Market Register/i)).toBeInTheDocument();
  });

  it('positions notification above bottom nav bar with pointer-events-auto on RESUME button', () => {
    useOnboardingStore.setState({
      step: 'ch2.hack',
      skipped: false,
    });
    currentPathname = '/map';

    render(<PendingQuestNotification />);

    const notification = screen.getByTestId('pending-quest-notification');
    expect(notification).toBeInTheDocument();
    expect(notification).toHaveStyle({
      bottom: 'calc(var(--nav-bottom-height, 64px) + env(safe-area-inset-bottom, 0px) + 8px)',
    });
    expect(notification.className).toContain('z-reminder');

    const resumeBtn = screen.getByTestId('pending-quest-action');
    expect(resumeBtn.className).toContain('pointer-events-auto');

    fireEvent.click(resumeBtn);
    expect(mockPush).toHaveBeenCalledWith('/terminal/n4');
  });
  it.each(['/terminal/n4', '/terminal/tutorial-soda', '/coop', '/duel/match/qa'])('suppresses reminders on focused route %s', (path) => {
    useOnboardingStore.setState({ step: 'market.buy', skipped: false });
    currentPathname = path;
    render(<PendingQuestNotification />);
    expect(screen.queryByTestId('pending-quest-notification')).not.toBeInTheDocument();
  });

  it('suppresses during a modal and resumes when the last modal closes', () => {
    useOnboardingStore.setState({ step: 'market.buy', skipped: false });
    const { rerender } = render(<PendingQuestNotification />);
    expect(screen.getByTestId('pending-quest-notification')).toBeInTheDocument();
    rerender(<><PendingQuestNotification /><Modal label="Purchase" onClose={() => {}}>Details</Modal></>);
    expect(screen.queryByTestId('pending-quest-notification')).not.toBeInTheDocument();
    rerender(<PendingQuestNotification />);
    expect(screen.getByTestId('pending-quest-notification')).toBeInTheDocument();
    expect(useOverlayStore.getState().modals).toHaveLength(0);
  });

  it('suppresses on an in-page briefing/co-op flow and restores on exit', () => {
    function Briefing() { useFocusedFlow(); return <p>Accept Assignment</p>; }
    useOnboardingStore.setState({ step: 'market.buy', skipped: false });
    currentPathname = '/comms';
    const { rerender } = render(<><PendingQuestNotification /><Briefing /></>);
    expect(screen.queryByTestId('pending-quest-notification')).not.toBeInTheDocument();
    rerender(<PendingQuestNotification />);
    expect(screen.getByTestId('pending-quest-notification')).toBeInTheDocument();
  });

});
