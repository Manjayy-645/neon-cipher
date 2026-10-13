import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { NixBubble } from '../NixBubble';
import { usePlayerStore } from '../../../stores/player-store';
import { useMapStore } from '../../../stores/map-store';

describe('STYLE S8: Nix Guide Bubble', () => {
  beforeEach(() => {
    usePlayerStore.setState({
      nixDismissed: false,
    });
    useMapStore.setState({
      selectedNodeId: 'node-atm-1',
    });
  });

  it('renders panel with surface.panelLight, 1px line, radius 14, card shadow, padding 8px 10px, gap 10px', () => {
    render(<NixBubble isOpen={true} message="Test message for Nix" />);
    const region = screen.getByRole('region', { name: 'Nix Guide' });
    expect(region).toBeDefined();

    const card = region.querySelector('.bg-panel-light');
    expect(card).not.toBeNull();
    expect(card?.className).toContain('border');
    expect(card?.className).toContain('border-line');
    expect(card?.className).toContain('rounded-[14px]');
    expect(card?.className).toContain('shadow-card');
    expect(card?.className).toContain('px-[10px]');
    expect(card?.className).toContain('py-[8px]');
    expect(card?.className).toContain('gap-[10px]');
  });

  it('renders 36px round portrait slot with 1px line, fill accent, and initial N in serif', () => {
    render(<NixBubble isOpen={true} message="Signal stable. Lock is local." />);
    const portrait = screen.getByTestId('nix-portrait');
    expect(portrait).toBeDefined();
    expect(portrait.className).toContain('w-[36px]');
    expect(portrait.className).toContain('h-[36px]');
    expect(portrait.className).toContain('rounded-full');
    expect(portrait.className).toContain('border');
    expect(portrait.className).toContain('border-line');
    expect(portrait.className).toContain('bg-accent');

    const initial = portrait.querySelector('span');
    expect(initial?.textContent).toBe('N');
    expect(initial?.className).toContain('font-heading');
  });

  it('renders NIX in accent.text 11px uppercase with 1px letter-spacing, and line below in 12px mono ink', () => {
    render(<NixBubble isOpen={true} message="Quiet corner. Good place to start." />);
    const title = screen.getByText('NIX');
    expect(title).toBeDefined();
    expect(title.className).toContain('text-accent-text');
    expect(title.className).toContain('text-[11px]');
    expect(title.className).toContain('tracking-[1px]');
    expect(title.className).toContain('uppercase');
    expect(title.className).toContain('font-data');

    const msg = screen.getByText('Quiet corner. Good place to start.');
    expect(msg).toBeDefined();
    expect(msg.className).toContain('font-data');
    expect(msg.className).toContain('text-ink');
    expect(msg.className).toContain('text-[12px]');
    expect(msg.className).toContain('line-clamp-2');
  });

  it('renders 44px hit area close button with 16px X icon', () => {
    const handleDismiss = vi.fn();
    render(
      <NixBubble
        isOpen={true}
        message="Watch out for ICE."
        onDismiss={handleDismiss}
      />
    );
    const closeBtn = screen.getByRole('button', { name: 'Close guide' });
    expect(closeBtn).toBeDefined();
    expect(closeBtn.className).toContain('w-[44px]');
    expect(closeBtn.className).toContain('h-[44px]');

    const svg = closeBtn.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.className.baseVal).toContain('w-[16px]');
    expect(svg?.className.baseVal).toContain('h-[16px]');

    act(() => {
      fireEvent.click(closeBtn);
    });
    expect(handleDismiss).toHaveBeenCalledTimes(1);
    expect(usePlayerStore.getState().nixDismissed).toBe(true);
  });

  it('positions bubble at the top of the map, 10px from the edges', () => {
    render(<NixBubble isOpen={true} message="Top positioned tip." />);
    const region = screen.getByRole('region', { name: 'Nix Guide' });
    expect(region.className).toContain('top-[10px]');
    expect(region.className).toContain('right-[10px]');
    expect(region.className).toContain('left-[10px]');
  });
});
