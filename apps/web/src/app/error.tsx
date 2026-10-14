'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Application route failed to render:', error);
  }, [error]);

  return (
    <div className="scene-ground scene-arrive h-full w-full flex flex-col justify-between p-6 font-data text-ink">
      <div className="bg-panel-light border border-line p-3.5 rounded-md">
        <span className="type-label text-[10px] text-danger-text font-bold">
          CONNECTION INTERRUPTED
        </span>
      </div>

      <div className="my-auto max-w-[420px] w-full mx-auto space-y-4 text-center">
        <div
          className="w-14 h-14 rounded-full bg-panel-light border-2 border-danger text-danger mx-auto flex items-center justify-center font-bold text-2xl"
          aria-hidden="true"
        >
          !
        </div>

        <div>
          <h1 className="font-heading text-2xl text-ink">PAGE NOT READY</h1>
          <p className="text-xs text-ink-muted mt-2 leading-relaxed">
            This page could not finish loading. Try again, or return to the map.
          </p>
          {error.digest && (
            <p className="text-[10px] text-ink-muted mt-2">
              Signal reference: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            type="button"
            variant="primary"
            size="full"
            onClick={reset}
          >
            RETRY
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="full"
            onClick={() => router.replace('/map')}
          >
            RETURN TO MAP
          </Button>
        </div>
      </div>

      <div className="text-center pt-2 border-t border-line">
        <span className="type-label text-[9.5px] text-ink-muted">
          YOUR PROGRESS IS STILL HERE
        </span>
      </div>
    </div>
  );
}
