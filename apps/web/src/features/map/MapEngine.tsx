'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { mapStyle } from './style';
import { MAP_BOUNDS, percentToLngLat } from './coordinates';
import { isFeatureEnabled } from '../../lib/flags';
import { getNodes, getNodeById } from './nodeService';
import { MapOverlay } from './MapOverlay';
import { FogLayer } from './FogLayer';
import { AmbientLife } from './AmbientLife';
import {
  CAMERA_PRESETS,
  CAMERA_EASE_DURATION,
  DISTRICT_ZOOM_THRESHOLD,
  easeOutCubic,
} from './camera';
import { useMapStore } from '../../stores/map-store';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';

import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { Button } from '@/components/ui/Button';

// Force Web Worker to load from CDN to bypass Turbopack worker-loading bugs
if (maplibregl.setWorkerUrl) {
  maplibregl.setWorkerUrl('https://unpkg.com/maplibre-gl@6.13.0/dist/maplibre-gl-worker.mjs');
}

// Global hook state so other components can trigger moves
let globalFlyToNode: ((x: number, y: number, zoom?: number, offset?: [number, number]) => void) | null = null;
let globalGetZoom: (() => number) | null = null;

export function useCityMap() {
  return {
    flyToNode: (x: number, y: number, zoom?: number, offset?: [number, number]) => {
      if (globalFlyToNode) globalFlyToNode(x, y, zoom, offset);
    },
    getZoom: () => {
      if (globalGetZoom) return globalGetZoom();
      return 0;
    }
  };
}

