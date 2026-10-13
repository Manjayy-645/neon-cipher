import { Button } from '@/components/ui/Button';

export default function SuccessHero({ params }: { params: { nodeId: string } }) {
  return (
    <main className="flex h-full w-full min-h-0 items-center justify-center bg-accent text-white p-6">
      <div className="w-full bg-accent/80 p-8 rounded-md shadow-card border border-line text-center">
        <h1 className="font-heading text-4xl mb-2">BREACH SUCCESS</h1>
        <p className="font-data text-xs opacity-80 uppercase tracking-widest mb-8">Node {params.nodeId} Decrypted</p>
        
        <div className="space-y-3 font-data text-sm text-left bg-accent/90 p-4 rounded-md mb-8">
          <div className="flex justify-between border-b border-line pb-2">
            <span>Base Bounty</span><span>$650</span>
          </div>
          <div className="flex justify-between border-b border-line pb-2 text-danger">
            <span>Exploit Deduction (Slot Peek)</span><span>-$95</span>
          </div>
          <div className="flex justify-between pt-2 font-bold text-lg text-money">
            <span>NET TRANSFER</span><span>$555</span>
          </div>
        </div>
        
        <Button variant="secondary" fullWidth href="/map">
          COLLECT PAYOUT
        </Button>
      </div>
    </main>
  );
}
