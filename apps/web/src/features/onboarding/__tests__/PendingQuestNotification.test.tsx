import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PendingQuestNotification } from '../components/PendingQuestNotification';
import { useOnboardingStore } from '../onboardingStore';
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
    useOnboardingStore.getState().reset();
    currentPathname = '/map';
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
});
