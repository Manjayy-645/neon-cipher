'use client';

import React, { useRef } from 'react';
import { Button } from './Button';

export interface SegmentOption<T extends string> {
  id: T;
  label: string;
  badge?: string | number;
  testId?: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
  size?: 'sm' | 'md';
  layout?: 'row' | 'grid';
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className = '',
  size = 'md',
  layout = 'row',
}: SegmentedControlProps<T>) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const containerLayoutClass =
    layout === 'grid'
      ? 'grid grid-cols-2 sm:flex'
      : 'flex';

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % options.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + options.length) % options.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = options.length - 1;
    } else {
      return;
    }

    const nextOption = options[nextIndex];
    if (nextOption) {
      onChange(nextOption.id);
      buttonRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`${containerLayoutClass} w-full min-w-0 min-h-[44px] bg-panel border border-line rounded-[8px] p-1 gap-1 select-none ${className}`}
    >
      {options.map((opt, idx) => {
        const isActive = opt.id === value;
        return (
          <Button
            key={opt.id}
            ref={(el) => {
              buttonRefs.current[idx] = el;
            }}
            variant={isActive ? 'primary' : 'secondary'}
            compact
            role="tab"
            tabIndex={isActive ? 0 : -1}
            aria-selected={isActive}
            data-testid={opt.testId}
            onClick={() => onChange(opt.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`flex-1 min-w-0 rounded-[6px] text-xs transition-all gap-1.5 ${
              isActive
                ? 'bg-accent text-white font-bold shadow-sm border border-transparent'
                : 'bg-panel-light border border-line text-ink font-medium hover:border-ink-muted'
            } ${size === 'sm' ? 'py-1 text-[11px]' : ''}`}
          >
            <span className="min-w-0 max-w-full text-center whitespace-normal break-words leading-tight">
              {opt.label}
            </span>
            {opt.badge !== undefined && (
              <span
                className={`shrink-0 text-[10px] px-1.5 py-0.2 rounded-pill font-mono ${
                  isActive
                    ? 'bg-white/20 text-white font-bold'
                    : 'bg-ink/10 text-ink-muted'
                }`}
              >
                {opt.badge}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
