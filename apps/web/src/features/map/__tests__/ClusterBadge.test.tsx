import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClusterBadge } from '../ClusterBadge';
import { ClusterChip } from '../ClusterChip';
import * as nodeService from '../nodeService';

describe('STYLE S6: Cluster badge and top-left chip', () => {
  describe('ClusterBadge component', () => {
    it('renders surface.panelLight, 1px line, radius 12 (rounded-md), card shadow, padding 10px 14px, min height 44px', () => {
      render(
        <ClusterBadge
          districtName="Slums"
          nodeCount={8}
          contestedCount={2}
          isLocked={false}
        />
      );

      const badge = screen.getByTestId('cluster-badge');
      expect(badge).toBeDefined();
      expect(badge.tagName).toBe('BUTTON');
      expect(badge.className).toContain('bg-panel-light');
      expect(badge.className).toContain('border');
      expect(badge.className).toContain('border-line');
      expect(badge.className).toContain('rounded-md'); // 12px
      expect(badge.className).toContain('shadow-card');
      expect(badge.className).toContain('px-[14px]');
      expect(badge.className).toContain('py-[10px]');
      expect(badge.className).toContain('min-h-[44px]');
      expect(badge.className).toContain('min-w-[44px]');

      // District name: serif 16px ink
      const name = badge.querySelector('.font-heading');
      expect(name).toBeDefined();
      expect(name?.className).toContain('text-[16px]');
      expect(name?.className).toContain('text-ink');
      expect(name?.textContent).toBe('Slums');

      // "N nodes" in 12px mono, ", N contested" in danger.text
      const subtext = badge.querySelector('.font-data');
      expect(subtext).toBeDefined();
      expect(subtext?.className).toContain('text-[12px]');
      expect(subtext?.textContent).toContain('8 nodes');
      expect(subtext?.textContent).toContain(', 2 contested');
      const contestedSpan = subtext?.querySelector('.text-danger-text');
      expect(contestedSpan).toBeDefined();
      expect(contestedSpan?.textContent).toBe(', 2 contested');

      // aria-label
      expect(badge.getAttribute('aria-label')).toBe('Slums cluster, 8 nodes, 2 contested');
    });

    it('locked district shows "locked" in muted ink with appropriate aria-label', () => {
      render(
        <ClusterBadge
          districtName="Commercial"
          nodeCount={7}
          contestedCount={1}
          isLocked={true}
        />
      );

      const badge = screen.getByTestId('cluster-badge');
      expect(badge.getAttribute('aria-label')).toBe('Commercial cluster, locked');
      const lockedSpan = badge.querySelector('.text-ink-muted');
      expect(lockedSpan).toBeDefined();
      expect(lockedSpan?.textContent).toBe('locked');
    });

    it('triggers onClick handler when tapped and supports keyboard focus ring', () => {
      const handleClick = vi.fn();
      render(
        <ClusterBadge
          districtName="Slums"
          nodeCount={5}
          onClick={handleClick}
        />
      );

      const badge = screen.getByTestId('cluster-badge');
      expect(badge.className).toContain('focus-visible:ring-2');
      expect(badge.className).toContain('focus-visible:ring-accent');
      fireEvent.click(badge);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Top-left map chip (ClusterChip)', () => {
    it('renders a compact city-grid card with node counts and a 16px network icon', () => {
      vi.spyOn(nodeService, 'getNodes').mockReturnValue([
        { id: '1', name: 'N1', type: 'atm', tier: 1, district: 'slums', x: 10, y: 10, status: 'available' } as any,
        { id: '2', name: 'N2', type: 'relay', tier: 2, district: 'slums', x: 20, y: 20, status: 'contested' } as any,
        { id: '3', name: 'N3', type: 'camera', tier: 1, district: 'commercial', x: 30, y: 30, status: 'contested' } as any,
      ]);

      const { container } = render(<ClusterChip />);
      const wrapper = container.querySelector('.absolute.top-\\[12px\\].left-\\[12px\\]');
      expect(wrapper).toBeDefined();

      const button = screen.getByTestId('top-left-chip');
      expect(button).toBeDefined();
      expect(button.tagName).toBe('BUTTON');
      expect(button.className).toContain('bg-panel-light');
      expect(button.className).toContain('border');
      expect(button.className).toContain('border-line');
      expect(button.className).toContain('rounded-md'); // 12px
      expect(button.className).toContain('shadow-card');
      expect(button.className).toContain('px-[12px]');
      expect(button.className).toContain('py-[8px]');
      expect(button.className).toContain('min-h-[44px]');
      expect(button.className).toContain('min-w-[44px]');
      expect(button.className).toContain('font-data');
      expect(button.className).toContain('text-[12px]');

      expect(screen.getByText('City grid')).toHaveClass('font-heading', 'text-[16px]');

      // 16px network icon SVG
      const iconSvg = button.querySelector('svg');
      expect(iconSvg).toBeDefined();
      expect(iconSvg?.getAttribute('width')).toBe('16');
      expect(iconSvg?.getAttribute('height')).toBe('16');

      // Text content
      expect(button.textContent).toContain('3 nodes');
      expect(button.textContent).toContain(', 2 contested');

      // aria-label
      expect(button.getAttribute('aria-label')).toBe('3 nodes, 2 contested');
    });

    it('triggers onClick handler when tapped and supports focus ring', () => {
      const handleClick = vi.fn();
      render(<ClusterChip onClick={handleClick} />);

      const button = screen.getByTestId('top-left-chip');
      expect(button.className).toContain('focus-visible:ring-2');
      expect(button.className).toContain('focus-visible:ring-accent');
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
