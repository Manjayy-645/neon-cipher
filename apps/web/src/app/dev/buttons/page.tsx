'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, ButtonVariant } from '@/components/ui/Button';

export default function DevButtonsPage() {
  const [clickLog, setClickLog] = useState<string>('No actions triggered yet.');
  const [isLoadingActive, setIsLoadingActive] = useState<boolean>(true);

  const variants: { key: ButtonVariant; name: string; description: string }[] = [
    {
      key: 'primary',
      name: 'PRIMARY',
      description: 'Accent fill, white text, radius 8, min-h 48, mono 15px 600, tracking 3px, UPPERCASE. Main screen action.',
    },
    {
      key: 'secondary',
      name: 'SECONDARY',
      description: 'PanelLight fill, 1px line border, ink text, radius 8, min-h 44, mono 13px 600, tracking 1px, UPPERCASE.',
    },
    {
      key: 'ghost',
      name: 'GHOST',
      description: 'Transparent, 1px line border, ink text, radius 8, min-h 44, mono 13px 600, tracking 1px, UPPERCASE.',
    },
    {
      key: 'danger',
      name: 'DANGER',
      description: 'Danger fill, white text, radius 8, min-h 48, mono 15px 600, tracking 3px, UPPERCASE. Destructive actions.',
    },
    {
      key: 'compact',
      name: 'COMPACT',
      description: 'Min-h 44 (never smaller), padding 0 12px, 12px text. For card actions (e.g. CLAIM DIVIDENDS).',
    },
    {
      key: 'icon',
      name: 'ICON',
      description: '44 x 44, radius 8, icon 22px stroke 1.8px. Needs aria-label.',
    },
  ];

  return (
    <div className="min-h-screen w-full bg-panel p-4 sm:p-6 overflow-y-auto font-data text-ink">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <header className="border-b border-line pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/dev" className="text-accent-text hover:underline text-xs font-bold">
                ← /dev
              </Link>
              <span className="text-ink-muted text-xs">•</span>
              <span className="text-[10px] text-accent-text font-bold uppercase tracking-wider">
                STYLE B1 SYSTEM MATRIX
              </span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl text-ink mt-1">
              BUTTON SYSTEM MATRIX (/dev/buttons)
            </h1>
            <p className="text-xs text-ink-muted mt-1">
              One unified &lt;Button&gt; component for the whole app. Tokens only, 44px+ hit areas, accessible states.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="compact"
              onClick={() => setIsLoadingActive(!isLoadingActive)}
            >
              TOGGLE LOADING DEMO
            </Button>
          </div>
        </header>

        {/* Live Feedback Banner */}
        <section className="p-3 bg-panel-light border border-line rounded flex items-center justify-between text-xs">
          <span className="text-ink-muted uppercase tracking-wider text-[11px]">INTERACTION LOG:</span>
          <span className="font-mono font-bold text-accent-text">{clickLog}</span>
        </section>

        {/* 1. VARIANT BY STATE MATRIX GRID */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="type-label text-xs font-bold text-ink">
              1. VARIANTS × STATES MATRIX
            </h2>
            <span className="text-[10px] text-ink-muted">All variants never smaller than 44px tall</span>
          </div>

          <div className="space-y-6">
            {variants.map((v) => (
              <div
                key={v.key}
                className="bg-panel-light border border-line rounded-lg p-4 space-y-3 shadow-card"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-line/60 pb-2 gap-1">
                  <div>
                    <span className="font-mono font-bold text-sm text-ink">{v.name}</span>
                    <span className="text-[11px] text-ink-muted ml-2">variant=&quot;{v.key}&quot;</span>
                  </div>
                  <span className="text-[10px] text-ink-muted sm:max-w-md text-left sm:text-right">
                    {v.description}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                  {/* State: Default */}
                  <div className="flex flex-col gap-1.5 p-2.5 bg-panel border border-line/40 rounded">
                    <span className="text-[9px] uppercase font-bold text-ink-muted tracking-wider">
                      Default / Normal
                    </span>
                    <Button
                      variant={v.key}
                      aria-label={v.key === 'icon' ? 'Default Icon' : undefined}
                      onClick={() => setClickLog(`Clicked ${v.name} (Default)`)}
                    >
                      {v.key === 'icon' ? '⚙' : v.name}
                    </Button>
                  </div>

                  {/* State: With Nav Arrow */}
                  <div className="flex flex-col gap-1.5 p-2.5 bg-panel border border-line/40 rounded">
                    <span className="text-[9px] uppercase font-bold text-ink-muted tracking-wider">
                      Navigation (arrow=true)
                    </span>
                    <Button
                      variant={v.key}
                      arrow={v.key !== 'icon'}
                      aria-label={v.key === 'icon' ? 'Navigation Icon' : undefined}
                      onClick={() => setClickLog(`Clicked ${v.name} (Nav Arrow)`)}
                    >
                      {v.key === 'icon' ? '→' : 'NAVIGATE'}
                    </Button>
                  </div>

                  {/* State: Disabled (with Reason) */}
                  <div className="flex flex-col gap-1.5 p-2.5 bg-panel border border-line/40 rounded">
                    <span className="text-[9px] uppercase font-bold text-ink-muted tracking-wider">
                      Disabled + reason
                    </span>
                    <Button
                      variant={v.key}
                      disabled
                      reason={v.key === 'icon' ? 'OFFLINE' : 'COOLDOWN 04:12'}
                      aria-label={v.key === 'icon' ? 'Disabled Icon' : undefined}
                    >
                      {v.key === 'icon' ? '🔒' : 'LOCKED'}
                    </Button>
                  </div>

                  {/* State: Loading */}
                  <div className="flex flex-col gap-1.5 p-2.5 bg-panel border border-line/40 rounded">
                    <span className="text-[9px] uppercase font-bold text-ink-muted tracking-wider">
                      Loading (no layout shift)
                    </span>
                    <Button
                      variant={v.key}
                      loading={isLoadingActive}
                      aria-label={v.key === 'icon' ? 'Loading Icon' : undefined}
                    >
                      {v.key === 'icon' ? '⟳' : 'TRANSMITTING'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. ADVANCED STATES: CONFIRMATION & FULL-WIDTH */}
        <section className="space-y-4">
          <h2 className="type-label text-xs font-bold text-ink">
            2. DESTRUCTIVE CONFIRMATION & FULL-WIDTH MODES
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Destructive Confirm */}
            <div className="bg-panel-light border border-line rounded-lg p-4 space-y-3">
              <span className="font-mono font-bold text-sm text-ink block">
                Two-Step Destructive Action
              </span>
              <p className="text-xs text-ink-muted leading-relaxed">
                Rules: &quot;destructive actions use danger and a confirm&quot;. Clicking once arms confirmation with a prompt; clicking again executes.
              </p>
              <div className="pt-2">
                <Button
                  variant="danger"
                  confirm="CONFIRM SURRENDER?"
                  onConfirm={() => setClickLog('Surrender CONFIRMED & executed!')}
                  fullWidth
                >
                  SURRENDER DUEL
                </Button>
              </div>
            </div>

            {/* Link Mode */}
            <div className="bg-panel-light border border-line rounded-lg p-4 space-y-3">
              <span className="font-mono font-bold text-sm text-ink block">
                Link Navigation Mode (href prop)
              </span>
              <p className="text-xs text-ink-muted leading-relaxed">
                Renders accessible &lt;Link&gt; styled identically to buttons, complete with focus rings and hover transitions.
              </p>
              <div className="pt-2">
                <Button variant="primary" href="/map" arrow fullWidth>
                  VIEW CITY MAP
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 3. TERMINAL CONTEXT TEST */}
        <section className="space-y-3">
          <h2 className="type-label text-xs font-bold text-ink">
            3. TERMINAL SURFACE INHERITANCE (data-surface=&quot;terminal&quot;)
          </h2>
          <div
            data-surface="terminal"
            className="p-4 bg-panel-dark text-panel-light border border-line rounded-lg space-y-3"
          >
            <div className="flex items-center justify-between text-xs font-mono text-accent">
              <span>HACKING TERMINAL BOUNDARY</span>
              <span>DATA-SURFACE=&quot;TERMINAL&quot;</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button variant="primary">JACK IN</Button>
              <Button variant="secondary">ANALYZE</Button>
              <Button variant="ghost">PURGE TRACE</Button>
              <Button variant="danger" confirm="ABORT?">ABORT</Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
