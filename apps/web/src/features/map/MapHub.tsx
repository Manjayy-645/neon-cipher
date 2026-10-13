'use client';

import React from 'react';
import MapEngine from './MapEngine';
import { NodeSheet } from '../sheet/NodeSheet';
import { DistrictHeaderChip } from './DistrictHeaderChip';
import { NixGuide } from './NixGuide';
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

  return (
    <div
      className="scene-ground w-full h-full relative overflow-hidden flex flex-col"
      data-testid="map-hub"
    >
      <MapEngine>
        <div className={`absolute top-[12px] left-[12px] right-[12px] sm:right-auto sm:max-w-[360px] z-30 pointer-events-none flex flex-col gap-[8px] ${view === 'district' ? 'items-end' : 'items-start'}`}>
          <CampaignObjectiveBanner />
          {view === 'district' && <DistrictHeaderChip className="pointer-events-auto" />}
        </div>
        <NixGuide />
        <NodeSheet
          nodeId={activeNodeId ?? selectedNodeId}
          sheetState={sheetState}
          onJackIn={onJackIn}
        />
        <MapTutorialHost />
      </MapEngine>
    </div>
  );
}

export default MapHub;
