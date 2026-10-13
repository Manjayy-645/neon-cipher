'use client';

import { useState, useEffect } from 'react';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';

export interface PerformanceGuardResult {
  ambientEnabled: boolean;
  isLowBattery: boolean;
  isLowEndHardware: boolean;
  prefersReducedMotion: boolean;
}

export function usePerformanceGuard(manualAmbientOverride?: 'auto' | 'enabled' | 'disabled'): PerformanceGuardResult {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isLowBattery, setIsLowBattery] = useState(false);
  const [isLowEndHardware, setIsLowEndHardware] = useState(false);

  useEffect(() => {
    // 1. Check Hardware Resources (low core count or low device memory)
    if (typeof navigator !== 'undefined') {
      const lowCores = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
      const lowMemory = typeof (navigator as any).deviceMemory === 'number' && (navigator as any).deviceMemory <= 4;
      if (lowCores || lowMemory) {
        setIsLowEndHardware(true);
      }
    }

    // 2. Check Battery Status via navigator.getBattery()
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      let batteryRef: any = null;
      const updateBattery = () => {
        if (!batteryRef) return;
        // Low battery condition: 20% or less and not plugged in
        const low = !batteryRef.charging && batteryRef.level <= 0.20;
        setIsLowBattery(low);
      };

      (navigator as any).getBattery().then((battery: any) => {
        batteryRef = battery;
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch(() => {
        // Battery API blocked or unsupported
      });

      return () => {
        if (batteryRef) {
          batteryRef.removeEventListener('levelchange', updateBattery);
          batteryRef.removeEventListener('chargingchange', updateBattery);
        }
      };
    }
  }, []);

  if (manualAmbientOverride === 'disabled') {
    return {
      ambientEnabled: false,
      isLowBattery,
      isLowEndHardware,
      prefersReducedMotion,
    };
  }

  if (manualAmbientOverride === 'enabled') {
    return {
      ambientEnabled: !prefersReducedMotion, // always respect reduced motion even in dev override
      isLowBattery,
      isLowEndHardware,
      prefersReducedMotion,
    };
  }

  const ambientEnabled = !prefersReducedMotion && !isLowBattery && !isLowEndHardware;

  return {
    ambientEnabled,
    isLowBattery,
    isLowEndHardware,
    prefersReducedMotion,
  };
}
