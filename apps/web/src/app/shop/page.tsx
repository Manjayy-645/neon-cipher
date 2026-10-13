import { Button } from '@/components/ui/Button';

export default function ShopHero() {
  return (
    <main className="flex h-full w-full min-h-0 flex-col bg-panel text-ink">
      {/* Vendor Visual Area */}
      <div className="flex-1 relative flex items-center justify-center border-b border-line bg-panel-light">
        <div className="text-center relative z-10">
          <h1 className="font-heading text-4xl text-ink">Black Market</h1>
          <p className="font-data text-ink-muted tracking-widest uppercase mt-2">Vendor: Glitch</p>
        </div>
      </div>

      {/* Store Interface */}
      <div className="flex-1 bg-panel-light p-6 overflow-y-auto">
        <div className="flex justify-between items-end mb-6 border-b border-line pb-2">
          <h2 className="font-heading text-2xl text-ink">Exploits</h2>
          <div className="font-data text-money-text font-bold">Wallet: $12,450</div>
        </div>

        <div className="grid gap-4">
          {[
            { name: 'Static Injector', cost: 300, desc: 'Scrambles opponent keypad' },
            { name: 'Firewall Patch', cost: 450, desc: 'Blocks incoming sabotage' },
            { name: 'Snoop Packet', cost: 750, desc: 'Reveals opponent hidden move' },
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center p-4 bg-panel border border-line rounded-md shadow-card">
              <div>
                <h3 className="font-heading text-lg text-ink">{item.name}</h3>
                <p className="font-data text-[10px] text-ink-muted uppercase">{item.desc}</p>
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
