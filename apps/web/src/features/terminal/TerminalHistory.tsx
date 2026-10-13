import { useSettingsStore } from '@/stores/settings-store';

export default function TerminalHistory({ 
  guesses, 
  digits, 
  ice 
}: { 
  guesses: { guess: string; pots: number; pans: number; totalHits?: number }[]; 
  digits: number;
  ice?: string;
}) {
  const colorBlindMode = useSettingsStore((s) => s.colorBlindMode);

  return (
    <div
      data-tutorial="history"
      className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3"
    >
      {guesses.length === 0 ? (
        <div className="h-full flex items-center justify-center text-ink-muted font-data opacity-50 uppercase text-xs tracking-widest">
          Awaiting Initial Input
        </div>
      ) : (
        guesses.map((g, i) => {
          // DISPLAY rules for ICE:
          // Pot-only: suppress pans entirely from the clue display.
          // Ghost: combine pots and pans into a single indistinguishable hit count.
          const showPans = ice !== 'Pot-only';
          const isGhost = ice === 'Ghost';
          const displayedPans = showPans ? g.pans : 0;
          const totalHits = g.totalHits !== undefined ? g.totalHits : (g.pots + displayedPans);
          const displayedMisses = Math.max(0, digits - totalHits);

          return (
            <div key={i} className="flex items-center justify-between bg-panel-dark px-4 py-3 rounded-lg border border-ink-muted">
              <div className="font-data text-2xl tracking-[0.3em] text-panel-light">{g.guess}</div>
              <div className="flex gap-1.5 items-center">
                {isGhost ? (
                  // Ghost: combined total, rendered as generic "hits" (e.g., diamond shape)
                  <>
                    {Array.from({ length: totalHits }).map((_, p) => (
                      <div key={'ghost-' + p} className="w-3 h-3 rotate-45 bg-accent/70" />
                    ))}
                    {Array.from({ length: displayedMisses }).map((_, p) => (
                      <div key={'miss-' + p} className="w-3 h-3 flex items-center justify-center">
                        <div className="w-2 h-0.5 bg-ink-muted" />
                      </div>
                    ))}
                  </>
                ) : colorBlindMode ? (
                  // Shape-only high-contrast monochrome clues (Color-blind mode)
                  <>
                    {/* Pot = Solid High-Contrast Square */}
                    {Array.from({ length: g.pots }).map((_, p) => (
                      <div
                        key={'pot-' + p}
                        title="Pot (Exact Slot)"
                        aria-label="Pot (Exact Slot)"
                        data-clue="pot-shape"
                        className="w-3.5 h-3.5 bg-panel-light text-ink border border-panel-light rounded-[2px] flex items-center justify-center font-data text-[9px] font-black shadow-sm"
                      >
                        ■
                      </div>
                    ))}
                    {/* Pan = Hollow Ring */}
                    {showPans && Array.from({ length: g.pans }).map((_, p) => (
                      <div
                        key={'pan-' + p}
                        title="Pan (Wrong Slot)"
                        aria-label="Pan (Wrong Slot)"
                        data-clue="pan-shape"
                        className="w-3.5 h-3.5 rounded-full border-2 border-panel-light flex items-center justify-center text-panel-light font-data text-[8px]"
                      >
                        ○
                      </div>
                    ))}
                    {/* Miss = Dash */}
                    {Array.from({ length: displayedMisses }).map((_, p) => (
                      <div
                        key={'miss-' + p}
                        title="Miss"
                        aria-label="Miss"
                        data-clue="miss-shape"
                        className="w-3.5 h-3.5 flex items-center justify-center"
                      >
                        <div className="w-2.5 h-0.5 bg-ink-muted" />
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {/* Standard Color + Shape: Pots = filled circle */}
                    {Array.from({ length: g.pots }).map((_, p) => (
                      <div key={'pot-' + p} className="w-3 h-3 rounded-full bg-accent" />
                    ))}
                    {/* Standard Color + Shape: Pans = ring */}
                    {showPans && Array.from({ length: g.pans }).map((_, p) => (
                      <div key={'pan-' + p} className="w-3 h-3 rounded-full border-2 border-money" />
                    ))}
                    {/* Miss = dash */}
                    {Array.from({ length: displayedMisses }).map((_, p) => (
                      <div key={'miss-' + p} className="w-3 h-3 flex items-center justify-center">
                        <div className="w-2 h-0.5 bg-ink-muted" />
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
