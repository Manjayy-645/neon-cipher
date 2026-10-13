import TerminalScreen from '@/features/terminal/TerminalScreen';

export default function TerminalPage({ params }: { params: { nodeId: string } }) {
  return (
    <div className="w-full h-full relative bg-ink" data-surface="terminal">
      <TerminalScreen nodeId={params.nodeId} />
    </div>
  );
}
