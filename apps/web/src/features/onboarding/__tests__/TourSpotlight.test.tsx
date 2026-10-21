import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TourSpotlight } from '../components/TourSpotlight';

describe('TourSpotlight', () => {
  it('does not block page controls when its target is missing', () => {
    const onClick = vi.fn();

    render(
      <>
        <button type="button" onClick={onClick}>
          Open shop
        </button>
        <TourSpotlight
          targetSelector="missing-shop-control"
          line="Open the shop."
          speaker="nix"
        />
      </>
    );

    expect(
      screen.getByText(/I can’t see that control on this screen/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId('tour-spotlight-missing-target-backdrop')).toHaveClass(
      'pointer-events-none'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open shop' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('keeps a visible guide action usable when its target is missing', () => {
    const onTap = vi.fn();

    render(
      <TourSpotlight
        targetSelector="missing-shop-control"
        line="Open the shop."
        speaker="nix"
        isTapToAdvance
        onTap={onTap}
      />
    );

    fireEvent.click(screen.getByRole('region', { name: 'Tour Guide' }));
    expect(onTap).toHaveBeenCalledOnce();
  });

  it('keeps the guide above the navigation and positions it clear of the nav bar', async () => {
    const navigation = document.createElement('nav');
    navigation.setAttribute('aria-label', 'Main Navigation');
    navigation.getBoundingClientRect = () =>
      ({
        top: 680,
        bottom: 768,
        left: 0,
        right: 430,
        width: 430,
        height: 88,
        x: 0,
        y: 680,
        toJSON: () => ({}),
      }) as DOMRect;
    document.body.append(navigation);

    render(
      <TourSpotlight
        targetSelector="missing-shop-control"
        line="Open the shop."
        speaker="nix"
      />
    );

    const guide = screen.getByRole('region', { name: 'Tour Guide' });
    expect(guide).toHaveClass('z-terminal-modal');
    expect(screen.getByTestId('tour-spotlight-missing-target-backdrop')).toHaveClass(
      'z-40'
    );
    await waitFor(() => expect(guide).toHaveStyle({ bottom: '100px' }));
    navigation.remove();
  });

  it('renders prominent corner skip button and in-bubble skip button when onSkip is provided', () => {
    const onSkip = vi.fn();

    render(
      <TourSpotlight
        line="Type any three numbers."
        speaker="nix"
        showSkip={true}
        onSkip={onSkip}
      />
    );

    // Corner skip button
    const cornerBtn = screen.getByTestId('skip-tutorial-btn');
    expect(cornerBtn).toBeInTheDocument();
    expect(cornerBtn).toHaveTextContent(/SKIP TUTORIAL/i);

    // Bubble skip button
    const bubbleBtn = screen.getByTestId('spotlight-skip-bubble-btn');
    expect(bubbleBtn).toBeInTheDocument();
    expect(bubbleBtn).toHaveTextContent(/SKIP TUTORIAL/i);

    // Clicking corner skip button fires onSkip
    fireEvent.click(cornerBtn);
    expect(onSkip).toHaveBeenCalledTimes(1);

    // Clicking in-bubble skip button fires onSkip
    fireEvent.click(bubbleBtn);
    expect(onSkip).toHaveBeenCalledTimes(2);
  });
});
