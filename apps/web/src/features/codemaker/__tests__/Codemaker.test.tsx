import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Codemaker } from '../Codemaker';
import { defenseService } from '../defenseService';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Task 12: Codemaker Editor Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(defenseService, 'getDefense').mockResolvedValue({
      defense: {
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
    });
    vi.spyOn(defenseService, 'saveDefense').mockResolvedValue({
      success: true,
      defense: {
        nodeId: 'n2',
        code: '7193',
        ice: 'Liar',
        iceModifiers: ['Liar'],
        dailyBudget: 300,
        finesEarned: 150,
        lastMaintainedAt: Date.now(),
        lastCollectedAt: Date.now(),
        ownerHandle: 'ZERO_COOL',
      },
    });
    vi.spyOn(defenseService, 'claimYield').mockResolvedValue({
      success: true,
      amount: 150,
      balance: 12650,
    });
    vi.spyOn(defenseService, 'switchAccount').mockResolvedValue({
      success: true,
      activeAccount: 'PHREAK',
    });
  });

  it('renders master secret code inputs, difficulty meter, and defense budget', async () => {
    await act(async () => {
      render(<Codemaker />);
    });

    expect(screen.getByText('Master Secret Code')).toBeInTheDocument();
    expect(screen.getByTestId('code-inputs-container')).toBeInTheDocument();
    expect(screen.getByTestId('difficulty-meter')).toBeInTheDocument();
    expect(screen.getByText('Defense Budget & Decay')).toBeInTheDocument();
    expect(screen.getByTestId('income-cap-container')).toBeInTheDocument();
    expect(screen.getByTestId('fines-earned-container')).toBeInTheDocument();
  });

  it('shows weak code warning when sequential digits like 1234 are entered', async () => {
    await act(async () => {
      render(<Codemaker />);
    });

    // Enter 1, 2, 3, 4
    const input0 = screen.getByTestId('code-digit-input-0');
    const input1 = screen.getByTestId('code-digit-input-1');
    const input2 = screen.getByTestId('code-digit-input-2');
    const input3 = screen.getByTestId('code-digit-input-3');

    act(() => {
      fireEvent.change(input0, { target: { value: '1' } });
      fireEvent.change(input1, { target: { value: '2' } });
      fireEvent.change(input2, { target: { value: '3' } });
      fireEvent.change(input3, { target: { value: '4' } });
    });

    expect(screen.getByTestId('weak-code-warning')).toBeInTheDocument();
    expect(screen.getByTestId('weak-code-warning')).toHaveTextContent(/(sequence|dictionary|weak)/i);

    // Deploy button should be disabled for weak code
    const deployBtn = screen.getByTestId('deploy-defense-button');
    expect(deployBtn).toBeDisabled();
  });

  it('toggles ICE modifiers and updates active modifiers', async () => {
    await act(async () => {
      render(<Codemaker />);
    });

    const liarBtn = screen.getByTestId('ice-toggle-liar');
    act(() => {
      fireEvent.click(liarBtn);
    });

    expect(liarBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('displays income cap and allows claiming turf yield', async () => {
    await act(async () => {
      render(<Codemaker />);
    });

    const claimBtn = screen.getByTestId('claim-yield-button');
    expect(claimBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(claimBtn);
    });

    expect(defenseService.claimYield).toHaveBeenCalledWith('n2');
  });

  it('deploys defense to server when valid code is submitted', async () => {
    await act(async () => {
      render(<Codemaker />);
    });

    // Enter non-weak code 7193
    act(() => {
      fireEvent.change(screen.getByTestId('code-digit-input-0'), { target: { value: '7' } });
      fireEvent.change(screen.getByTestId('code-digit-input-1'), { target: { value: '1' } });
      fireEvent.change(screen.getByTestId('code-digit-input-2'), { target: { value: '9' } });
      fireEvent.change(screen.getByTestId('code-digit-input-3'), { target: { value: '3' } });
    });

    expect(screen.queryByTestId('weak-code-warning')).not.toBeInTheDocument();

    const deployBtn = screen.getByTestId('deploy-defense-button');
    expect(deployBtn).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(deployBtn);
    });

    expect(defenseService.saveDefense).toHaveBeenCalled();
  });

  it('allows switching active decker account', async () => {
    await act(async () => {
      render(<Codemaker />);
    });

    const switchBtn = screen.getByTestId('account-switch-button');
    await act(async () => {
      fireEvent.click(switchBtn);
    });

    expect(defenseService.switchAccount).toHaveBeenCalledWith('PHREAK');
  });
});
