import TerminalScreen from '@/features/terminal/TerminalScreen';

export default async function TerminalPage({
  params,
}: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = await params;

  return (
    <div className="w-full h-full relative bg-terminal-bg text-terminal-ink" data-surface="terminal">
      <TerminalScreen nodeId={nodeId} />
    </div>
  );
}
