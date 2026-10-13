import { Button } from '@/components/ui/Button';

export default function FailureHero({ params }: { params: { nodeId: string } }) {
  return (
    <main className="flex h-full w-full min-h-0 items-center justify-center bg-danger text-white p-6">
      <div className="w-full bg-danger/80 p-8 rounded-md shadow-card border border-line text-center">
        <h1 className="font-heading text-4xl mb-2">SYSTEM LOCKOUT</h1>
        <p className="font-data text-xs opacity-80 uppercase tracking-widest mb-8">Intrusion Detected at Node {params.nodeId}</p>
        
        <div className="space-y-4 font-data text-sm text-left bg-danger/90 p-4 rounded-md mb-8">
          <div className="flex justify-between items-center text-money">
            <span>SECURITY FINE</span><span className="text-xl font-bold">$100</span>
          </div>
          <div className="flex justify-between items-center text-panel-light">
            <span>LOCKOUT TIMER</span><span className="text-xl font-bold">02:00</span>
          </div>
        </div>
        
        <Button variant="secondary" fullWidth href="/map">
          DISCONNECT
        </Button>
      </div>
    </main>
  );
}
