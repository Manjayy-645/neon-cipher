'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSystemStore } from '@/stores/system-store';
import { useSettingsStore } from '@/stores/settings-store';
import { usePlayerStore } from '@/stores/player-store';
import { useMapStore } from '@/stores/map-store';
import { authService } from '../auth/authService';
import { ReducedMotionMode } from '../settings/types';
import { Button } from '@/components/ui/Button';
import {
  featureFlags,
  FeatureFlag,
  isFeatureEnabled,
  setFeatureFlagOverride,
  clearFeatureFlagOverrides,
} from '@/lib/flags';
import { useCampaignStore } from '@/stores/campaign-store';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';

export function DevMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const system = useSystemStore();
  const settings = useSettingsStore();
  const player = usePlayerStore();
  const mapStore = useMapStore();
  const campaign = useCampaignStore();
  const [, setFlagTick] = useState(0);

  const toggleFlag = (flag: FeatureFlag) => {
    const current = isFeatureEnabled(flag);
    setFeatureFlagOverride(flag, !current);
    mapStore.bumpDevFlagTick();
    setFlagTick((t) => t + 1);
  };

  const unlockAllGates = () => {
    (Object.keys(featureFlags) as FeatureFlag[]).forEach((f) => {
      setFeatureFlagOverride(f, true);
    });
    mapStore.bumpDevFlagTick();
    mapStore.setBridgeUnlocked(true);
    useCampaignStore.setState({
      unlocks: {
        blackMarket: true,
        onlinePlay: true,
        bridge: true,
      },
    });
    setFlagTick((t) => t + 1);
  };

  const resetAllFlags = () => {
    clearFeatureFlagOverrides();
    mapStore.bumpDevFlagTick();
    setFlagTick((t) => t + 1);
  };

  const clearAllCooldowns = () => {
    useOnboardingStore.setState({ crackedNodes: {} });
  };

  const jumpToChapter = (chapterId: string) => {
    campaign.acceptChapter(chapterId);
    setIsOpen(false);
    router.push('/comms');
  };

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSwitchAccount = async (handle: string, avatarUrl: string) => {
    try {
      const res = await authService.login(handle, avatarUrl);
      player.setBalances(res.wallet.credits, res.wallet.coins);
      player.setInventory(res.wallet.inventory);
      player.setEquippedTools(res.wallet.equippedTools);
      usePlayerStore.setState({
        handle: res.profile.handle,
        avatarUrl: res.profile.avatarUrl,
      });
      settings.setLocalSettings(res.settings);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {/* Floating Dev trigger button */}
      <Button
        variant="secondary"
        compact
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[72px] right-3 z-40 !bg-ink !text-panel-light text-[10px] font-data font-bold !px-2.5 !py-1 !rounded border border-line shadow-md hover:!bg-black uppercase tracking-wider flex items-center gap-1 cursor-pointer focus-visible:outline-accent"
        aria-label="Open developer debug menu"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
        DEV MENU
      </Button>

      {/* Modal / Slide-over Drawer */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Developer Debug Menu"
          className="fixed inset-0 z-50 bg-black/60 -[2px] flex justify-end"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="scene-ground w-full max-w-[380px] h-full border-l border-line shadow-2xl flex flex-col font-data text-ink overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-panel-light shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <h2 className="font-data text-sm font-bold tracking-wider text-ink uppercase">
                  DEV CONTROL MATRIX
                </h2>
              </div>
              <Button
                variant="ghost"
                compact
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 !min-h-[32px] p-0 rounded border border-line flex items-center justify-center text-xs hover:bg-panel text-ink"
                aria-label="Close Dev Menu"
              >
                ✕
              </Button>
            </div>

            {/* Scrollable controls */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs">
              
              {/* SECTION 1: SCREENS & FLOWS */}
              <section className="space-y-2 border-b border-line pb-4">
                <div className="type-label text-[10px] text-ink-muted">HERO SCREENS & ROUTES</div>
                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    variant="secondary"
                    compact
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/splash');
                    }}
                    className="p-2 border border-line rounded-sm bg-panel-light hover:border-ink-muted text-left font-data font-semibold normal-case tracking-normal !justify-start w-full"
                  >
                    0.1 Splash / Boot
                  </Button>
                  <Button
                    variant="secondary"
                    compact
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/login');
                    }}
                    className="p-2 border border-line rounded-sm bg-panel-light hover:border-ink-muted text-left font-data font-semibold normal-case tracking-normal !justify-start w-full"
                  >
                    0.2 Login & Callsign
                  </Button>
                  <Button
                    variant="secondary"
                    compact
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/map');
                    }}
                    className="p-2 border border-line rounded-sm bg-panel-light hover:border-ink-muted text-left font-data font-semibold normal-case tracking-normal !justify-start w-full"
                  >
                    1.0 City Map
                  </Button>
                  <Button
                    variant="secondary"
                    compact
                    onClick={() => {
                      setIsOpen(false);
                      settings.openDrawer();
                    }}
                    className="p-2 border border-line rounded-sm bg-panel-light hover:border-ink-muted text-left font-data font-semibold normal-case tracking-normal !justify-start w-full"
                  >
                    6.0 Settings Drawer
                  </Button>
                  <Button
                    variant="secondary"
                    compact
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/profile');
                    }}
                    className="p-2 border border-line rounded-sm bg-panel-light hover:border-ink-muted text-left font-data font-semibold normal-case tracking-normal !justify-start w-full"
                  >
                    8.0 Profile Matrix
                  </Button>
                  <Button
                    variant="secondary"
                    compact
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/terminal/node-slums-01');
                    }}
                    className="p-2 border border-line rounded-sm bg-panel-light hover:border-ink-muted text-left font-data font-semibold normal-case tracking-normal !justify-start w-full"
                  >
                    2.0 Terminal (T1)
                  </Button>
                  <Button
                    variant="secondary"
                    compact
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/terminal/n4');
                    }}
                    className="p-2 border border-line rounded-sm bg-panel-light hover:border-ink-muted text-left font-data font-semibold normal-case tracking-normal !justify-start w-full"
                  >
                    2.1 Terminal (T2)
                  </Button>
                  <Button
                    variant="secondary"
                    compact
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/terminal/n6');
                    }}
                    className="p-2 border border-line rounded-sm bg-panel-light hover:border-ink-muted text-left font-data font-semibold normal-case tracking-normal !justify-start w-full"
                  >
                    2.2 Terminal (T3)
                  </Button>
                  <Button
                    variant="secondary"
                    compact
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/terminal/n7');
                    }}
                    className="p-2 border border-line rounded-sm bg-panel-light hover:border-ink-muted text-left font-data font-semibold normal-case tracking-normal !justify-start w-full"
                  >
                    2.3 Terminal (T4)
                  </Button>
                  <Button
                    variant="secondary"
                    compact
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/terminal/n13');
                    }}
                    className="p-2 border border-line rounded-sm bg-panel-light hover:border-ink-muted text-left font-data font-semibold normal-case tracking-normal !justify-start w-full"
                  >
                    2.4 Terminal (T5)
                  </Button>
                  <Button
                    variant="secondary"
                    compact
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/comms');
                    }}
                    className="p-2 border border-accent/40 rounded-sm bg-panel-light text-accent-text hover:border-accent text-left font-data font-semibold normal-case tracking-normal !justify-start w-full"
                  >
                    7.0 Comms & Briefings
                  </Button>
                  <Button
                    variant="secondary"
                    compact
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/duel');
                    }}
                    className="p-2 border border-accent/40 rounded-sm bg-panel-light text-accent-text hover:border-accent text-left font-data font-semibold normal-case tracking-normal !justify-start w-full"
                  >
                    4.0 1v1 Cipher Duel
                  </Button>
                  <Button
                    variant="secondary"
                    compact
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/duel/match/duel-01');
                    }}
                    className="p-2 border border-accent/40 rounded-sm bg-panel-light text-accent-text hover:border-accent text-left font-data font-semibold normal-case tracking-normal !justify-start w-full"
                  >
                    4.1 Duel Active Match
                  </Button>
                  <Button
                    variant="secondary"
                    compact
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/coop');
                    }}
                    className="p-2 border border-line rounded-sm bg-panel-light hover:border-ink-muted text-left font-data font-semibold normal-case tracking-normal !justify-start w-full"
                  >
                    5.0 Co-op Mode
                  </Button>
                  <Button
                    variant="secondary"
                    compact
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/codemaker');
                    }}
                    className="p-2 border border-line rounded-sm bg-panel-light hover:border-ink-muted text-left font-data font-semibold normal-case tracking-normal !justify-start w-full"
                  >
                    5.1 Codemaker
                  </Button>
                  <Button
                    variant="secondary"
                    compact
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/market');
                    }}
                    className="p-2 border border-money/40 rounded-sm bg-panel-light text-money-text hover:border-money text-left font-data font-semibold normal-case tracking-normal !justify-start w-full"
                  >
                    8.0 Black Market
                  </Button>
                  <Button
                    variant="secondary"
                    compact
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/rig');
                    }}
                    className="p-2 border border-line rounded-sm bg-panel-light hover:border-ink-muted text-left font-data font-semibold normal-case tracking-normal !justify-start w-full"
                  >
                    3.0 Decker Rig
                  </Button>
                  <Button
                    variant="secondary"
                    compact
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/error');
                    }}
                    className="p-2 border border-danger/40 rounded-sm bg-panel-light text-danger-text hover:border-danger text-left font-data font-semibold normal-case tracking-normal !justify-start w-full"
                  >
                    0.3 Error Page
                  </Button>
                  <Button
                    variant="secondary"
                    compact
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/maintenance');
                    }}
                    className="p-2 border border-money/40 rounded-sm bg-panel-light text-money-text hover:border-money text-left font-data font-semibold normal-case tracking-normal !justify-start w-full"
                  >
                    0.3 Maintenance
                  </Button>
                  <Button
                    variant="secondary"
                    compact
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/dev/icons');
                    }}
                    className="p-2 border border-line rounded-sm bg-panel-light hover:border-ink-muted text-left font-data font-semibold normal-case tracking-normal !justify-start w-full"
                  >
                    Icon Visualizer
                  </Button>
                  <Button
                    variant="secondary"
                    compact
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/dev/buttons');
                    }}
                    className="p-2 border border-line rounded-sm bg-panel-light hover:border-ink-muted text-left font-data font-semibold normal-case tracking-normal !justify-start w-full"
                  >
                    Button Matrix
                  </Button>
                </div>
              </section>

              {/* SECTION 1.5: LOCKED-OUT FEATURES & DEV GATES */}
              <section className="space-y-2 border-b border-line pb-4" data-testid="dev-locked-features-section">
                <div className="type-label text-[10px] text-ink-muted">LOCKED-OUT FEATURES & DEV GATES</div>
                
                {/* One-click bypass / clearance actions */}
                <div className="p-2 border border-line rounded-sm bg-panel-light space-y-2">
                  <div className="font-semibold text-[11px] text-ink">GLOBAL UNLOCK CHEATS</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      variant="primary"
                      compact
                      onClick={unlockAllGates}
                      className="p-1.5 text-[10px] font-bold text-center !justify-center"
                      data-testid="dev-unlock-all-gates"
                    >
                      ⚡ UNLOCK ALL GATES
                    </Button>
                    <Button
                      variant="secondary"
                      compact
                      onClick={resetAllFlags}
                      className="p-1.5 text-[10px] font-bold text-center !justify-center bg-panel border border-line"
                      data-testid="dev-reset-all-flags"
                    >
                      ↺ RESET FLAGS
                    </Button>
                    <Button
                      variant="secondary"
                      compact
                      onClick={() => {
                        const nextBridge = !mapStore.unlocks.bridge;
                        mapStore.setBridgeUnlocked(nextBridge);
                        useCampaignStore.setState((s) => ({
                          unlocks: { ...s.unlocks, bridge: nextBridge },
                        }));
                      }}
                      className="p-1.5 text-[10px] font-bold text-center !justify-center bg-panel border border-line"
                      data-testid="dev-toggle-bridge-btn"
                    >
                      {mapStore.unlocks.bridge ? 'BRIDGE: OPEN' : 'BRIDGE: LOCKED'}
                    </Button>
                    <Button
                      variant="secondary"
                      compact
                      onClick={clearAllCooldowns}
                      className="p-1.5 text-[10px] font-bold text-center !justify-center bg-panel border border-line"
                      data-testid="dev-clear-cooldowns"
                    >
                      CLEAR COOLDOWNS
                    </Button>
                  </div>
                </div>

                {/* Feature Flag Overrides */}
                <div className="p-2 border border-line rounded-sm bg-panel-light space-y-1.5">
                  <div className="flex justify-between items-center font-semibold text-[11px]">
                    <span>RUNTIME FEATURE FLAGS:</span>
                    <span className="text-[10px] text-ink-muted">CLICK TO TOGGLE</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {(Object.keys(featureFlags) as FeatureFlag[]).map((flag) => {
                      const enabled = isFeatureEnabled(flag);
                      return (
                        <Button
                          key={flag}
                          variant={enabled ? 'primary' : 'secondary'}
                          compact
                          onClick={() => toggleFlag(flag)}
                          className={`p-1 text-[10px] font-data font-bold flex items-center justify-between !px-2 ${
                            enabled ? 'bg-accent text-white' : 'bg-panel border border-line text-ink-muted'
                          }`}
                          data-testid={`dev-flag-toggle-${flag}`}
                        >
                          <span className="uppercase">{flag}</span>
                          <span className="text-[9px]">{enabled ? 'ON' : 'GATED'}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Campaign Chapter Jump */}
                <div className="p-2 border border-line rounded-sm bg-panel-light space-y-1.5">
                  <div className="font-semibold text-[11px] text-ink">CAMPAIGN CHAPTER JUMP:</div>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'chapter-1', label: 'CH 1: SLUMS' },
                      { id: 'chapter-2', label: 'CH 2: MARKET' },
                      { id: 'chapter-3', label: 'CH 3: BRIDGE' },
                      { id: 'chapter-4', label: 'CH 4: ROGUE' },
                      { id: 'chapter-5', label: 'CH 5: VAULT' },
                    ].map((ch) => (
                      <Button
                        key={ch.id}
                        variant="secondary"
                        compact
                        onClick={() => jumpToChapter(ch.id)}
                        className="py-1 text-[9px] font-bold bg-panel border border-line text-ink hover:border-ink-muted !justify-center"
                      >
                        {ch.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </section>

              {/* SECTION 2: SYSTEM STATES (0.3) */}
              <section className="space-y-2 border-b border-line pb-4">
                <div className="type-label text-[10px] text-ink-muted">SYSTEM STATES & BANNERS (0.3)</div>
                <div className="space-y-1.5">
                  {/* Disconnect toggle */}
                  <div className="flex items-center justify-between p-2 rounded-sm border border-line bg-panel-light">
                    <div>
                      <div className="font-semibold">Simulate Disconnect</div>
                      <div className="text-[10px] text-ink-muted">Triggers offline alert banner</div>
                    </div>
                    <Button
                      variant={system.simulatedOffline ? 'danger' : 'secondary'}
                      compact
                      onClick={() => system.setSimulatedOffline(!system.simulatedOffline)}
                      className={`px-2.5 py-1 text-[11px] font-bold ${
                        system.simulatedOffline
                          ? 'bg-danger text-white'
                          : 'bg-panel border border-line text-ink'
                      }`}
                    >
                      {system.simulatedOffline ? 'OFFLINE' : 'ONLINE'}
                    </Button>
                  </div>

                  {/* Reconnect banner trigger */}
                  <div className="flex items-center justify-between p-2 rounded-sm border border-line bg-panel-light">
                    <div>
                      <div className="font-semibold">Signal Restored Banner</div>
                      <div className="text-[10px] text-ink-muted">Green confirmation toast</div>
                    </div>
                    <Button
                      variant="primary"
                      compact
                      onClick={() => system.triggerReconnectedBanner()}
                      className="px-2.5 py-1 text-[11px] font-bold"
                    >
                      TRIGGER
                    </Button>
                  </div>

                  {/* Mid-Duel Desync */}
                  <div className="flex items-center justify-between p-2 rounded-sm border border-line bg-panel-light">
                    <div>
                      <div className="font-semibold">Mid-Duel Desync</div>
                      <div className="text-[10px] text-ink-muted">Turn timer frozen banner</div>
                    </div>
                    <Button
                      variant={system.midDuelDesync ? 'danger' : 'secondary'}
                      compact
                      onClick={() => system.setMidDuelDesync(!system.midDuelDesync, 30)}
                      className={`px-2.5 py-1 text-[11px] font-bold ${
                        system.midDuelDesync
                          ? 'bg-danger text-white'
                          : 'bg-panel border border-line text-ink'
                      }`}
                    >
                      {system.midDuelDesync ? 'DESYNCED' : 'NORMAL'}
                    </Button>
                  </div>

                  {/* Fullscreen Offline Notice */}
                  <div className="flex items-center justify-between p-2 rounded-sm border border-line bg-panel-light">
                    <div>
                      <div className="font-semibold">Offline Notice Modal</div>
                      <div className="text-[10px] text-ink-muted">Full protocol overlay</div>
                    </div>
                    <Button
                      variant="secondary"
                      compact
                      onClick={() => system.setOfflineNoticeVisible(true)}
                      className="px-2.5 py-1 bg-panel border border-line text-ink text-[11px] font-bold"
                    >
                      SHOW
                    </Button>
                  </div>

                  {/* Global Loading Overlay */}
                  <div className="flex items-center justify-between p-2 rounded-sm border border-line bg-panel-light">
                    <div>
                      <div className="font-semibold">Atmospheric Loading</div>
                      <div className="text-[10px] text-ink-muted">Terminal sync overlay</div>
                    </div>
                    <Button
                      variant={system.globalLoading ? 'primary' : 'secondary'}
                      compact
                      onClick={() => system.setGlobalLoading(!system.globalLoading)}
                      className={`px-2.5 py-1 text-[11px] font-bold ${
                        system.globalLoading
                          ? 'bg-accent text-white'
                          : 'bg-panel border border-line text-ink'
                      }`}
                    >
                      {system.globalLoading ? 'ACTIVE' : 'IDLE'}
                    </Button>
                  </div>
                </div>
              </section>

              {/* SECTION 3: WHOLE-APP ACCESSIBILITY MODES */}
              <section className="space-y-2 border-b border-line pb-4">
                <div className="type-label text-[10px] text-ink-muted">GLOBAL APP PREFERENCES</div>
                
                {/* Reduced Motion */}
                <div className="p-2 border border-line rounded-sm bg-panel-light space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span>Reduced Motion Override:</span>
                    <span className="font-data text-accent-text uppercase">{settings.reducedMotion}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(['system', 'reduced', 'full'] as ReducedMotionMode[]).map((m) => (
                      <Button
                        key={m}
                        variant={settings.reducedMotion === m ? 'primary' : 'secondary'}
                        compact
                        onClick={() => settings.saveSettings({ reducedMotion: m })}
                        className={`py-1 text-[11px] font-bold ${
                          settings.reducedMotion === m
                            ? 'bg-accent text-white'
                            : 'bg-panel border border-line text-ink'
                        }`}
                      >
                        {m}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Color-Blind Clue Mode */}
                <div className="flex items-center justify-between p-2 rounded-sm border border-line bg-panel-light">
                  <div>
                    <div className="font-semibold">Color-Blind Mode</div>
                    <div className="text-[10px] text-ink-muted">Shape-only clues across app</div>
                  </div>
                  <Button
                    variant={settings.colorBlindMode ? 'primary' : 'secondary'}
                    compact
                    onClick={() => settings.saveSettings({ colorBlindMode: !settings.colorBlindMode })}
                    className={`px-2.5 py-1 text-[11px] font-bold ${
                      settings.colorBlindMode
                        ? 'bg-accent text-white'
                        : 'bg-panel border border-line text-ink'
                    }`}
                  >
                    {settings.colorBlindMode ? 'SHAPE-ONLY' : 'DEFAULT'}
                  </Button>
                </div>

                {/* Rookie vs Pro Mode */}
                <div className="flex items-center justify-between p-2 rounded-sm border border-line bg-panel-light">
                  <div>
                    <div className="font-semibold">Terminal Mode</div>
                    <div className="text-[10px] text-ink-muted">Keypad elimination assistance</div>
                  </div>
                  <Button
                    variant={settings.rookieAssist ? 'primary' : 'secondary'}
                    compact
                    onClick={() => settings.saveSettings({ rookieAssist: !settings.rookieAssist })}
                    className={`px-2.5 py-1 text-[11px] font-bold ${
                      settings.rookieAssist
                        ? 'bg-accent text-white'
                        : 'bg-panel border border-line text-ink'
                    }`}
                  >
                    {settings.rookieAssist ? 'ROOKIE' : 'PRO'}
                  </Button>
                </div>
              </section>

              {/* SECTION 4: MAP ENVIRONMENT & AMBIENT LIFE */}
              <section className="space-y-2 border-b border-line pb-4">
                <div className="type-label text-[10px] text-ink-muted">MAP ENVIRONMENT & AMBIENT LIFE</div>
                <div className="p-2 border border-line rounded-sm bg-panel-light space-y-2">
                  <div className="flex justify-between font-semibold">
                    <span>Time of Day:</span>
                    <span className="font-data text-accent-text uppercase">{mapStore.timeOfDay}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(['day', 'dusk', 'night'] as const).map((t) => (
                      <Button
                        key={t}
                        variant={mapStore.timeOfDay === t ? 'primary' : 'secondary'}
                        compact
                        onClick={() => mapStore.setTimeOfDay(t)}
                        className={`py-1 text-[11px] font-bold ${
                          mapStore.timeOfDay === t
                            ? 'bg-accent text-white'
                            : 'bg-panel border border-line text-ink'
                        }`}
                      >
                        {t}
                      </Button>
                    ))}
                  </div>

                  <div className="flex justify-between font-semibold pt-1">
                    <span>Ambient Life:</span>
                    <span className="font-data text-accent-text uppercase">{mapStore.ambientOverride}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(['auto', 'enabled', 'disabled'] as const).map((o) => (
                      <Button
                        key={o}
                        variant={mapStore.ambientOverride === o ? 'primary' : 'secondary'}
                        compact
                        onClick={() => mapStore.setAmbientOverride(o)}
                        className={`py-1 text-[11px] font-bold ${
                          mapStore.ambientOverride === o
                            ? 'bg-accent text-white'
                            : 'bg-panel border border-line text-ink'
                        }`}
                      >
                        {o === 'enabled' ? 'FORCE ON' : o === 'disabled' ? 'OFF' : 'AUTO'}
                      </Button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-semibold">Bridge Zone Access:</span>
                    <Button
                      variant={mapStore.unlocks.bridge ? 'primary' : 'secondary'}
                      compact
                      onClick={() => mapStore.setBridgeUnlocked(!mapStore.unlocks.bridge)}
                      className={`px-2 py-0.5 text-[11px] font-bold ${
                        mapStore.unlocks.bridge ? 'bg-accent text-white' : 'bg-panel border border-line text-ink'
                      }`}
                    >
                      {mapStore.unlocks.bridge ? 'UNLOCKED' : 'LOCKED'}
                    </Button>
                  </div>
                </div>
              </section>

              {/* SECTION 5: ACCOUNT SWITCHER & CASH */}
              <section className="space-y-2 pb-2">
                <div className="type-label text-[10px] text-ink-muted">ACCOUNT & BANKROLL INJECTOR</div>
                <div className="p-2 border border-line rounded-sm bg-panel-light space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-data font-bold">{player.handle}</span>
                    <span className="font-data text-money-text font-semibold">
                      ${player.credits.toLocaleString()} / {player.coins}c
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      variant="secondary"
                      compact
                      onClick={() => handleSwitchAccount('ZERO_COOL', '/Character portraits/Player avatars.png')}
                      className="p-1.5 bg-panel border border-line text-[11px] hover:border-ink-muted normal-case tracking-normal block w-full text-center"
                    >
                      Load ZERO_COOL
                    </Button>
                    <Button
                      variant="secondary"
                      compact
                      onClick={() => handleSwitchAccount('PHREAK', '/Character portraits/Player avatars (2).png')}
                      className="p-1.5 bg-panel border border-line text-[11px] hover:border-ink-muted normal-case tracking-normal block w-full text-center"
                    >
                      Load PHREAK
                    </Button>
                  </div>

                  <div className="flex gap-1.5 pt-1">
                    <Button
                      variant="secondary"
                      compact
                      onClick={() => player.addCredits(1000)}
                      className="flex-1 py-1 bg-accent/15 border border-accent text-accent-text font-bold text-[11px]"
                    >
                      +$1,000 CR
                    </Button>
                    <Button
                      variant="secondary"
                      compact
                      onClick={() => usePlayerStore.setState({ coins: player.coins + 50 })}
                      className="flex-1 py-1 bg-money/15 border border-money text-money-text font-bold text-[11px]"
                    >
                      +50 COINS
                    </Button>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
