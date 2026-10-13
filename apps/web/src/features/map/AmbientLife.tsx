'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import * as maplibregl from 'maplibre-gl';
import { percentToLngLat } from './coordinates';
import { usePerformanceGuard } from './hooks/usePerformanceGuard';
import { useMapStore } from '../../stores/map-store';

export interface AmbientLifeProps {
  map: maplibregl.Map;
}

interface PathEntity {
  id: string;
  type: 'car' | 'pedestrian';
  start: { x: number; y: number };
  end: { x: number; y: number };
  duration: number; // in seconds
  color: string;
}

const AMBIENT_ENTITIES: PathEntity[] = [
  // 2 Cars
  {
    id: 'car-bridge',
    type: 'car',
    start: { x: 36, y: 50 }, // Bridge entry (Slums)
    end: { x: 64, y: 50 },   // Bridge exit (Commercial)
    duration: 14,
    color: 'var(--ink-muted)',
  },
  {
    id: 'car-commercial',
    type: 'car',
    start: { x: 70, y: 25 }, // Commercial Ave North
    end: { x: 66, y: 75 },   // Commercial Ave South
    duration: 18,
    color: 'var(--ink-muted)',
  },
  // 3 Pedestrians
  {
    id: 'ped-slums',
    type: 'pedestrian',
    start: { x: 18, y: 25 }, // Tin Alley
    end: { x: 22, y: 35 },
    duration: 22,
    color: 'var(--ink-muted)',
  },
  {
    id: 'ped-commercial',
    type: 'pedestrian',
    start: { x: 72, y: 24 }, // Meridian Ave
    end: { x: 68, y: 32 },
    duration: 20,
    color: 'var(--ink-muted)',
  },
  {
    id: 'ped-canal',
    type: 'pedestrian',
    start: { x: 60, y: 55 }, // Canal Bank
    end: { x: 64, y: 62 },
    duration: 24,
    color: 'var(--ink-muted)',
  },
];

// 1 Animated Shop Sign near Alex's Tech / Corner Store (s5: x: 32, y: 51)
const SHOP_SIGN_LOC = { x: 32, y: 51 };

export const AmbientLife: React.FC<AmbientLifeProps> = ({ map }) => {
  const manualOverride = useMapStore((s) => s.ambientOverride);
  const { ambientEnabled, prefersReducedMotion } = usePerformanceGuard(manualOverride);

  const [positions, setPositions] = useState<
    Record<string, { startPx: { x: number; y: number }; endPx: { x: number; y: number } }>
  >({});
  const [shopSignPx, setShopSignPx] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const updatePositions = () => {
      const newPos: Record<
        string,
        { startPx: { x: number; y: number }; endPx: { x: number; y: number } }
      > = {};

      AMBIENT_ENTITIES.forEach((e) => {
        const [lng1, lat1] = percentToLngLat(e.start.x, e.start.y);
        const [lng2, lat2] = percentToLngLat(e.end.x, e.end.y);
        const p1 = map.project([lng1, lat1]);
        const p2 = map.project([lng2, lat2]);
        newPos[e.id] = { startPx: { x: p1.x, y: p1.y }, endPx: { x: p2.x, y: p2.y } };
      });
      setPositions(newPos);

      const [signLng, signLat] = percentToLngLat(SHOP_SIGN_LOC.x, SHOP_SIGN_LOC.y);
      const signP = map.project([signLng, signLat]);
      setShopSignPx({ x: signP.x, y: signP.y });
    };

    updatePositions();
    map.on('render', updatePositions);

    return () => {
      map.off('render', updatePositions);
    };
  }, [map]);

  return (
    <div
      data-testid="ambient-life-layer"
      className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden z-[6]"
      aria-hidden="true"
    >
      {/* 1. Animated Shop Sign: Alex's Tech / Corner Store */}
      {shopSignPx && (
        <div
          data-testid="ambient-shop-sign"
          className="absolute pointer-events-none"
          style={{
            left: shopSignPx.x,
            top: shopSignPx.y - 34,
            transform: 'translateX(-50%)',
          }}
        >
          <motion.div
            className="ambient px-2 py-0.5 rounded-pill bg-panel-light/75 border border-line/40 shadow-sm flex items-center gap-1 font-data text-[9px] font-semibold text-ink tracking-[0.5px] uppercase leading-none max-w-[140px] truncate"
            style={{
              backgroundColor: 'rgba(239, 231, 218, 0.75)',
            }}
            animate={
              ambientEnabled && !prefersReducedMotion
                ? { opacity: [0.85, 1, 0.9, 1, 0.7, 1] }
                : { opacity: 0.9 }
            }
            transition={
              ambientEnabled && !prefersReducedMotion
                ? { duration: 4, repeat: Infinity, ease: 'easeInOut' }
                : undefined
            }
          >
            <div className="w-3.5 h-3.5 rounded-full overflow-hidden border border-line shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Character portraits/Alex.png" alt="Alex" className="w-full h-full object-cover" />
            </div>
            <span className="truncate">ALEX&apos;S TECH</span>
          </motion.div>
        </div>
      )}

      {/* 2. Moving Ambient Entities (Cars and Pedestrians) */}
      {AMBIENT_ENTITIES.map((entity) => {
        const pos = positions[entity.id];
        if (!pos) return null;

        const dx = pos.endPx.x - pos.startPx.x;
        const dy = pos.endPx.y - pos.startPx.y;
        const isCar = entity.type === 'car';

        return (
          <div
            key={entity.id}
            data-testid={`ambient-${entity.id}`}
            className="absolute pointer-events-none"
            style={{ left: pos.startPx.x, top: pos.startPx.y }}
          >
            <motion.div
              className={`ambient flex items-center justify-center ${
                isCar ? 'w-3 h-1.5 rounded-[2px]' : 'w-1.5 h-1.5 rounded-full'
              }`}
              style={{
                backgroundColor: entity.color,
                opacity: 0.6,
              }}
              animate={
                ambientEnabled && !prefersReducedMotion
                  ? {
                      x: [0, dx, 0],
                      y: [0, dy, 0],
                    }
                  : { x: 0, y: 0 }
              }
              transition={
                ambientEnabled && !prefersReducedMotion
                  ? {
                      duration: entity.duration,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }
                  : undefined
              }
            />
          </div>
        );
      })}
    </div>
  );
};
