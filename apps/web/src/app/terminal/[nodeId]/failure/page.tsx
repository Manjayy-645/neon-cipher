import { Button } from '@/components/ui/Button';

export default async function FailureHero({
  params,
}: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = await params;

  return (
    <main className="scene-ground scene-arrive flex h-full w-full min-h-0 items-center justify-center overflow-y-auto p-4 sm:p-6">
      <section
        aria-labelledby="breach-failure-title"
        className="relative w-full max-w-md overflow-hidden rounded-lg border border-line bg-panel-light p-5 text-ink shadow-card sm:p-7"
      >
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-danger" />
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-danger/40 bg-danger/10 text-danger-text">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 8v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3l-8.5-14a2 2 0 0 0-3.4 0Z" />
            </svg>
          </div>
          <div>
            <span className="type-label block text-danger-text">FIELD REPORT // NODE {nodeId}</span>
            <h1 id="breach-failure-title" className="font-heading text-3xl leading-tight">The line went cold.</h1>
          </div>
        </div>

        <p className="mb-5 border-l-2 border-danger pl-3 font-data text-sm leading-relaxed text-ink-muted">
          ICE caught the intrusion before the last probe. The node is sealed for now.
        </p>

        <div className="mb-6 space-y-3 rounded-md border border-line bg-panel p-4 font-data text-sm">
          <div className="flex items-center justify-between text-danger-text">
            <span className="type-label text-danger-text">Security fine</span><span className="font-semibold">$100</span>
          </div>
          <div className="flex items-center justify-between border-t border-line pt-3">
            <span className="type-label">Lockout timer</span><span className="font-semibold text-ink">02:00</span>
          </div>
        </div>

        <Button variant="secondary" fullWidth href="/map">
          DISCONNECT TO MAP
        </Button>
      </section>
    </main>
  );
}
