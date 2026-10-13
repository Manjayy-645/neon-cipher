'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMapStore } from '../../stores/map-store';
import { DISTRICTS, NODES } from './map-data';
import { MapMarker } from './MapMarker';
import { DistrictLabel } from './DistrictLabel';

import { useCampaignStore } from '../../stores/campaign-store';

export const MapWorld: React.FC = () => {
  const { nodes, selected, bridgeUnlocked: mapBridgeUnlocked, selectNode } = useMapStore() as any;
  const campaignBridgeUnlocked = useCampaignStore((s) => s.unlocks.bridge);
  const bridgeUnlocked = mapBridgeUnlocked || campaignBridgeUnlocked;
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [view, setView] = useState({ x: 0, y: 0, z: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const panStartRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const pinchStartRef = useRef({ d: 0, z: 1 });
  
  const clampView = useCallback((newX: number, newY: number, newZ: number, cw: number, ch: number) => {
    const z = Math.max(1, Math.min(newZ, 3.5));
    const base = Math.max(cw, ch) / 1000;
    const s = z * base;
    const mapW = 1000 * s;
    const mapH = 1000 * s;
    
    let x = newX;
    let y = newY;
    
    const minX = cw - mapW;
    const minY = ch - mapH;
    
    if (mapW <= cw) {
      x = (cw - mapW) / 2;
    } else {
      x = Math.max(minX, Math.min(0, x));
    }
    
    if (mapH <= ch) {
      y = (ch - mapH) / 2;
    } else {
      y = Math.max(minY, Math.min(0, y));
    }
    
    return { x, y, z, s };
  }, []);

  const updateView = useCallback((x: number, y: number, z: number, cw: number, ch: number) => {
    const clamped = clampView(x, y, z, cw, ch);
    setView({ x: clamped.x, y: clamped.y, z: clamped.z });
  }, [clampView]);

  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    updateView(0, 0, 1, rect.width, rect.height);
  }, [updateView]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    setIsAnimating(false);
    
    if (e.isPrimary) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
      containerRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanning || !containerRef.current) return;
    
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    
    const rect = containerRef.current.getBoundingClientRect();
    updateView(panStartRef.current.vx + dx, panStartRef.current.vy + dy, view.z, rect.width, rect.height);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsPanning(false);
    if (containerRef.current && containerRef.current.hasPointerCapture(e.pointerId)) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }
  };
  
  const handleWheel = (e: React.WheelEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZ = view.z * zoomDelta;
    
    // Zoom around cursor
    const base = Math.max(rect.width, rect.height) / 1000;
    const oldS = view.z * base;
    const newS = newZ * base;
    
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;
    
    const mapCursorX = (cursorX - view.x) / oldS;
    const mapCursorY = (cursorY - view.y) / oldS;
    
    const newX = cursorX - mapCursorX * newS;
    const newY = cursorY - mapCursorY * newS;
    
    updateView(newX, newY, newZ, rect.width, rect.height);
  };
  
  const zoomTo = useCallback((xPercent: number, yPercent: number, targetZoom: number) => {
    if (!containerRef.current) return;
    setIsAnimating(true);
    const rect = containerRef.current.getBoundingClientRect();
    
    const base = Math.max(rect.width, rect.height) / 1000;
    const s = targetZoom * base;
    
    const mapX = (xPercent / 100) * 1000 * s;
    const mapY = (yPercent / 100) * 1000 * s;
    
    // Offset for sheet (assume center of upper half)
    const targetScreenX = rect.width / 2;
    const targetScreenY = rect.height / 3;
    
    const newX = targetScreenX - mapX;
    const newY = targetScreenY - mapY;
    
    updateView(newX, newY, targetZoom, rect.width, rect.height);
  }, [updateView]);

  useEffect(() => {
    if (selected) {
      zoomTo(selected.x, selected.y, 2.5);
    }
  }, [selected, zoomTo]);

  const baseScale = containerRef.current 
    ? Math.max(containerRef.current.getBoundingClientRect().width, containerRef.current.getBoundingClientRect().height) / 1000 
    : 1;
  const s = view.z * baseScale;
  
  const showLabels = view.z < 1.05;

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-hidden bg-panel touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
    >
      <div 
        className={`absolute top-0 left-0 w-[1000px] h-[1000px] origin-top-left will-change-transform ${isAnimating ? 'transition-transform duration-350 ease-out' : ''}`}
        style={{ 
          transform: `translate(${view.x}px, ${view.y}px) scale(${s})`,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          '--s': s 
        } as any}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/map-master.jpg" alt="City Map" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
        
        {/* Haze for locked commercial zone */}
        <div 
          className="absolute top-0 bottom-0 right-0 w-[50%] pointer-events-none transition-opacity duration-[600ms] ease-out motion-reduce:transition-none"
          style={{ 
            opacity: bridgeUnlocked ? 0 : 0.5,
            background: 'linear-gradient(to right, transparent 0%, var(--overlay-haze-locked, #919190) 14%, var(--overlay-haze-locked, #919190) 100%)',
          }}
        />
        
        {showLabels ? (
          DISTRICTS.map((d: any) => (
            <DistrictLabel 
              key={d.zone}
              name={d.name}
              x={d.x}
              y={d.y}
            />
          ))
        ) : (
          (nodes as any[])?.map((node: any) => (
            <MapMarker 
              key={node.id}
              node={node}
            />
          ))
        )}
      </div>
    </div>
  );
};
