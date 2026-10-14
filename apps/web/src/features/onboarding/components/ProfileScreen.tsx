'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { RESERVED_CALLSIGNS } from '../steps';
import { ONBOARDING_AVATARS, useOnboardingStore } from '../onboardingStore';
import { usePlayerStore } from '@/stores/player-store';
import { track } from '../analytics';

export function validateCallsign(input: string): { valid: boolean; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { valid: false, error: 'Callsign is required.' };
  }
  if (trimmed.length < 3) {
    return { valid: false, error: 'Callsign must be at least 3 characters.' };
  }
  if (trimmed.length > 16) {
    return { valid: false, error: 'Callsign cannot exceed 16 characters.' };
  }
  if (!/^[A-Za-z0-9_]+$/.test(trimmed)) {
    return { valid: false, error: 'Only letters, numbers, and underscores allowed.' };
  }
  const uppercased = trimmed.toUpperCase();
  if (RESERVED_CALLSIGNS.includes(uppercased)) {
    return { valid: false, error: 'That name is taken.' };
  }
  return { valid: true };
}

export interface AvatarOption {
  id: string;
  name: string;
  url: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = ONBOARDING_AVATARS;

export function ProfileScreen() {
  const router = useRouter();
  const { setProfile, advance } = useOnboardingStore();

  const [callsign, setCallsign] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(AVATAR_OPTIONS[0].id);
  const [touched, setTouched] = useState(false);

  const validation = validateCallsign(callsign);
  const showError = touched && !validation.valid;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-uppercase
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    setCallsign(val);
    setTouched(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.valid) return;

    const trimmed = callsign.trim().toUpperCase();
    const avatar = AVATAR_OPTIONS.find((option) => option.id === selectedAvatarId);
    if (!avatar) {
      throw new Error(`Selected avatar "${selectedAvatarId}" is not available.`);
    }
    setProfile(trimmed, selectedAvatarId);
    usePlayerStore.setState({ handle: trimmed, avatarUrl: avatar.url });
    track('profile_created', { callsign: trimmed, avatarId: selectedAvatarId });
    advance('map.overview');
    router.push('/map');
  };

  return (
    <div
      className="flex-1 w-full bg-panel text-ink flex flex-col justify-between p-6 select-none relative overflow-y-auto"
      data-surface="panel"
    >
      {/* Header */}
      <div className="pt-8 sm:pt-12 text-center max-w-sm mx-auto">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-wider text-ink">
          DECKER CALLSIGN
        </h1>
        <p className="font-data text-xs text-ink-muted uppercase tracking-[1px] mt-2">
          Choose how the city street relays know you
        </p>
      </div>

      {/* Main Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm mx-auto my-auto flex flex-col gap-6"
      >
        {/* Callsign Input */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="callsign-input"
            className="font-data text-xs font-semibold uppercase tracking-wider text-ink-muted"
          >
            HANDLE (3-16 CHARACTERS)
          </label>
          <div className="relative">
            <input
              id="callsign-input"
              type="text"
              maxLength={16}
              autoComplete="off"
              spellCheck="false"
              value={callsign}
              onChange={handleInputChange}
              onBlur={() => setTouched(true)}
              placeholder="ROOKIE"
              className={`w-full h-12 min-h-[44px] px-4 rounded-[8px] bg-panel-light border font-data text-base font-bold uppercase tracking-widest text-ink placeholder:text-ink-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                showError ? 'border-danger ring-1 ring-danger' : 'border-line'
              }`}
            />
          </div>
          {showError && (
            <span
              role="alert"
              className="font-data text-xs text-danger-text tracking-wider"
              data-testid="callsign-error"
            >
              {validation.error}
            </span>
          )}
        </div>

        {/* Avatar Grid (6-avatar grid, 44px+ min touch targets) */}
        <div className="flex flex-col gap-2">
          <span className="font-data text-xs font-semibold uppercase tracking-wider text-ink-muted">
            IDENTICON GLYPH
          </span>
          <div
            role="radiogroup"
            aria-label="Choose identicon avatar"
            className="grid grid-cols-3 gap-3"
          >
            {AVATAR_OPTIONS.map((opt) => {
              const isSelected = selectedAvatarId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedAvatarId(opt.id)}
                  className={`w-full h-14 min-w-[44px] min-h-[44px] rounded-[10px] border flex items-center justify-center relative transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    isSelected
                      ? 'border-accent bg-panel-light ring-2 ring-accent shadow-sm'
                      : 'border-line bg-panel hover:bg-panel-light'
                  }`}
                  aria-label={`Choose ${opt.name} avatar`}
                >
                  <div
                    className="w-10 h-10 rounded-full border border-line bg-panel-light overflow-hidden"
                  >
                    <img
                      src={opt.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Check badge when selected */}
                  {isSelected && (
                    <div
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold shadow-xs"
                      aria-hidden="true"
                    >
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="full"
            disabled={!validation.valid}
            reason={!validation.valid && touched ? validation.error : !callsign ? 'Enter a callsign' : undefined}
            data-testid="profile-submit-btn"
          >
            CONTINUE
          </Button>
        </div>
      </form>

      {/* Bottom spacer */}
      <div className="h-4 shrink-0" />
    </div>
  );
}
