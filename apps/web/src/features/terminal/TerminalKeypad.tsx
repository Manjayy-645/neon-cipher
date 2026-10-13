import React from 'react';
import { Button } from '@/components/ui/Button';

export default function TerminalKeypad({ 
  onKeyPress, 
  onBackspace, 
  onSubmit,
  disabledKeys = [],
  isSubmitDisabled = false
}: { 
  onKeyPress: (key: string) => void, 
  onBackspace: () => void,
  onSubmit: () => void,
  disabledKeys?: string[],
  isSubmitDisabled?: boolean
}) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', 'ENT'];

  return (
    <div
      data-tutorial="keypad"
      className="grid grid-cols-3 gap-3 p-4 bg-panel-dark rounded-t-lg border-t border-line shadow-sheet z-20"
    >
      {keys.map((key) => {
        const isDead = disabledKeys.includes(key);
        const isDisabled = isDead || (key === 'ENT' && isSubmitDisabled);
        
        return (
          <Button
            key={key}
            variant={key === 'ENT' ? 'primary' : key === 'CLR' ? 'danger' : 'secondary'}
            id={key === 'ENT' ? 'submit-guess-button' : undefined}
            data-tutorial={key === 'ENT' ? 'submit' : undefined}
            disabled={isDisabled}
            onClick={() => {
              if (key === 'CLR') onBackspace();
              else if (key === 'ENT') onSubmit();
              else onKeyPress(key);
            }}
            className={`!h-14 !rounded-md flex items-center justify-center !text-2xl font-bold tracking-normal ${
              isDisabled ? '!opacity-30 !bg-ink-muted !border-transparent !cursor-not-allowed !text-panel-light active:scale-100' : 
                key === 'ENT' ? '!bg-accent !border-accent-text !text-on-accent' : 
                key === 'CLR' ? '!bg-danger/20 !border-danger/50 !text-danger-text' :
                '!bg-ink !border-ink-muted !text-panel-light hover:!bg-ink-muted'}
            `}
          >
            {key}
          </Button>
        );
      })}
    </div>
  );
}