export default function MapEngine({ children }: { children?: React.ReactNode }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const [fps, setFps] = useState(0);
  const [zoom, setZoom] = useState(0);
  const [center, setCenter] = useState<[number, number]>([0, 0]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const showDevOverlay = isFeatureEnabled('devOverlay');

  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [0, 0],
      zoom: 3,
      minZoom: 2,
      maxZoom: 6,
      maxBounds: MAP_BOUNDS,
      dragRotate: false,
      pitchWithRotate: false,
      keyboard: false,
      attributionControl: false,
    });
    mapInstance.current = map;

    // Disable touch rotation completely
    mapInstance.current.touchZoomRotate.disableRotation();

    // Resize observer ensures canvas adapts if container size changes
    const resizeObserver = typeof window !== 'undefined' && typeof window.ResizeObserver !== 'undefined'
      ? new window.ResizeObserver(() => {
          map.resize();
        })
      : null;
    if (mapContainer.current && resizeObserver) {
      resizeObserver.observe(mapContainer.current);
    }

    const handleMapMovement = () => {
      if (!mapInstance.current) return;
      const nextZoom = Number(mapInstance.current.getZoom().toFixed(2));
      setZoom((prev) => (prev === nextZoom ? prev : nextZoom));

      if (showDevOverlay) {
        const c = mapInstance.current.getCenter();
        const nextLng = Number(c.lng.toFixed(2));
        const nextLat = Number(c.lat.toFixed(2));
        setCenter((prev) => (prev[0] === nextLng && prev[1] === nextLat ? prev : [nextLng, nextLat]));
      }
    };

    mapInstance.current.on('load', () => {
      if (mapInstance.current) {
        setIsMapLoaded(true);
        handleMapMovement();
      }
    });

    mapInstance.current.on('move', handleMapMovement);

    globalGetZoom = () => mapInstance.current?.getZoom() ?? 0;
    
    return () => {
      resizeObserver?.disconnect();
      globalFlyToNode = null;
      globalGetZoom = null;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    globalFlyToNode = (x: number, y: number, targetZoom?: number, offset?: [number, number]) => {
      if (!mapInstance.current) return;
      const [lng, lat] = percentToLngLat(x, y);
      
      if (prefersReducedMotion) {
        mapInstance.current.jumpTo({ center: [lng, lat], zoom: targetZoom, offset } as any);
      } else {
        mapInstance.current.flyTo({
          center: [lng, lat],
          zoom: targetZoom,
          offset,
          speed: 1.2, 
          curve: 1.4,
          easing: (t) => t * (2 - t), // easeOutQuad for ~400-700ms feel
        });
      }
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!showDevOverlay) return;
    let frameCount = 0;
    let lastTime = performance.now();
    let rAF: number;

    const loop = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }
      rAF = requestAnimationFrame(loop);
    };
    rAF = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rAF);
  }, [showDevOverlay]);

  const crackedNodes = useOnboardingStore((s) => s.crackedNodes);
  const nodes = useMemo(() => getNodes(), [crackedNodes]);
  const view = useMapStore((s) => s.view);
  const selectedDistrict = useMapStore((s) => s.selectedDistrict);
  const bridgeUnlocked = useMapStore((s) => s.unlocks.bridge);
  const selectedNodeId = useMapStore((s) => s.selectedNodeId);
  const timeOfDay = useMapStore((s) => s.timeOfDay);
  const stepBackView = useMapStore((s) => s.stepBackView);

  const lastCameraTarget = useRef<string>('');

  // Programmatic camera moves based on state machine
  useEffect(() => {
    if (!mapInstance.current || !isMapLoaded) return;

    const targetKey = `${view}:${selectedDistrict || ''}:${view === 'node' ? selectedNodeId || '' : ''}`;
    if (lastCameraTarget.current === targetKey) return;
    lastCameraTarget.current = targetKey;

    if (view === 'overview') {
      const preset = CAMERA_PRESETS.overview;
      mapInstance.current.easeTo({
        center: preset.center,
        zoom: preset.zoom,
        padding: preset.padding,
        duration: prefersReducedMotion ? 0 : CAMERA_EASE_DURATION,
        easing: easeOutCubic,
      });
    } else if (view === 'district') {
      const districtKey = selectedDistrict || 'slums';
      const preset = CAMERA_PRESETS[districtKey] || CAMERA_PRESETS.slums;
      mapInstance.current.easeTo({
        center: preset.center,
        zoom: preset.zoom,
        padding: preset.padding,
        duration: prefersReducedMotion ? 0 : CAMERA_EASE_DURATION,
        easing: easeOutCubic,
      });
    } else if (view === 'node' && selectedNodeId) {
      const node = getNodeById(selectedNodeId);
      if (node) {
        const [lng, lat] = percentToLngLat(node.x, node.y);
        const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
        const upwardOffset = -Math.round(vh * 0.20);
        mapInstance.current.easeTo({
          center: [lng, lat],
          zoom: 4.2,
          offset: [0, upwardOffset],
          duration: prefersReducedMotion ? 0 : CAMERA_EASE_DURATION,
          easing: easeOutCubic,
        });
      }
    }
  }, [view, selectedDistrict, selectedNodeId, isMapLoaded, prefersReducedMotion]);

  // Pinch-out / zoom listener: step back state if zooming out past threshold
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const handleZoomEnd = (e: any) => {
      if (e.originalEvent && map.getZoom() < DISTRICT_ZOOM_THRESHOLD) {
        const currentView = useMapStore.getState().view;
        if (currentView !== 'overview') {
          useMapStore.getState().stepBackView();
        }
      }
    };

    map.on('zoomend', handleZoomEnd);
    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, []);

  // Keyboard Escape listener to step back one state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const state = useMapStore.getState();
        if (state.isNixBubbleOpen) {
          return; // NixGuide handles its own escape
        }
        if (state.view !== 'overview') {
          e.preventDefault();
          state.stepBackView();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMapClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = target.closest(
      'button, [role="button"], a, input, select, textarea, [data-testid="node-sheet"]'
    );
    if (!isInteractive && view === 'node') {
      stepBackView();
    }
  };

  return (
    <div
      className="relative w-full h-full flex-1 bg-panel overflow-hidden"
      data-time={timeOfDay}
      onClick={handleMapClick}
    >
      <div 
        ref={mapContainer} 
        className="absolute inset-0 z-0 w-full h-full"
        style={{ touchAction: 'none' }}
      >
        {/* Optional grain overlay at under 4 percent opacity, behind markers, pointer-events none */}
        <div 
          data-testid="grain-overlay"
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none select-none z-[5]"
          style={{
            opacity: 0.035,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

      </div>

      {isMapLoaded && mapInstance.current && <AmbientLife map={mapInstance.current} />}
      <FogLayer />
      <div
        data-testid="time-of-day-tint"
        aria-hidden="true"
        className="absolute inset-0 z-[8] pointer-events-none transition-all duration-1000"
        style={{
          backgroundColor: 'var(--time-tint)',
          opacity: 'var(--time-tint-opacity)',
        }}
      />
      {isMapLoaded && mapInstance.current && (
        <MapOverlay map={mapInstance.current} nodes={nodes} zoom={zoom} />
      )}

      {showDevOverlay && (
        <div 
          data-testid="dev-overlay"
          className="absolute top-2 left-2 z-50 pointer-events-auto bg-panel-light border border-line rounded-sm p-2 shadow-card flex flex-col gap-1 font-data text-label text-ink-muted uppercase tracking-[1.5px]"
        >
          <div className="pointer-events-none">ZOOM: {zoom}</div>
          <div className="pointer-events-none">FPS: {fps}</div>
          <div className="pointer-events-none">CENTER: {center[0]}, {center[1]}</div>
          <Button 
            variant="primary"
            compact
            onClick={() => useMapStore.getState().setBridgeUnlocked(!bridgeUnlocked)}
            className="mt-1 !min-h-[44px] !px-2 !py-1 text-label tracking-[1.5px]"
          >
            Toggle Bridge
          </Button>
        </div>
      )}

      {children}
    </div>
  );
}
