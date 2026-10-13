'use client';

import React, { useState } from 'react';
import { MarkerIcon, MarkerIconSize, MARKER_ICON_SIZES } from '../../../components/ui/MarkerIcon';
import { NODE_TYPES, PLATE_STATUSES, NodeStatus } from '../../../features/map/nodeService';
import { Button } from '../../../components/ui/Button';

export default function DevIconsPage() {
  const [selectedSize, setSelectedSize] = useState<MarkerIconSize>('md');
  const [showGuides, setShowGuides] = useState(true);
  const [isGrayscale, setIsGrayscale] = useState(false);

  return (
    <div
      data-surface="panel"
      className={`min-h-screen bg-panel p-6 text-ink font-data text-body relative ${
        isGrayscale ? 'grayscale' : ''
      }`}
    >
      {/* Dev Chip in corner */}
      <div
        data-testid="dev-chip"
        className="fixed top-4 right-4 z-50 bg-panel-light border border-line rounded-sm px-2 py-1 shadow-card font-data text-label text-ink-muted uppercase tracking-[1.5px] pointer-events-none"
      >
        DEV
      </div>

      <header className="mb-8 border-b border-line pb-4 max-w-4xl">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-screen-title text-ink">Icon & Plate Visual Check (/dev/icons)</h1>
        </div>
        <p className="font-data text-label text-ink-muted mt-1 uppercase tracking-[1px]">
          Target sizes: Hit area 52x60 | Plate 52x52 | Glyph 26x26 (13px margin) | Tier badge 14px (8px overlap)
        </p>

        {/* Controls & Reduced Motion Note */}
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <label className="flex items-center gap-2 cursor-pointer font-data text-label text-ink uppercase tracking-[1px]">
            <input
              type="checkbox"
              checked={showGuides}
              onChange={(e) => setShowGuides(e.target.checked)}
              className="accent-accent"
            />
            <span>Show 52px dashed guide outlines</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-data text-label text-ink uppercase tracking-[1px]">
            <input
              type="checkbox"
              checked={isGrayscale}
              onChange={(e) => setIsGrayscale(e.target.checked)}
              className="accent-accent"
            />
            <span>Grayscale Check</span>
          </label>

          <div className="flex gap-2 items-center ml-auto">
            <span className="font-data text-label text-ink-muted uppercase tracking-[1px]">Size Filter:</span>
            {(['sm', 'md', 'lg'] as MarkerIconSize[]).map((s) => (
              <Button
                key={s}
                variant={selectedSize === s ? 'primary' : 'secondary'}
                compact
                onClick={() => setSelectedSize(s)}
                className="px-3 py-1 text-label tracking-[1px]"
              >
                {s} ({MARKER_ICON_SIZES[s].plate}px)
              </Button>
            ))}
          </div>
        </div>

        {/* Reduced motion notice */}
        <div className="mt-3 p-3 bg-panel-light border border-line rounded-md text-[12px] font-data text-ink-muted">
          <strong className="text-ink">Motion Policy:</strong> Follows <code className="text-ink">prefers-reduced-motion</code>. When enabled, animations are bypassed or clamped under 80ms with no ambient pulsing.
        </div>
      </header>

      {/* SECTION 1: All Glyphs at SM, MD, LG */}
      <section className="mb-12 max-w-5xl">
        <h2 className="font-heading text-title text-ink border-b border-line pb-2 mb-4">
          1. Device Glyphs Across Sizes (Available Ring)
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {NODE_TYPES.map((glyph) => (
            <div
              key={glyph}
              className="bg-panel-light border border-line rounded-md p-3 flex flex-col items-center justify-between"
            >
              <span className="font-data text-label text-ink-muted uppercase tracking-[1px] mb-3">
                {glyph}
              </span>

              {/* Render sm, md, lg on a grid with 52px dashed guide outline */}
              <div className="flex items-end justify-center gap-3 my-2">
                {(['sm', 'md', 'lg'] as MarkerIconSize[]).map((sz) => {
                  const dims = MARKER_ICON_SIZES[sz];
                  return (
                    <div key={sz} className="flex flex-col items-center gap-1">
                      <div
                        className={`relative flex items-center justify-center ${
                          showGuides ? 'border border-dashed border-line' : ''
                        }`}
                        style={{
                          width: `${dims.plate}px`,
                          height: `${dims.plate}px`,
                        }}
                      >
                        {showGuides && sz === 'md' && (
                          <div className="absolute inset-0 pointer-events-none border border-dashed border-accent/60 rounded-full" />
                        )}
                        <MarkerIcon type={glyph} status="available" size={sz} />
                      </div>
                      <span className="font-data text-[10px] text-ink-muted uppercase">{sz}</span>
                    </div>
                  );
                })}
              </div>

              <div className="font-data text-[11px] text-ink-muted mt-2">
                active: {MARKER_ICON_SIZES[selectedSize].glyph}px glyph
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2: Plate Status Shapes */}
      <section className="mb-12 max-w-5xl">
        <h2 className="font-heading text-title text-ink border-b border-line pb-2 mb-4">
          2. Status Plates at Standard Size (52px Plate, 26px Glyph)
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {PLATE_STATUSES.map((st) => {
            const isLocked = st === 'locked';
            const status: NodeStatus = isLocked ? 'available' : st;

            return (
              <div
                key={st}
                className="bg-panel-light border border-line rounded-md p-3 flex flex-col items-center gap-3"
              >
                <span className="font-data text-label text-ink-muted uppercase tracking-[1px]">{st}</span>
                <div
                  className={`relative flex items-center justify-center ${
                    showGuides ? 'border border-dashed border-danger/50' : ''
                  }`}
                  style={{ width: '52px', height: '52px' }}
                >
                  <MarkerIcon type={NODE_TYPES[0]} status={status} isLocked={isLocked} size="md" />
                </div>
                <span className="font-data text-[11px] text-ink-muted">
                  {isLocked ? '52x52 (lock)' : '52x52 (ring/fill)'}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: Complete Marker Geometry */}
      <section className="mb-12 max-w-5xl">
        <h2 className="font-heading text-title text-ink border-b border-line pb-2 mb-4">
          3. Complete Marker Stack (Hit Area: 52 x 60, Badge Overlap: 8px)
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { name: 'Available T1', status: 'available' as NodeStatus, tier: 1, locked: false, selected: false },
            { name: 'Owned T2', status: 'owned' as NodeStatus, tier: 2, locked: false, selected: false },
            { name: 'Contested T3', status: 'contested' as NodeStatus, tier: 3, locked: false, selected: false },
            { name: 'Locked T4', status: 'available' as NodeStatus, tier: 4, locked: true, selected: false },
          ].map((m) => (
            <div
              key={m.name}
              className="bg-panel-light border border-line rounded-md p-3 flex flex-col items-center"
            >
              <span className="font-data text-label text-ink-muted uppercase tracking-[1px] mb-3">{m.name}</span>

              {/* 52 x 60 Hit Area Container */}
              <div
                className={`relative flex flex-col items-center justify-center ${
                  showGuides ? 'border border-dashed border-accent' : ''
                }`}
                style={{ width: '52px', height: '60px' }}
              >
                <div className="relative flex flex-col items-center">
                  <MarkerIcon
                    size="md"
                    type={NODE_TYPES[1]}
                    status={m.status}
                    isLocked={m.locked}
                    isSelected={m.selected}
                  />
                  <div
                    className="-mt-[8px] z-20 h-[14px] px-1.5 rounded-[7px] text-[10px] font-data font-semibold flex items-center justify-center leading-none bg-ink text-panel-light"
                    style={{ height: '14px' }}
                  >
                    {m.locked ? 'LOCKED' : `T${m.tier}`}
                  </div>
                </div>
              </div>

              <div className="mt-3 font-data text-[11px] text-ink-muted text-center leading-tight">
                Hit area: 52 x 60<br />
                Plate: 52 x 52<br />
                Badge: 14h (-8px margin)
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
