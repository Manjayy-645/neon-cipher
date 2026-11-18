'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/stores/settings-store';
import { usePlayerStore } from '@/stores/player-store';
import { authService } from '../auth/authService';
import { soundFx } from '@/lib/audio';
import { ReducedMotionMode } from './types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { BottomDrawer } from '@/components/ui/BottomDrawer';
import { useCampaignStore } from '@/stores/campaign-store';
import { ClueMarks } from '@/features/terminal/components/ClueMarks';

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
  const [isResetting, setIsResetting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
    try {
      setIsResetting(true);
      const result = await authService.resetCampaign();
      player.syncWallet(result.account.wallet);
      useCampaignStore.getState().syncCampaign(result.campaign);
      setConfirmReset(false);
      setStatusMessage('Campaign progress and starter wallet reset.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage('Failed to reset campaign.');
    } finally {
      setIsResetting(false);
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
    <>
      <Modal label="Settings configuration" onClose={() => handleClose?.()}
        className="scene-ground border-t border-line rounded-t-lg shadow-sheet text-ink font-data"
        header={(
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-line bg-panel shrink-0">
          <div className="flex items-center gap-3">
            <img src="/icons/icon-settings.svg" alt="" className="w-6 h-6 object-contain pointer-events-none" aria-hidden="true" />
            <div>
              <h2 className="font-heading text-title tracking-wide text-ink">SETTINGS</h2>
              <p className="type-label text-[10px] text-ink-muted">Gameplay, accessibility, audio & account</p>
            </div>
          </div>
          <Button
            variant="icon"
            onClick={() => handleClose?.()}
            aria-label="Close settings"
          >
            <img src="/icons/icon-close.svg" alt="" className="w-5 h-5 object-contain pointer-events-none" aria-hidden="true" />
          </Button>
        </div>
        )}>
        {/* Status notification toast */}
        {statusMessage && (
          <div role="status" aria-live="polite" className="bg-accent/15 border-b border-accent px-4 py-2 text-accent-text text-xs flex items-center justify-between">
            <span>{statusMessage}</span>
            <Button
              variant="ghost"
              compact
              onClick={() => setStatusMessage(null)}
              aria-label="Dismiss status notification"
              className="text-accent-text hover:text-ink px-2 h-auto min-h-[44px] border-none flex items-center justify-center p-1"
            >
              <img src="/icons/icon-close.svg" alt="" className="w-3.5 h-3.5 object-contain pointer-events-none" aria-hidden="true" />
            </Button>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 pb-12 pb-safe-bottom space-y-6">
          
          <h3 className="font-heading text-xl border-b border-line pb-2">Gameplay</h3>
          {/* 1. Rookie Assist vs Pro Mode */}
          <section className="space-y-2 border-b border-line pb-4">
            <div className="flex items-center justify-between">
              <label className="type-label">HACKING CONSOLE MODE</label>
              <span className="text-xs font-bold text-accent-text">
                {store.rookieAssist ? 'ROOKIE ASSIST' : 'PRO MODE'}
              </span>
            </div>
            <div role="group" aria-label="Hacking console mode" className="grid grid-cols-2 gap-2">
              <Button
                aria-pressed={store.rookieAssist}
                variant={store.rookieAssist ? 'primary' : 'secondary'}
                onClick={() => {
                  store.saveSettings({ rookieAssist: true });
                  soundFx.playUiBeep();
                }}
                className="text-xs"
              >
                {store.rookieAssist && <span aria-hidden="true">✓ </span>}Rookie Assist
              </Button>
              <Button
                aria-pressed={!store.rookieAssist}
                variant={!store.rookieAssist ? 'primary' : 'secondary'}
                onClick={() => {
                  store.saveSettings({ rookieAssist: false });
                  soundFx.playUiBeep();
                }}
                className="text-xs"
              >
                {!store.rookieAssist && <span aria-hidden="true">✓ </span>}Pro Mode
              </Button>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              {store.rookieAssist
                ? 'Nix auto-eliminates dead keys on the terminal keypad and flags duplicate code tests.'
                : 'Clean terminal with zero assistance. All keypad keys active, manual deduction required.'}
            </p>
          </section>

          {/* 5. Daily Spend Limit */}
          <section className="space-y-2 border-b border-line pb-4">
            <div className="flex items-center justify-between">
              <label className="type-label">DAILY SPEND LIMIT</label>
              <span className="text-xs font-bold text-money-text">
                {store.dailySpendLimit ? `$${store.dailySpendLimit.toLocaleString()}` : 'UNLIMITED'}
              </span>
            </div>
            <div role="group" aria-label="Daily spend limit" className="grid grid-cols-4 gap-2">
              {[null, 1000, 5000, 20000].map((limit) => (
                <Button
                  key={limit === null ? 'none' : limit}
                  aria-pressed={store.dailySpendLimit === limit}
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

          <h3 className="font-heading text-xl border-b border-line pb-2">Accessibility</h3>
          {/* 2. Reduced Motion Override */}
          <section className="space-y-2 border-b border-line pb-4">
            <div className="flex items-center justify-between">
              <label className="type-label">MOTION PREFERENCE</label>
              <span className="text-xs font-bold uppercase text-ink">
                {store.reducedMotion}
              </span>
            </div>
            <div role="group" aria-label="Motion preference" className="grid grid-cols-3 gap-2">
              {(['system', 'reduced', 'full'] as ReducedMotionMode[]).map((mode) => (
                <Button
                  key={mode}
                  aria-pressed={store.reducedMotion === mode}
                  variant={store.reducedMotion === mode ? 'primary' : 'secondary'}
                  onClick={() => {
                    store.saveSettings({ reducedMotion: mode });
                    soundFx.playUiBeep();
                  }}
                  className="text-xs px-2"
                >
                  {store.reducedMotion === mode && <span aria-hidden="true">✓ </span>}{mode}
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
                aria-pressed={!store.colorBlindMode}
                variant={!store.colorBlindMode ? 'primary' : 'secondary'}
                onClick={() => {
                  store.saveSettings({ colorBlindMode: false });
                  soundFx.playUiBeep();
                }}
                className="text-xs px-3"
              >
                {!store.colorBlindMode && <span aria-hidden="true">✓ </span>}Standard (Color+Shape)
              </Button>
              <Button
                aria-pressed={store.colorBlindMode}
                variant={store.colorBlindMode ? 'primary' : 'secondary'}
                onClick={() => {
                  store.saveSettings({ colorBlindMode: true });
                  soundFx.playUiBeep();
                }}
                className="text-xs px-3"
              >
                {store.colorBlindMode && <span aria-hidden="true">✓ </span>}Shape-Only
              </Button>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Counts summarize the whole guess, not matching digit positions. Shape-Only uses monochrome symbols as well as labels.
            </p>
          </section>

          <div data-testid="settings-clue-preview" className="border border-line rounded-sm p-3 bg-panel-light space-y-2">
            <p className="font-bold text-sm">Live clue preview</p>
            <div data-surface="terminal" className="bg-terminal-panel border border-terminal-line rounded-sm p-3 text-terminal-ink">
              <ClueMarks pans={1} pots={1} length={3} />
            </div>
            <p className="text-xs leading-relaxed text-ink-muted">Pan: 1 correct digit in the correct slot. Pot: 1 correct digit in a different slot. Miss: 1 digit absent from the code.</p>
          </div>
          <h3 className="font-heading text-xl border-b border-line pb-2">Audio</h3>
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
                className="text-xs text-accent-text border-none h-auto min-h-[44px] px-2"
              >
                Test Sound
              </Button>
            </div>

            {/* Top-Level Master Mute Switch */}
            <div className="flex items-center justify-between p-2.5 rounded-[6px] bg-panel border border-line">
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-ink">MASTER MUTE</span>
                <span className="text-[10px] text-ink-muted">Mute all audio outputs</span>
              </div>
              <Button
                variant={store.masterMute ? 'danger' : 'secondary'}
                compact
                role="switch"
                aria-checked={store.masterMute}
                onClick={() => {
                  const nextMute = !store.masterMute;
                  store.saveSettings({ masterMute: nextMute });
                  if (!nextMute) {
                    soundFx.playUiBeep();
                  }
                }}
                data-testid="master-mute-toggle"
                className="text-xs px-3 min-h-[44px]"
              >
                {store.masterMute ? 'MUTED' : 'UNMUTED'}
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
                className="w-full min-h-[44px] bg-panel rounded-lg cursor-pointer accent-accent"
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
                className="w-full min-h-[44px] bg-panel rounded-lg cursor-pointer accent-accent"
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
                className="w-full min-h-[44px] bg-panel rounded-lg cursor-pointer accent-accent"
                aria-label="Ambient audio volume"
              />
            </div>
          </section>

          <h3 className="font-heading text-xl border-b border-line pb-2">Account</h3>
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
                variant="secondary"
                fullWidth
                onClick={() => setConfirmReset(true)}
                className="border-danger/40 text-danger-text hover:bg-danger/10"
              >
                Reset Campaign Progress
              </Button>
            </div>
          </section>

        </div>
      </Modal>
      <BottomDrawer
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="RESET CAMPAIGN?"
      footer={(
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="danger"
              size="full"
              onClick={handleResetCampaign}
              loading={isResetting}
              disabled={isResetting}
            >
              RESET CAMPAIGN
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="full"
              onClick={() => setConfirmReset(false)}
              disabled={isResetting}
            >
              CANCEL
            </Button>
          </div>
      )}
      >
        <div className="space-y-4">
          <p className="text-xs text-ink-muted leading-relaxed">
            This clears chapter and node progress, campaign unlocks, and wallet
            history. Your balance and tool inventory return to the starter
            values. Your callsign and settings stay unchanged.
          </p>

        </div>
      </BottomDrawer>
    </>
  );
}
