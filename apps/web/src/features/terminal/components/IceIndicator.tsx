export default function IceIndicator({ type }: { type: 'Liar' | 'Ghost' | 'Drift' | 'Sticky' }) {
  return (
    <div className="flex items-center gap-2 bg-danger text-white px-3 py-1 rounded-full text-[10px] font-data tracking-widest uppercase">
      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
      ICE: {type}
    </div>
  );
}
