'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/stores/settings-store';
import { usePlayerStore } from '@/stores/player-store';
import { authService } from '../auth/authService';
import { soundFx } from '@/lib/audio';
import { ReducedMotionMode } from './types';
import { Button } from '@/components/ui/Button';

interface SettingsDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const router = useRouter();
  const store = useSettingsStore();
  const player = usePlayerStore();

  const isControlled = isOpen !== undefined;
  const activeOpen = isControlled ? isOpen : store.isDrawerOpen;
  const handleClose = isControlled ? onClose : store.closeDrawer;

  const [confirmReset, setConfirmReset] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!activeOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeOpen, handleClose]);

  if (!activeOpen) return null;

  const handleAudioChange = (key: 'keystrokes' | 'ui' | 'ambient', val: number) => {
    store.saveSettings({
      audio: {
        ...store.audio,
        [key]: val,
      },
    });
    if (key === 'keystrokes') soundFx.playKeystroke();
    if (key === 'ui') soundFx.playUiBeep();
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await authService.exportData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `neon-cipher-${player.handle.toLowerCase()}-backup.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setStatusMessage('Data archive exported successfully.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage('Failed to export account archive.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetCampaign = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    try {
      await authService.resetCampaign();
      player.setBalances(10000, 25);
      setConfirmReset(false);
      setStatusMessage('Campaign & starter balance reset.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage('Failed to reset campaign.');
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.logout();
      handleClose?.();
      router.push('/login');
    } catch {
      setStatusMessage('Failed to sign out.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Settings configuration"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70"
      onClick={() => handleClose?.()}
    >
      <div
        className="w-full max-w-[480px] max-h-[90vh] bg-panel-light border-t sm:border border-line rounded-t-lg sm:rounded-lg shadow-sheet flex flex-col overflow-hidden text-ink font-data"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line bg-panel shrink-0">
          <div>
            <h2 className="font-heading text-title tracking-wide text-ink">SETTINGS</h2>
            <p className="type-label text-[10px] text-ink-muted">DECK HARDWARE & ACCOUNT PARAMS</p>
          </div>
          <Button
            variant="icon"
            onClick={() => handleClose?.()}
            aria-label="Close settings"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Button>
        </div>

        {/* Status notification toast */}
        {statusMessage && (
          <div className="bg-accent/15 border-b border-accent px-4 py-2 text-accent-text text-xs flex items-center justify-between">
            <span>{statusMessage}</span>
            <Button variant="ghost" compact onClick={() => setStatusMessage(null)} aria-label="Dismiss status notification" className="text-accent font-bold px-2 h-auto min-h-[32px] border-none">✕</Button>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          
          {/* 1. Rookie Assist vs Pro Mode */}
          <section className="space-y-2 border-b border-line pb-4">
            <div className="flex items-center justify-between">
              <label className="type-label">HACKING CONSOLE MODE</label>
              <span className="text-xs font-bold text-accent-text">
                {store.rookieAssist ? 'ROOKIE ASSIST' : 'PRO MODE'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={store.rookieAssist ? 'primary' : 'secondary'}
                onClick={() => {
                  store.saveSettings({ rookieAssist: true });
                  soundFx.playUiBeep();
                }}
                className="text-xs"
              >
                Rookie Assist
              </Button>
              <Button
                variant={!store.rookieAssist ? 'primary' : 'secondary'}
                onClick={() => {
                  store.saveSettings({ rookieAssist: false });
                  soundFx.playUiBeep();
                }}
                className="text-xs"
              >
                Pro Mode
              </Button>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              {store.rookieAssist
                ? 'Nix auto-eliminates dead keys on the terminal keypad and flags duplicate code tests.'
                : 'Clean terminal with zero assistance. All keypad keys active, manual deduction required.'}
            </p>
          </section>

          {/* 2. Reduced Motion Override */}
          <section className="space-y-2 border-b border-line pb-4">
            <div className="flex items-center justify-between">
              <label className="type-label">MOTION PREFERENCE</label>
              <span className="text-xs font-bold uppercase text-ink">
                {store.reducedMotion}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['system', 'reduced', 'full'] as ReducedMotionMode[]).map((mode) => (
                <Button
                  key={mode}
                  variant={store.reducedMotion === mode ? 'primary' : 'secondary'}
                  onClick={() => {
                    store.saveSettings({ reducedMotion: mode });
                    soundFx.playUiBeep();
                  }}
                  className="text-xs px-2"
                >
                  {mode}
                </Button>
              ))}
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Global app motion override. Reduced motion suppresses ambient vehicle loops, camera inertia, and terminal scanline pulses.
            </p>
          </section>

          {/* 3. Color-Blind Clue Mode */}
          <section className="space-y-2 border-b border-line pb-4">
            <div className="flex items-center justify-between">
              <label className="type-label">CLUE DISPLAY MODE</label>
              <span className="text-xs font-bold text-ink">
                {store.colorBlindMode ? 'SHAPE-ONLY (HIGH CONTRAST)' : 'STANDARD'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={!store.colorBlindMode ? 'primary' : 'secondary'}
                onClick={() => {
                  store.saveSettings({ colorBlindMode: false });
                  soundFx.playUiBeep();
                }}
                className="text-xs px-3"
              >
                Standard (Color+Shape)
              </Button>
              <Button
                variant={store.colorBlindMode ? 'primary' : 'secondary'}
                onClick={() => {
                  store.saveSettings({ colorBlindMode: true });
                  soundFx.playUiBeep();
                }}
                className="text-xs px-3"
              >
                Shape-Only
              </Button>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              When Shape-Only is active, clue history uses high-contrast geometric monochrome shapes (solid diamond for Pot, open ring for Pan, dash for Miss).
            </p>
          </section>

          {/* 4. Audio Sliders */}
          <section className="space-y-3 border-b border-line pb-4">
            <div className="flex items-center justify-between">
              <label className="type-label">AUDIO LEVELS</label>
              <Button
                variant="ghost"
                compact
                onClick={() => {
                  soundFx.playKeystroke();
                  setTimeout(() => soundFx.playUiBeep(), 120);
                }}
                className="text-xs text-accent-text border-none h-auto min-h-[32px] px-2"
              >
                Test Sound
              </Button>
            </div>

            {/* Keystrokes */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-ink-muted">KEYSTROKES</span>
                <span className="font-data font-semibold">{store.audio.keystrokes}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={store.audio.keystrokes}
                onChange={(e) => handleAudioChange('keystrokes', parseInt(e.target.value, 10))}
                className="w-full h-2 bg-panel rounded-lg appearance-none cursor-pointer accent-accent"
                aria-label="Keystroke audio volume"
              />
            </div>

            {/* UI Sounds */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-ink-muted">UI SOUNDS</span>
                <span className="font-data font-semibold">{store.audio.ui}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={store.audio.ui}
                onChange={(e) => handleAudioChange('ui', parseInt(e.target.value, 10))}
                className="w-full h-2 bg-panel rounded-lg appearance-none cursor-pointer accent-accent"
                aria-label="UI sound audio volume"
              />
            </div>

            {/* Ambient */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-ink-muted">AMBIENT ATMOSPHERE</span>
                <span className="font-data font-semibold">{store.audio.ambient}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={store.audio.ambient}
                onChange={(e) => handleAudioChange('ambient', parseInt(e.target.value, 10))}
                className="w-full h-2 bg-panel rounded-lg appearance-none cursor-pointer accent-accent"
                aria-label="Ambient audio volume"
              />
            </div>
          </section>

          {/* 5. Daily Spend Limit */}
          <section className="space-y-2 border-b border-line pb-4">
            <div className="flex items-center justify-between">
              <label className="type-label">DAILY SPEND LIMIT</label>
              <span className="text-xs font-bold text-money-text">
                {store.dailySpendLimit ? `$${store.dailySpendLimit.toLocaleString()}` : 'UNLIMITED'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[null, 1000, 5000, 20000].map((limit) => (
                <Button
                  key={limit === null ? 'none' : limit}
                  variant={store.dailySpendLimit === limit ? 'primary' : 'secondary'}
                  onClick={() => {
                    store.saveSettings({ dailySpendLimit: limit });
                    soundFx.playUiBeep();
                  }}
                  className="text-xs px-1"
                >
                  {limit === null ? 'NONE' : `$${limit / 1000}K`}
                </Button>
              ))}
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Hardware spending governor to prevent rapid syndicate balance depletion during high-stakes breaches.
            </p>
          </section>

          {/* 6. Account Actions */}
          <section className="space-y-3 pt-1 pb-4">
            <div className="flex items-center justify-between">
              <label className="type-label">DECKER PROFILE</label>
              <span className="text-xs font-bold font-data text-ink">
                {player.handle}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Export Data */}
              <Button
                variant="secondary"
                onClick={handleExport}
                disabled={isExporting}
                loading={isExporting}
                className="text-xs gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {isExporting ? 'Exporting...' : 'Export Data'}
              </Button>

              {/* Sign Out */}
              <Button
                variant="secondary"
                onClick={handleSignOut}
                className="text-xs gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </Button>
            </div>

            {/* Reset Campaign */}
            <div className="pt-2">
              <Button
                variant={confirmReset ? 'danger' : 'secondary'}
                fullWidth
                onClick={handleResetCampaign}
                className={confirmReset ? 'animate-pulse' : 'border-danger/40 text-danger-text hover:bg-danger/10'}
              >
                {confirmReset ? 'CONFIRM PURGE: RESET CAMPAIGN?' : 'Reset Campaign Progress'}
              </Button>
              {confirmReset && (
                <div className="flex justify-between items-center mt-2 px-1">
                  <span className="text-[11px] text-danger-text">Resets bankroll to $10,000 and clears logs.</span>
                  <Button
                    variant="ghost"
                    compact
                    onClick={() => setConfirmReset(false)}
                    className="text-xs text-ink-muted underline font-semibold border-none h-auto min-h-[32px] px-2"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
