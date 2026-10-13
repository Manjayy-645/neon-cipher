'use client';

import React from 'react';
import Link from 'next/link';
import { DevMenu } from '@/features/dev/DevMenu';

export default function DevPage() {
  return (
    <div className="scene-ground scene-arrive h-full w-full p-6 overflow-y-auto font-data text-ink">
      <div className="max-w-[440px] mx-auto space-y-6">
        <header className="border-b border-line pb-3">
          <span className="type-label text-[10px] text-accent-text font-bold">DEV ENVIRONMENT</span>
          <h1 className="font-heading text-2xl text-ink">DIAGNOSTIC MATRIX (/dev)</h1>
          <p className="text-xs text-ink-muted mt-1">
            Task 14 System States, Auth, Splash, and Settings visual verification.
          </p>
        </header>

        <section className="space-y-2">
          <div className="type-label text-[10px] text-ink-muted">HERO SCREENS</div>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/splash" className="scene-card p-3 bg-panel-light border border-line rounded-md hover:border-accent text-xs font-data font-bold block">
              0.1 Splash / Boot →
            </Link>
            <Link href="/login" className="scene-card p-3 bg-panel-light border border-line rounded-md hover:border-accent text-xs font-data font-bold block">
              0.2 Login & Callsign →
            </Link>
            <Link href="/map" className="scene-card p-3 bg-panel-light border border-line rounded-md hover:border-accent text-xs font-data font-bold block">
              1.0 City Map →
            </Link>
            <Link href="/settings" className="scene-card p-3 bg-panel-light border border-line rounded-md hover:border-accent text-xs font-data font-bold block">
              6.0 Settings →
            </Link>
            <Link href="/error" className="scene-card p-3 bg-panel-light border border-danger/40 text-danger-text rounded-md hover:border-danger text-xs font-data font-bold block">
              0.3 Error Screen →
            </Link>
            <Link href="/maintenance" className="scene-card p-3 bg-panel-light border border-money/40 text-money-text rounded-md hover:border-money text-xs font-data font-bold block">
              0.3 Maintenance →
            </Link>
            <Link href="/profile" className="scene-card p-3 bg-panel-light border border-line rounded-md hover:border-accent text-xs font-data font-bold block col-span-2">
              8.0–8.4 Decker Profile & Matrix Hub →
            </Link>
            <Link href="/dev/icons" className="scene-card p-3 bg-panel-light border border-line rounded-md hover:border-accent text-xs font-data font-bold block">
              Marker & Plate Visualizer (/dev/icons) →
            </Link>
            <Link href="/dev/buttons" className="scene-card p-3 bg-panel-light border border-line rounded-md hover:border-accent text-xs font-data font-bold block">
              Button System Matrix (/dev/buttons) →
            </Link>
          </div>
        </section>

        <section className="bg-panel-light border border-line p-4 rounded space-y-2">
          <div className="type-label text-[10px] text-ink-muted">QUICK INSTRUCTIONS</div>
          <p className="text-xs text-ink leading-relaxed">
            Use the floating <strong>DEV MENU</strong> button in the bottom-right corner from any screen to simulate disconnects, trigger reconnect banners, toggle mid-duel desync, and override reduced motion or color-blind clue modes.
          </p>
        </section>
      </div>

      <DevMenu />
    </div>
  );
}
