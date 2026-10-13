import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TurfWarBoard } from '../TurfWarBoard';
import { defenseService } from '../../codemaker/defenseService';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Task 12: Turf War Board Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(defenseService, 'getAllDefenses').mockResolvedValue({
      defenses: {
        n2: {
          nodeId: 'n2',
          code: '4921',
          ice: 'Ghost',
          iceModifiers: ['Ghost'],
          dailyBudget: 250,
          finesEarned: 150,
          lastMaintainedAt: Date.now() - 3600000 * 2,
          lastCollectedAt: Date.now() - 3600000 * 2,
          ownerHandle: 'ZERO_COOL',
        },
      },
      activeAccount: 'ZERO_COOL',
    });
  });

  it('renders district cards with color and owner badges', async () => {
    await act(async () => {
      render(<TurfWarBoard />);
    });

    expect(screen.getByTestId('district-card-slums')).toBeInTheDocument();
    expect(screen.getByTestId('district-card-commercial')).toBeInTheDocument();

    const slumsBadge = screen.getByTestId('owner-badge-slums');
    expect(slumsBadge).toBeInTheDocument();
    expect(slumsBadge).toHaveTextContent(/KOVACS SYNDICATE/);

    const commBadge = screen.getByTestId('owner-badge-commercial');
    expect(commBadge).toBeInTheDocument();
    expect(commBadge).toHaveTextContent(/PHANTOM SYNDICATE/);
  });

  it('shows hourly yields for districts and nodes', async () => {
    await act(async () => {
      render(<TurfWarBoard />);
    });

    expect(screen.getByText('+480 cr/hr')).toBeInTheDocument();
    expect(screen.getByText('+920 cr/hr')).toBeInTheDocument();
  });

  it('shows owner badges and decay integrity for nodes', async () => {
    await act(async () => {
      render(<TurfWarBoard />);
    });

    const nodeBadge = screen.getByTestId('node-owner-badge-n2');
    expect(nodeBadge).toBeInTheDocument();
    expect(nodeBadge).toHaveTextContent(/OWNER: ZERO_COOL/);
  });

  it('renders Contest Node button for rival nodes and navigates to terminal', async () => {
    await act(async () => {
      render(<TurfWarBoard />);
    });

    // Node n4 is contested / rival
    const contestBtn = screen.getByTestId('contest-node-button-n4');
    expect(contestBtn).toBeInTheDocument();
    expect(contestBtn).toHaveTextContent(/CONTEST NODE/);

    act(() => {
      fireEvent.click(contestBtn);
    });

    expect(mockPush).toHaveBeenCalledWith('/terminal/n4');
  });

  it('renders Manage Defense button for owned nodes and navigates to codemaker', async () => {
    await act(async () => {
      render(<TurfWarBoard />);
    });

    const manageBtn = screen.getByTestId('manage-defense-button-n2');
    expect(manageBtn).toBeInTheDocument();
    expect(manageBtn).toHaveTextContent(/MANAGE DEFENSE/);

    act(() => {
      fireEvent.click(manageBtn);
    });

    expect(mockPush).toHaveBeenCalledWith('/codemaker?nodeId=n2');
  });
});
