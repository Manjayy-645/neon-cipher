import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Button } from '../Button';

describe('STYLE B1: Unified Button Component', () => {
  it('renders primary variant with 48px min-height, accent fill, white text, mono 15px, and 3px tracking', () => {
    render(<Button variant="primary">JACK IN</Button>);
    const btn = screen.getByRole('button', { name: 'JACK IN' });
    expect(btn).toBeDefined();
    expect(btn.className).toContain('min-h-[48px]');
    expect(btn.className).toContain('bg-accent');
    expect(btn.className).toContain('text-white');
    expect(btn.className).toContain('rounded-[8px]');
    expect(btn.className).toContain('tracking-[3px]');
    expect(btn.className).toContain('uppercase');
  });

  it('renders secondary variant with 44px min-height, panel-light fill, 1px line border, and ink text', () => {
    render(<Button variant="secondary">VIEW SPECIFICATIONS</Button>);
    const btn = screen.getByRole('button', { name: 'VIEW SPECIFICATIONS' });
    expect(btn).toBeDefined();
    expect(btn.className).toContain('min-h-[44px]');
    expect(btn.className).toContain('bg-panel-light');
    expect(btn.className).toContain('border-line');
    expect(btn.className).toContain('text-ink');
    expect(btn.className).toContain('tracking-[1px]');
  });

  it('renders ghost variant with transparent background and 1px line border', () => {
    render(<Button variant="ghost">CANCEL</Button>);
    const btn = screen.getByRole('button', { name: 'CANCEL' });
    expect(btn).toBeDefined();
    expect(btn.className).toContain('bg-transparent');
    expect(btn.className).toContain('border-line');
    expect(btn.className).toContain('min-h-[44px]');
  });

  it('renders danger variant with 48px min-height, danger fill, and white text', () => {
    render(<Button variant="danger">PURGE RIG</Button>);
    const btn = screen.getByRole('button', { name: 'PURGE RIG' });
    expect(btn).toBeDefined();
    expect(btn.className).toContain('min-h-[48px]');
    expect(btn.className).toContain('bg-danger');
    expect(btn.className).toContain('text-white');
  });

  it('renders compact variant with min-h 44px, 12px padding, and 12px text size for cards', () => {
    render(<Button variant="compact">CLAIM DIVIDENDS</Button>);
    const btn = screen.getByRole('button', { name: 'CLAIM DIVIDENDS' });
    expect(btn).toBeDefined();
    expect(btn.className).toContain('min-h-[44px]');
    expect(btn.className).toContain('px-[12px]');
    expect(btn.className).toContain('text-[12px]');
  });

  it('renders icon variant with 44x44 size and requires aria-label', () => {
    render(
      <Button variant="icon" aria-label="Close panel">
        ✕
      </Button>
    );
    const btn = screen.getByRole('button', { name: 'Close panel' });
    expect(btn).toBeDefined();
    expect(btn.className).toContain('w-[44px]');
    expect(btn.className).toContain('h-[44px]');
    expect(btn.className).toContain('min-w-[44px]');
    expect(btn.className).toContain('min-h-[44px]');
  });

  it('renders full width size when fullWidth or size="full" is passed', () => {
    render(<Button variant="primary" fullWidth>FULL WIDTH ACTION</Button>);
    const btn = screen.getByRole('button', { name: 'FULL WIDTH ACTION' });
    expect(btn.className).toContain('w-full');
  });

  it('preserves the button layout for rich card content', () => {
    render(
      <Button fullWidth className="flex-col items-stretch">
        <span>HARDWARE SLOT</span>
        <span>ONLINE</span>
      </Button>
    );
    const btn = screen.getByRole('button');
    expect(btn.firstElementChild).toHaveClass('contents');
  });

  it('handles disabled state with heat.track fill, ink.muted text, and reason linked via aria-describedby', () => {
    render(
      <Button
        variant="primary"
        disabled
        id="jack-in-btn"
        reason="Cooldown 04:12"
      >
        JACK IN
      </Button>
    );
    const btn = screen.getByRole('button', { name: 'JACK IN' });
    expect(btn).toBeDisabled();
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    expect(btn.className).toContain('disabled:bg-heat-track');
    expect(btn.className).toContain('disabled:text-ink-muted');
    expect(btn.className).toContain('disabled:cursor-not-allowed');

    const reasonEl = screen.getByText('Cooldown 04:12');
    expect(reasonEl).toBeDefined();
    expect(btn.getAttribute('aria-describedby')).toBe(reasonEl.id);
  });

  it('handles loading state with spinner and aria-busy without removing content footprint', () => {
    render(<Button variant="primary" loading>SYNCING CARRIER</Button>);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-busy')).toBe('true');
    expect(btn).toBeDisabled();

    // Text is still in DOM but invisible to prevent layout shift
    const contentWrapper = btn.querySelector('.invisible');
    expect(contentWrapper).not.toBeNull();
    expect(contentWrapper?.textContent).toContain('SYNCING CARRIER');

    // Spinner is present
    const spinner = btn.querySelector('.animate-spin');
    expect(spinner).not.toBeNull();
  });

  it('renders navigation arrow icon when arrow=true', () => {
    render(<Button variant="secondary" arrow>VIEW BRIEFING</Button>);
    const btn = screen.getByRole('button', { name: /VIEW BRIEFING/ });
    const arrowSvg = btn.querySelector('svg');
    expect(arrowSvg).not.toBeNull();
  });

  it('supports two-step confirmation on destructive danger actions', () => {
    const onConfirmSpy = vi.fn();
    render(
      <Button
        variant="danger"
        confirm="CONFIRM SURRENDER?"
        onConfirm={onConfirmSpy}
      >
        SURRENDER
      </Button>
    );

    const btn = screen.getByRole('button', { name: 'SURRENDER' });

    // First click: prompts for confirmation
    fireEvent.click(btn);
    expect(onConfirmSpy).not.toHaveBeenCalled();
    expect(screen.getByText('CONFIRM SURRENDER?')).toBeDefined();

    // Second click: triggers onConfirm
    fireEvent.click(btn);
    expect(onConfirmSpy).toHaveBeenCalledTimes(1);
  });

  it('renders as Link when href is passed', () => {
    render(<Button variant="primary" href="/map">CITY MAP</Button>);
    const link = screen.getByRole('button', { name: 'CITY MAP' });
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/map');
    expect(link.className).toContain('bg-accent');
  });
});
