'use client';

import React from 'react';
import MapEngine from './MapEngine';
import { NodeSheet } from '../sheet/NodeSheet';
import { DistrictHeaderChip } from './DistrictHeaderChip';
import { NixGuide } from './NixGuide';
import { TargetDirectory } from './TargetDirectory';
import { MapTutorialHost, CampaignObjectiveBanner } from '../story/MapTutorialHost';
import { useMapStore } from '../../stores/map-store';

export interface MapHubProps {
  onJackIn?: (nodeId: string) => void;
}

export function MapHub({ onJackIn }: MapHubProps = {}) {
  const activeNodeId = useMapStore((s) => s.activeNodeId);
  const selectedNodeId = useMapStore((s) => s.selectedNodeId);
  const sheetState = useMapStore((s) => s.sheetState);
  const view = useMapStore((s) => s.view);
  const selectedId = activeNodeId ?? selectedNodeId;

  return (
    <div className="scene-ground w-full h-full relative overflow-hidden flex flex-col min-h-0" data-testid="map-hub">
      <header className="relative z-30 shrink-0 border-b border-line bg-panel px-3 py-2 lg:px-4">
        <div className="flex items-end gap-3">
          <div className="min-w-0 flex-1"><TargetDirectory /></div>
          {view === 'district' && <DistrictHeaderChip className="shrink-0" />}
        </div>
      </header>
      <div className="relative min-h-0 flex-1 lg:grid lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="relative h-full min-h-0 min-w-0" data-testid="city-map-canvas">
          <MapEngine>
            {!selectedId && (
              <div className="absolute top-3 left-3 right-3 z-30 max-w-[360px] pointer-events-none max-[450px]:max-h-[56px]">
                <CampaignObjectiveBanner />
              </div>
            )}
            {!selectedId && <NixGuide />}
          </MapEngine>
        </div>
        <aside aria-label="Target dossier" className="pointer-events-none absolute inset-0 lg:pointer-events-auto lg:relative lg:inset-auto lg:min-h-0 lg:border-l lg:border-line lg:bg-panel-light">
          {!selectedId && (
            <div className="hidden h-full flex-col gap-4 overflow-y-auto p-5 lg:flex">
              <p className="font-data text-[11px] uppercase tracking-widest text-accent-text">Low Meridian / Field dossier</p>
              <h1 className="font-heading text-[28px] leading-tight text-ink">Choose your next target.</h1>
              <p className="text-sm leading-relaxed text-ink-muted">Enter a district on the map, or choose a target from the directory above. Its rules, bounty and loadout will appear here.</p>
              <div className="border-y border-line py-4 text-sm leading-relaxed text-ink-muted">
                <p><strong className="text-ink">Open</strong> · available to inspect.</p>
                <p><strong className="text-ink">Cooldown</strong> · countermeasures are resetting.</p>
                <p><strong className="text-ink">Commercial</strong> · complete Chapter 3 for bridge clearance.</p>
              </div>
              <p className="text-xs leading-relaxed text-ink-muted">Selecting a target never starts a timed breach. Review the dossier, then choose JACK IN.</p>
            </div>
          )}
          <NodeSheet nodeId={selectedId} sheetState={sheetState} onJackIn={onJackIn} />
        </aside>
        <MapTutorialHost />
      </div>
    </div>
  );
}

export default MapHub;
