'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from './authService';
import { usePlayerStore } from '@/stores/player-store';
import { useSettingsStore } from '@/stores/settings-store';
import { soundFx } from '@/lib/audio';
import { Button } from '@/components/ui/Button';

import { PLAYER_AVATARS } from '@neon-cipher/game-rules';

const AVAILABLE_AVATARS = PLAYER_AVATARS;

const PRESET_ACCOUNTS = [
  { handle: 'ZERO_COOL', avatarUrl: '/Character portraits/Player avatars.png', desc: 'Standard Decker ($12,500)' },
  { handle: 'PHREAK', avatarUrl: '/Character portraits/Player avatars (2).png', desc: 'Pro Hacker ($3,200)' },
];

export function LoginScreen() {
  const router = useRouter();
  const player = usePlayerStore();
  const settings = useSettingsStore();

  const [handle, setHandle] = useState('ZERO_COOL');
  const [selectedAvatar, setSelectedAvatar] = useState('/Character portraits/Player avatars.png');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateHandle = (val: string): string | null => {
    const clean = val.trim().toUpperCase();
    if (clean.length < 3) return 'Callsign must be at least 3 characters.';
    if (clean.length > 12) return 'Callsign cannot exceed 12 characters.';
    if (!/^[A-Z0-9_]+$/.test(clean)) return 'Only letters, numbers, and underscores allowed.';
    return null;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const valError = validateHandle(handle);
    if (valError) {
      setError(valError);
      soundFx.playWarning();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await authService.login(handle.trim().toUpperCase(), selectedAvatar);
      
      // Update caches
      player.setBalances(res.wallet.credits, res.wallet.coins);
      player.setInventory(res.wallet.inventory);
      player.setEquippedTools(res.wallet.equippedTools);
      usePlayerStore.setState({
        handle: res.profile.handle,
        avatarUrl: res.profile.avatarUrl,
      });

      settings.setLocalSettings(res.settings);

      soundFx.playSuccess();
      router.push('/map');
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
      soundFx.playWarning();
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_ACCOUNTS[0]) => {
    setHandle(preset.handle);
    setSelectedAvatar(preset.avatarUrl);
    setError(null);
    soundFx.playUiBeep();
  };

  return (
    <div className="scene-ground scene-arrive h-full w-full flex flex-col justify-between p-5 font-data text-ink overflow-y-auto">
      {/* Top Banner / Nix Mentor microcopy */}
      <div className="bg-panel-light border border-line p-3.5 rounded-md shadow-card flex items-start gap-3 shrink-0">
        <div className="w-8 h-8 rounded-full border border-accent overflow-hidden shrink-0">
          <img src="/Character portraits/Nix.png" alt="Nix" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="type-label text-[10px] text-accent-text font-bold">NIX TRANSMISSION</span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          </div>
          <p className="text-xs text-ink mt-0.5 leading-relaxed">
            Signal stable. Lock is local. Enter your decker callsign and configure your transceiver identity.
          </p>
        </div>
      </div>

      {/* Main Login Form */}
      <form onSubmit={handleSubmit} className="my-auto space-y-5 max-w-[400px] w-full mx-auto py-4">
        <div>
          <span className="type-label text-[10px] text-ink-muted tracking-[1.5px] uppercase block mb-1">
            LOCAL SYSTEM AUTHENTICATION
          </span>
          <h1 className="font-heading text-2xl text-ink tracking-wide">
            JACK IN TO GRID
          </h1>
        </div>

        {/* Callsign Input */}
        <div className="space-y-1.5">
          <label htmlFor="callsign-input" className="type-label text-[11px] block">
            DECKER CALLSIGN
          </label>
          <div className="relative">
            <input
              id="callsign-input"
              type="text"
              value={handle}
              onChange={(e) => {
                setHandle(e.target.value.toUpperCase());
                setError(null);
              }}
              maxLength={12}
              placeholder="E.G. ZERO_COOL"
              className="w-full h-12 bg-panel-light border border-line rounded-sm px-3 font-data text-base font-bold tracking-[1.5px] text-ink placeholder:text-ink-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none"
              autoComplete="off"
              spellCheck="false"
            />
            <span className="absolute right-3 top-3.5 font-data text-xs text-ink-muted">
              {handle.length}/12
            </span>
          </div>

          {error ? (
            <p className="text-xs text-danger-text font-semibold flex items-center gap-1.5 mt-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>{error}</span>
            </p>
          ) : (
            <p className="text-[11px] text-ink-muted">
              3-12 alphanumeric characters or underscores.
            </p>
          )}
        </div>

        {/* Avatar Selection */}
        <div className="space-y-2">
          <label className="type-label text-[11px] block">
            AVATAR TRANSCEIVER GLYPH
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {AVAILABLE_AVATARS.map((av) => {
              const isSelected = selectedAvatar === av.url;
              return (
                <Button
                  key={av.id}
                  variant="secondary"
                  onClick={() => {
                    setSelectedAvatar(av.url);
                    soundFx.playUiBeep();
                  }}
                  className={`min-h-[52px] p-1.5 rounded-[8px] flex flex-col items-center justify-center transition-all relative ${
                    isSelected
                      ? 'bg-accent/15 border-accent ring-2 ring-accent/30'
                      : ''
                  }`}
                  title={av.name}
                  aria-label={`Select ${av.name} avatar`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={av.url} alt={av.name} className="w-9 h-9 object-cover rounded-sm" />
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent" />
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Preset Rigs (Quick Select) */}
        <div className="space-y-1.5 pt-1">
          <span className="type-label text-[10px] text-ink-muted block">
            REGISTERED RECON RIGS
          </span>
          <div className="flex gap-2">
            {PRESET_ACCOUNTS.map((preset) => (
              <Button
                key={preset.handle}
                variant="secondary"
                onClick={() => handleSelectPreset(preset)}
                className={`flex-1 text-left justify-start items-start flex-col h-auto py-2 px-2.5 ${
                  handle === preset.handle
                    ? 'border-accent bg-accent/10 font-bold text-accent-text'
                    : ''
                }`}
              >
                <span className="font-data text-xs normal-case tracking-normal">{preset.handle}</span>
                <span className="text-[10px] opacity-70 normal-case tracking-normal font-normal">{preset.desc}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Primary JACK IN Button */}
        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={loading}
          className="mt-4 shadow-card"
        >
          JACK IN
        </Button>
      </form>

      {/* Footer System Disclaimer */}
      <div className="text-center shrink-0 pt-2 border-t border-line">
        <span className="type-label text-[9.5px] text-ink-muted">
          LOW MERIDIAN SUBNET • SECURE PEER PROTOCOL • NO WALLET REQUIRED
        </span>
      </div>
    </div>
  );
}
