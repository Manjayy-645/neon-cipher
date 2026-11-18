'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'compact' | 'icon';
export type ButtonSize = 'auto' | 'full';

export interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  compact?: boolean;
  loading?: boolean;
  reason?: string;
  arrow?: boolean;
  confirm?: boolean | string;
  onConfirm?: () => void;
  href?: string;
  className?: string;
  children?: React.ReactNode;
}

export type ButtonProps = BaseButtonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseButtonProps> & {
    'aria-label'?: string;
  };

/**
 * Neon Cipher unified Button component (STYLE B1)
 *
 * Variants:
 * - primary: accent fill, white text, radius 8, min-h 48, mono 15px 600, tracking 3px, uppercase. Main screen action.
 * - secondary: panelLight fill, 1px line border, ink text, radius 8, min-h 44, mono 13px 600, tracking 1px, uppercase.
 * - ghost: transparent, 1px line border, ink text, radius 8, min-h 44, mono 13px 600, tracking 1px, uppercase.
 * - danger: danger fill, white text, radius 8, min-h 48, mono 15px 600, tracking 3px, uppercase. Destructive actions.
 * - compact: min-h 44, padding 0 12px, 12px text, tracking 1px. For cards (e.g. CLAIM DIVIDENDS).
 * - icon: 44 x 44, radius 8, icon 22px stroke 1.8px. Needs aria-label.
 *
 * States:
 * - hover: only inside @media (hover: hover)
 * - pressed: scale 0.97, 120ms, darker fill
 * - focus-visible: 2px accent ring with 2px offset
 * - disabled: heat.track fill, ink.muted text, cursor not-allowed, aria-disabled, reason prop linked with aria-describedby
 * - loading: label replaced by small spinner (rotate only), keeps width (no layout jump), aria-busy
 * - Transitions: transform, opacity, background-color, border-color, 120ms ease-out
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'auto',
    fullWidth = false,
    compact = false,
    loading = false,
    reason,
    arrow = false,
    confirm,
    onConfirm,
    href,
    className = '',
    children,
    disabled = false,
    onClick,
    type = 'button',
    id,
    'aria-describedby': ariaDescribedBy,
    'aria-label': ariaLabel,
    ...restProps
  },
  ref
) {
  const [isConfirming, setIsConfirming] = useState(false);
  const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }

    if (confirm && !isConfirming) {
      e.preventDefault();
      e.stopPropagation();
      setIsConfirming(true);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => {
        setIsConfirming(false);
      }, 4000);
      return;
    }

    if (confirm && isConfirming) {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      setIsConfirming(false);
      if (onConfirm) {
        onConfirm();
      }
      if (onClick) {
        onClick(e);
      }
      return;
    }

    if (onClick) {
      onClick(e);
    }
  };

  const isFull = fullWidth || size === 'full';
  const widthClasses = isFull ? 'w-full flex' : 'w-auto inline-flex';

  // Base styling common to all buttons
  const baseClasses =
    'group relative items-center justify-center font-data select-none rounded-[8px] ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ' +
    'transition-[transform,opacity,background-color,border-color] duration-[120ms] ease-out ' +
    'active:scale-[0.97] ' +
    'motion-reduce:transition-colors motion-reduce:duration-0 motion-reduce:transform-none';

  // Variant-specific styling
  const effectiveVariant = compact && variant === 'secondary' ? 'compact' : variant;
  let variantClasses = '';
  switch (effectiveVariant) {
    case 'primary':
      variantClasses =
        'min-h-[48px] px-6 text-[15px] font-semibold tracking-[3px] uppercase ' +
        'bg-accent text-on-accent border border-transparent shadow-sm ' +
        '[@media(hover:hover)]:hover:brightness-92 ' +
        'active:brightness-85';
      break;

    case 'secondary':
      variantClasses =
        'min-h-[44px] px-4 text-[13px] font-semibold tracking-[1px] uppercase ' +
        'bg-panel-light border border-line text-ink shadow-sm ' +
        '[@media(hover:hover)]:hover:border-ink-muted [@media(hover:hover)]:hover:bg-panel ' +
        'active:brightness-95';
      break;

    case 'ghost':
      variantClasses =
        `min-h-[44px] ${compact ? 'px-[12px] text-[12px]' : 'px-4 text-[13px]'} font-semibold tracking-[1px] uppercase ` +
        'bg-transparent border border-line text-ink ' +
        '[@media(hover:hover)]:hover:border-ink-muted [@media(hover:hover)]:hover:bg-panel-light/60 ' +
        'active:bg-panel-light/80';
      break;

    case 'danger':
      variantClasses =
        'min-h-[48px] px-6 text-[15px] font-semibold tracking-[3px] uppercase ' +
        'bg-danger text-on-accent border border-transparent shadow-sm ' +
        '[@media(hover:hover)]:hover:brightness-92 ' +
        'active:brightness-85';
      break;

    case 'compact':
      variantClasses =
        'min-h-[44px] px-[12px] text-[12px] font-semibold tracking-[1px] uppercase ' +
        'bg-panel-light border border-line text-ink shadow-sm ' +
        '[@media(hover:hover)]:hover:border-ink-muted [@media(hover:hover)]:hover:bg-panel ' +
        'active:brightness-95';
      break;

    case 'icon':
      variantClasses =
        'w-[44px] h-[44px] min-w-[44px] min-h-[44px] p-0 text-[13px] font-semibold uppercase ' +
        'bg-panel-light border border-line text-ink shadow-sm ' +
        '[@media(hover:hover)]:hover:border-ink-muted [@media(hover:hover)]:hover:bg-panel ' +
        'active:brightness-95';
      break;
  }

  // Disabled styling
  const disabledClasses =
    (disabled ? 'bg-heat-track text-ink-muted ' : '') +
    'disabled:bg-heat-track disabled:text-ink-muted disabled:border-transparent ' +
    'disabled:cursor-not-allowed disabled:active:scale-100 disabled:brightness-100 ' +
    'disabled:hover:border-transparent disabled:hover:brightness-100';

  const combinedClasses = `${baseClasses} ${widthClasses} ${variantClasses} ${disabledClasses} ${className}`.trim();

  const reasonId = reason && id ? `${id}-reason` : reason ? `btn-reason-${Math.random().toString(36).substring(2, 7)}` : undefined;
  const effectiveDescribedBy = [ariaDescribedBy, reasonId].filter(Boolean).join(' ') || undefined;

  // Confirm label if active
  const displayLabel = isConfirming
    ? typeof confirm === 'string'
      ? confirm
      : 'CONFIRM?'
    : children;

  const content = (
    <>
      <span className={loading ? 'invisible inline-flex items-center justify-center gap-1.5' : 'contents'}>
        {displayLabel}
        {arrow && (
          <svg
            className="w-4 h-4 ml-1.5 shrink-0 stroke-current motion-reduce:transform-none group-hover:translate-x-0.5 transition-transform duration-[120ms]"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        )}
      </span>

      {/* Loading spinner with rotate-only transform */}
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-4 h-4 animate-spin text-current motion-reduce:animate-none"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        </span>
      )}
    </>
  );

  // If href is passed and not disabled, render as Next Link with button styling
  if (href && !disabled) {
    const linkElement = (
      <Link
        href={href}
        role="button"
        id={id}
        aria-label={ariaLabel}
        aria-describedby={effectiveDescribedBy}
        aria-busy={loading ? 'true' : undefined}
        onClick={onClick as any}
        className={combinedClasses}
        {...(restProps as any)}
      >
        {content}
      </Link>
    );

    if (reason) {
      return (
        <div className={isFull ? 'w-full flex flex-col items-center' : 'inline-flex flex-col items-center'}>
          {linkElement}
          <span id={reasonId} className="font-data text-[11px] text-ink-muted text-center tracking-wider block mt-1 uppercase">
            {reason}
          </span>
        </div>
      );
    }
    return linkElement;
  }

  const buttonElement = (
    <button
      ref={ref}
      type={type}
      id={id}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading ? 'true' : undefined}
      aria-describedby={effectiveDescribedBy}
      aria-label={ariaLabel}
      onClick={handleClick}
      className={combinedClasses}
      {...restProps}
    >
      {content}
    </button>
  );

  if (reason) {
    return (
      <div className={isFull ? 'w-full flex flex-col items-center' : 'inline-flex flex-col items-center'}>
        {buttonElement}
        <span id={reasonId} className="font-data text-[11px] text-ink-muted text-center tracking-wider block mt-1 uppercase">
          {reason}
        </span>
      </div>
    );
  }

  return buttonElement;
});
