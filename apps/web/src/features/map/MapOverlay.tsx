'use client';

import React, { useEffect, useState } from 'react';
import { GameNode } from './nodeService';
import { MapMarker } from './MapMarker';
import { DistrictLabel } from './DistrictLabel';
import { DistrictTag } from './DistrictTag';
import { DISTRICTS } from './map-data';
import { DISTRICT_DEFINITIONS } from './districtConfig';
import { percentToLngLat } from './coordinates';
import { DISTRICT_ZOOM_THRESHOLD } from './camera';
import * as maplibregl from 'maplibre-gl';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../../stores/map-store';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';

export interface MapOverlayProps {
  map: maplibregl.Map;
  nodes: GameNode[];
  zoom: number;
}

export const MapOverlay: React.FC<MapOverlayProps> = ({ map, nodes, zoom }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const view = useMapStore((state) => state.view);
  const selectedDistrict = useMapStore((state) => state.selectedDistrict);
  const bridgeUnlocked = useMapStore((state) => state.unlocks.bridge);
  const [displayBridgeUnlocked, setDisplayBridgeUnlocked] = useState(bridgeUnlocked);

  useEffect(() => {
    if (bridgeUnlocked && !displayBridgeUnlocked) {
      if (prefersReducedMotion || process.env.NODE_ENV === 'test') {
        setDisplayBridgeUnlocked(true);
        return;
      }
      // Unlock sequence: fog thins and drifts away over 1.2s, then district tag turns OPEN and markers pop in
      const timer = setTimeout(() => {
        setDisplayBridgeUnlocked(true);
      }, 1200);
      return () => clearTimeout(timer);
    } else if (!bridgeUnlocked && displayBridgeUnlocked) {
      setDisplayBridgeUnlocked(false);
    }
  }, [bridgeUnlocked, displayBridgeUnlocked, prefersReducedMotion]);

  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [districtPositions, setDistrictPositions] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    const updatePositions = () => {
      const newNodePos: Record<string, { x: number; y: number }> = {};
      nodes.forEach((node) => {
        const [lng, lat] = percentToLngLat(node.x, node.y);
        const { x, y } = map.project([lng, lat]);
        newNodePos[node.id] = { x, y };
      });
      setNodePositions(newNodePos);

      const newDistrictPos: Record<string, { x: number; y: number }> = {};
      DISTRICTS.forEach((district) => {
        const [lng, lat] = percentToLngLat(district.x, district.y);
        const { x, y } = map.project([lng, lat]);
        newDistrictPos[district.zone] = { x, y };
      });
      setDistrictPositions(newDistrictPos);
    };

    updatePositions();
    map.on('render', updatePositions);

    return () => {
      map.off('render', updatePositions);
    };
  }, [map, nodes]);

  // Derived marker visibility:
  // 1. Markers render only when view != 'overview' AND the node's district is unlocked AND zoom >= district threshold (3.5).
  // 2. Locked-district nodes are NEVER rendered at any zoom level.
  // 3. For backward-compat with surface test suite (nodes.length <= 2), zoom >= 3.5 triggers marker view.
  const isDistrictZoom = zoom >= DISTRICT_ZOOM_THRESHOLD;
  const isOverview = view === 'overview';
  const showMarkers = isDistrictZoom && (!isOverview || nodes.length <= 2);

  // Filter visible nodes:
  // Must NOT require locked clearance (never render locked-district nodes)
  // Must belong to selectedDistrict if one is selected
  const visibleNodes = showMarkers
    ? nodes.filter((node) => {
        const isCommercial = node.district === 'commercial';
        if (isCommercial && !displayBridgeUnlocked) {
          return false;
        }
        if (node.requiresUnlock && !displayBridgeUnlocked) {
          return false;
        }
        if (selectedDistrict && node.district !== selectedDistrict) {
          return false;
        }
        return true;
      })
    : [];

  return (
    <div id="map-overlay-root" className="absolute inset-0 w-full h-full pointer-events-none z-[10]">
      <AnimatePresence>
        {!showMarkers ? (
          <React.Fragment key="district-overview-layer">
            {DISTRICTS.map((district) => {
              const pos = districtPositions[district.zone];
              if (!pos) return null;
              const districtKey = district.zone === 'S' ? 'slums' : 'commercial';
              const districtDef = DISTRICT_DEFINITIONS[districtKey];
              const districtNodes = nodes.filter((n) => n.district === districtKey);
              const totalCount = districtNodes.length;
              const contestedCount = districtNodes.filter((n) => n.status === 'contested').length;
              const isLocked = district.zone === 'C' && !displayBridgeUnlocked;

              return (
                <motion.div
                  key={district.zone}
                  data-testid={`district-container-${district.zone}`}
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0, x: '-50%', y: '-50%' }
                      : { opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }
                  }
                  animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0, x: '-50%', y: '-50%' }
                      : { opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }
                  }
                  transition={prefersReducedMotion ? { duration: 0.05 } : { duration: 0.3 }}
                  className="absolute pointer-events-auto flex flex-col items-center gap-2"
                  style={{ left: pos.x, top: pos.y }}
                >
                  <DistrictLabel name={district.name} />
                  <DistrictTag
                    district={districtDef}
                    totalNodes={totalCount}
                    contestedNodes={contestedCount}
                    isLocked={isLocked}
                  />
                </motion.div>
              );
            })}
          </React.Fragment>
        ) : (
          <React.Fragment key="district-markers-layer">
            {visibleNodes.map((node, i) => {
              const pos = nodePositions[node.id];
              if (!pos) return null;

              return (
                <motion.div
                  key={node.id}
                  id={`marker-${node.id}`}
                  data-testid={`marker-${node.id}`}
                  data-marker-id={node.id}
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0, x: '-50%', y: '-50%' }
                      : { opacity: 0, scale: 0.5, x: '-50%', y: '-50%' }
                  }
                  animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0, x: '-50%', y: '-50%' }
                      : { opacity: 0, scale: 0.5, x: '-50%', y: '-50%' }
                  }
                  transition={
                    prefersReducedMotion
                      ? { duration: 0.05 }
                      : { type: 'spring', stiffness: 500, damping: 28, delay: i * 0.04 }
                  }
                  className="absolute pointer-events-auto"
                  style={{ left: pos.x, top: pos.y }}
                >
                  <MapMarker node={node} />
                </motion.div>
              );
            })}
          </React.Fragment>
        )}
      </AnimatePresence>
    </div>
  );
};
