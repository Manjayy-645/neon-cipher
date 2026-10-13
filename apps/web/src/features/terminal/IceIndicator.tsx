import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';

export const IceIndicator: React.FC<{ ice: string }> = ({ ice }) => {
  const [open, setOpen] = useState(false);
  
  if (ice === 'None') return null;
  
  const getDesc = (type: string) => {
    switch (type) {
      case 'Liar': return "One clue per guess is fake. Don't trust everything.";
      case 'Drift': return "The code shifts by one digit every 3 attempts. Watch your timing.";
      case 'Pot-only': return "Pans are suppressed. You only see exact matches.";
      case 'Ghost': return "Pots and Pans are combined into a single generic hit count.";
      case 'Sticky': return "Dead keys might occasionally re-enable themselves.";
      default: return "Unknown ICE detected.";
    }
  };

  return (
    <div className="relative z-40">
      <Button 
        variant="ghost"
        compact
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={`Security ICE protocol: ${ice}. Tap for details.`}
        className="flex items-center gap-1.5 !px-2 !py-1 !rounded bg-danger/20 !border-danger/50 text-danger-text text-[10px] tracking-widest uppercase hover:bg-danger/30 focus-visible:ring-danger"
      >
        <span className="w-2 h-2 rounded-sm bg-danger animate-pulse" />
        ICE: {ice}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
            className="absolute top-full left-0 mt-2 w-48 bg-panel-dark border border-danger text-panel-light p-3 rounded-sm shadow-card text-sm font-data"
          >
            <div className="font-bold text-danger mb-1">{ice} Protocol</div>
            <div className="text-ink-muted italic leading-tight">
               &quot;{getDesc(ice)}&quot; - Nix
            </div>
            
            {/* Overlay to catch clicks outside */}
            <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
