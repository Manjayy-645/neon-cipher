'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BottomDrawer } from '@/components/ui/BottomDrawer';
import { Button } from '@/components/ui/Button';
import { useOnboardingStore } from '../onboardingStore';
import { track } from '../analytics';
import { triggerToast } from '@/stores/toast-store';

export interface SavePromptDrawerProps {
  open: boolean;
}

export function SavePromptDrawer({ open }: SavePromptDrawerProps) {
  const router = useRouter();
  const { advance, saveAccount } = useOnboardingStore();

  const handleSave = () => {
    saveAccount();
    triggerToast('Accounts arrive in a later build');
    track('save_prompt_choice', { choice: 'save' });
    advance('done');
    track('onboarding_done');
    triggerToast('Onboarding complete. City Map unlocked.', { type: 'success' });
    router.push('/map');
  };

  const handleNotNow = () => {
    track('save_prompt_choice', { choice: 'not_now' });
    advance('done');
    track('onboarding_done');
    triggerToast('Onboarding complete. City Map unlocked.', { type: 'success' });
    router.push('/map');
  };

  return (
    <BottomDrawer
      open={open}
      onClose={handleNotNow}
      title="Save your progress?"
      footer={(
        <div className="flex flex-col gap-2.5 pt-2">
          <Button
            variant="primary"
            size="full"
            onClick={handleSave}
            data-testid="save-account-btn"
          >
            SAVE ACCOUNT
          </Button>
          <Button
            variant="ghost"
            size="full"
            onClick={handleNotNow}
            data-testid="not-now-btn"
          >
            NOT NOW
          </Button>
        </div>
      )}
    >
      <div className="flex flex-col gap-5 py-2">
        <p className="font-data text-xs sm:text-sm text-ink-muted leading-relaxed">
          Your progress lives on this device. An account keeps it safe and lets you duel.
        </p>

      </div>
    </BottomDrawer>
  );
}
