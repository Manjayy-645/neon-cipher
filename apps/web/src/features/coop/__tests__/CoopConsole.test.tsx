import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CoopConsole } from '../CoopConsole';

describe('Task 12: Co-op Heist Console Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders shared countdown timer and both Alpha and Beta consoles in split view', () => {
    render(<CoopConsole />);

    expect(screen.getByTestId('shared-countdown')).toBeInTheDocument();
    expect(screen.getByTestId('shared-countdown')).toHaveTextContent(/CREW TIME: 03:00/);

    expect(screen.getByTestId('role-alpha-container')).toBeInTheDocument();
    expect(screen.getByTestId('role-beta-container')).toBeInTheDocument();
    expect(screen.getByTestId('coop-comms-feed')).toBeInTheDocument();
  });

  it('switches between split, alpha, and beta role views', () => {
    render(<CoopConsole />);

    const alphaBtn = screen.getByTestId('view-alpha-button');
    act(() => {
      fireEvent.click(alphaBtn);
    });
    expect(screen.getByTestId('role-alpha-container')).toBeInTheDocument();
    expect(screen.queryByTestId('role-beta-container')).not.toBeInTheDocument();

    const betaBtn = screen.getByTestId('view-beta-button');
    act(() => {
      fireEvent.click(betaBtn);
    });
    expect(screen.queryByTestId('role-alpha-container')).not.toBeInTheDocument();
    expect(screen.getByTestId('role-beta-container')).toBeInTheDocument();
  });

  it('cracking a Beta stage grants Alpha an eliminated dead digit or extra attempt', () => {
    render(<CoopConsole />);

    // Stage 1 secret is '381', reward is remove dead digit
    const betaInput = screen.getByTestId('beta-guess-input');
    const betaSubmit = screen.getByTestId('beta-submit-button');

    act(() => {
      fireEvent.change(betaInput, { target: { value: '381' } });
      fireEvent.click(betaSubmit);
    });

    // Verify support buff eliminated dead digit banner appears for Alpha
    expect(screen.getByTestId('eliminated-digits-banner')).toBeInTheDocument();
    expect(screen.getByTestId('eliminated-digits-banner')).toHaveTextContent(/SUPPORT BUFF/);
  });

  it('cracking Stage 2 grants Alpha an extra attempt', () => {
    render(<CoopConsole />);

    // Crack stage 1 first
    act(() => {
      fireEvent.change(screen.getByTestId('beta-guess-input'), { target: { value: '381' } });
      fireEvent.click(screen.getByTestId('beta-submit-button'));
    });

    const initialAttempts = screen.getByTestId('alpha-attempts-left').textContent;

    // Crack stage 2 ('519')
    act(() => {
      fireEvent.change(screen.getByTestId('beta-guess-input'), { target: { value: '519' } });
      fireEvent.click(screen.getByTestId('beta-submit-button'));
    });

    expect(screen.getByTestId('alpha-attempts-left')).toHaveTextContent('5 ATTEMPTS LEFT');
  });

  it('Alpha cracking the master code wins the heist', () => {
    render(<CoopConsole />);

    // Alpha master code is 7294
    const alphaInput = screen.getByTestId('alpha-guess-input');
    const alphaSubmit = screen.getByTestId('alpha-submit-button');

    act(() => {
      fireEvent.change(alphaInput, { target: { value: '7294' } });
      fireEvent.click(alphaSubmit);
    });

    expect(screen.getByTestId('heist-won-banner')).toBeInTheDocument();
    expect(screen.getByTestId('heist-won-banner')).toHaveTextContent(/VAULT BREACH SUCCESSFUL/);
  });
});
