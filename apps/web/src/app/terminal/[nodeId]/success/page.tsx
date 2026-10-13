import { Button } from '@/components/ui/Button';

export default async function SuccessHero({
  params,
}: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = await params;

  return (
    <main className="scene-ground scene-arrive flex h-full w-full min-h-0 items-center justify-center overflow-y-auto p-4 sm:p-6">
      <section
        aria-labelledby="breach-success-title"
        className="relative w-full max-w-md overflow-hidden rounded-lg border border-line bg-panel-light p-5 text-ink shadow-card sm:p-7"
      >
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-accent" />
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-accent/40 bg-accent/10 text-accent-text">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m4 12 5 5L20 6" />
            </svg>
          </div>
          <div>
            <span className="type-label block text-accent-text">FIELD REPORT // NODE {nodeId}</span>
            <h1 id="breach-success-title" className="font-heading text-3xl leading-tight">Clean breach.</h1>
          </div>
        </div>

        <div className="mb-5 flex items-center justify-between border-y border-line py-3">
          <span className="type-label">SIGNAL STATUS</span>
          <span className="rounded-pill border border-accent/40 bg-accent/10 px-2.5 py-1 font-data text-[11px] font-semibold uppercase tracking-wider text-accent-text">
            Decrypted
          </span>
        </div>

        <div className="mb-6 space-y-3 rounded-md border border-line bg-panel p-4 font-data text-sm">
          <div className="flex justify-between border-b border-line pb-2">
            <span className="text-ink-muted">Base bounty</span><span>$650</span>
          </div>
          <div className="flex justify-between border-b border-line pb-2 text-danger-text">
            <span>Exploit deduction</span><span>-$95</span>
          </div>
          <div className="flex justify-between pt-1 font-semibold text-money-text">
            <span>Net transfer</span><span>$555</span>
          </div>
        </div>

        <Button variant="primary" fullWidth href="/map">
          BACK TO THE STREETS
        </Button>
      </section>
    </main>
  );
}
