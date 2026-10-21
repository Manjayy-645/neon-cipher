'use client';

import { Button } from '@/components/ui/Button';
import { usePlayerStore } from '@/stores/player-store';

export default function ShopHero() {
  const credits = usePlayerStore((s) => s.credits);

  return (
    <main className="scene-ground scene-arrive flex h-full w-full min-h-0 flex-col text-ink">
      {/* Vendor Visual Area with Storefront Scene */}
      <div className="relative min-h-[160px] sm:min-h-[200px] flex items-center justify-center border-b border-line overflow-hidden p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Shop and scenes/shop-front.png"
          alt="Black Market Storefront"
          className="absolute inset-0 w-full h-full object-cover brightness-60 contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-panel-light via-panel-light/70 to-black/30 pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10 bg-panel/85 backdrop-blur-xs p-3.5 sm:p-4 rounded-[12px] border border-line shadow-sheet">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[8px] border border-line bg-panel overflow-hidden shadow-card shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Character portraits/Glitch.png" alt="Glitch" className="w-full h-full object-cover" />
          </div>
          <div className="text-left">
            <span className="font-data text-[10px] tracking-widest text-ink-muted uppercase">LOCATION // SLUMS DISTRICT</span>
            <h1 className="font-heading text-2xl sm:text-3xl text-ink">Black Market</h1>
            <p className="font-data text-ink-muted text-xs tracking-wider uppercase mt-0.5">Vendor: Glitch</p>
          </div>
        </div>
      </div>

      {/* Store Interface */}
      <div className="flex-1 bg-panel-light p-6 overflow-y-auto">
        <div className="flex justify-between items-end mb-6 border-b border-line pb-2">
          <h2 className="font-heading text-2xl text-ink">Exploits</h2>
          <div className="font-data text-money-text font-bold">Wallet: ${credits.toLocaleString()}</div>
        </div>

        <div className="grid gap-4">
          {[
            { name: 'Static Injector', cost: 300, desc: 'Scrambles opponent keypad', icon: '/icons/icon-static-injector.svg' },
            { name: 'Firewall Patch', cost: 450, desc: 'Blocks incoming sabotage', icon: '/icons/icon-firewall-patch.svg' },
            { name: 'Snoop Packet', cost: 750, desc: 'Reveals opponent hidden move', icon: '/icons/icon-snoop-packet.svg' },
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center p-4 bg-panel border border-line rounded-md shadow-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-panel-light border border-line p-1 shrink-0 flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.icon} alt={item.name} className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-heading text-lg text-ink">{item.name}</h3>
                  <p className="font-data text-[10px] text-ink-muted uppercase">{item.desc}</p>
                </div>
              </div>
              <Button variant="compact">
                ${item.cost}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
