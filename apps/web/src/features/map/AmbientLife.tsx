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

// 1 Animated Shop Sign near Alex's Tech / Corner Store (s5 / n4: x: 34, y: 48)
const SHOP_SIGN_LOC = { x: 34, y: 48 };

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
      setPositions((prev) => {
        const prevKeys = Object.keys(prev);
        const newKeys = Object.keys(newPos);
        if (prevKeys.length !== newKeys.length) return newPos;
        for (const key of newKeys) {
          const p = prev[key];
          const n = newPos[key];
          if (
            !p ||
            Math.abs(p.startPx.x - n.startPx.x) > 0.01 ||
            Math.abs(p.startPx.y - n.startPx.y) > 0.01 ||
            Math.abs(p.endPx.x - n.endPx.x) > 0.01 ||
            Math.abs(p.endPx.y - n.endPx.y) > 0.01
          ) {
            return newPos;
          }
        }
        return prev;
      });

      const [signLng, signLat] = percentToLngLat(SHOP_SIGN_LOC.x, SHOP_SIGN_LOC.y);
      const signP = map.project([signLng, signLat]);
      setShopSignPx((prev) =>
        prev && Math.abs(prev.x - signP.x) <= 0.01 && Math.abs(prev.y - signP.y) <= 0.01
          ? prev
          : { x: signP.x, y: signP.y }
      );
    };

    updatePositions();
    map.on('move', updatePositions);
    map.on('render', updatePositions);

    return () => {
      map.off('move', updatePositions);
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
          className="absolute pointer-events-none z-[12]"
          style={{
            left: shopSignPx.x,
            top: shopSignPx.y - 42,
            transform: 'translateX(-50%)',
          }}
        >
          <motion.div
            className="ambient px-2.5 py-1 rounded-[10px] bg-panel-light border-[2px] border-accent shadow-card flex items-center gap-2 max-w-[210px] select-none"
            animate={
              ambientEnabled && !prefersReducedMotion
                ? { scale: [1, 1.03, 1] }
                : { scale: 1 }
            }
            transition={
              ambientEnabled && !prefersReducedMotion
                ? { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
                : undefined
            }
          >
            <div className="relative w-6 h-6 rounded-full overflow-hidden border-2 border-accent shrink-0 shadow-sm bg-panel">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Character portraits/Alex.png" alt="Alex" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col min-w-0 pr-0.5">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-heading font-black text-[12px] sm:text-[13px] text-ink tracking-[1px] uppercase truncate drop-shadow-sm">
                  ALEX&apos;S TECH
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" aria-hidden="true" />
              </div>
              <span className="font-data text-[8px] font-bold text-accent-text tracking-[1.2px] leading-tight uppercase truncate">
                HARDWARE BENCH
              </span>
            </div>
          </motion.div>
          {/* Pointer tail pointing down to node */}
          <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-accent mx-auto" />
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
