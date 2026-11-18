'use client';

import { useState } from 'react';
import { applyRigPreset, computeEffectiveRigStats, normalizeHardwareId, RIG_HARDWARE_MODULES, type RigPreset } from '@neon-cipher/game-rules';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { RigStateResponse } from './rigService';

export function PresetPreview({ preset, rig, onApply, onClose }: {
  preset: RigPreset;
  rig: RigStateResponse;
  onApply: (id: RigPreset['id']) => Promise<void>;
  onClose: () => void;
}) {
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const owned = new Set(Object.entries(rig.inventory).filter(([, qty]) => qty > 0).map(([id]) => normalizeHardwareId(id)).filter((id) => id !== null));
  for (const [id, item] of Object.entries(rig.hardware)) {
    const normalized = normalizeHardwareId(id);
    if (item.installed && normalized) owned.add(normalized);
  }
  const result = applyRigPreset(preset.id, [...owned]);
  const example = { tier: 2, attempts: 8, timerSeconds: 60, bounty: 100, digits: 4 };
  const before = computeEffectiveRigStats(example, rig.equippedRails);
  const after = computeEffectiveRigStats(example, result.equipped);
  const apply = async () => {
    setApplying(true);
    setError(null);
    try { await onApply(preset.id); onClose(); }
    catch { setError('Could not apply this preset. Your connection may be unavailable. Try again.'); }
    finally { setApplying(false); }
  };
  return <Modal label="Preview rig preset" onClose={onClose} dismissible={!applying} className="bg-panel-light border border-line rounded-t-lg p-4 shadow-sheet"
    header={<div className="border-b border-line pb-3"><p className="font-data text-xs text-ink-muted uppercase">Alex&apos;s build notes</p><h2 className="font-heading text-2xl">{preset.name}</h2></div>}
    footer={<div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={onClose} disabled={applying} className="flex-1">Cancel</Button><Button variant="primary" onClick={apply} loading={applying} disabled={applying || result.equippedCount === 0} className="flex-1">Apply owned parts</Button></div>}>
    <div className="space-y-4 font-data text-xs leading-relaxed py-3">
      <p>{preset.alexNote}</p>
      {error && <p role="alert" className="text-danger-text">{error}</p>}
      <p className="border border-line bg-panel rounded-md p-3">No credits spent. This replaces the current rail configuration with the owned parts listed below. Missing modules are not purchased. Consumable tools stay unchanged.</p>
      <ul className="space-y-3">{Object.entries(preset.modules).map(([slot, id]) => id && <li key={slot} className="border-b border-line pb-2"><strong className="block">{RIG_HARDWARE_MODULES[id].name} · {owned.has(id) ? 'Owned' : 'Missing'}</strong><span>{RIG_HARDWARE_MODULES[id].mechanicalEffect}</span>{RIG_HARDWARE_MODULES[id].tradeOff && <p className="text-ink-muted">{RIG_HARDWARE_MODULES[id].tradeOff}</p>}</li>)}</ul>
      <section aria-label="Example preset stat comparison" className="bg-panel border border-line rounded-md p-3">
        <h3 className="font-semibold mb-2">Example: Tier 2 / 4 digits / base $100</h3>
        <p>Eligible node effects vary by tier. Preview uses only your owned parts and assumes they are operational; burned parts require repair before their effects apply.</p>
        <dl className="grid grid-cols-2 gap-2 mt-2"><dt>Attempts</dt><dd>{before.maxAttempts} → {after.maxAttempts}</dd><dt>Timer</dt><dd>{before.timerSeconds}s → {after.timerSeconds}s</dd><dt>Bounty</dt><dd>${before.effectiveBounty} → ${after.effectiveBounty}</dd><dt>Dead digits revealed</dt><dd>{before.autoDeadDigitsCount} → {after.autoDeadDigitsCount}</dd></dl>
      </section>
      {result.equippedCount === 0 && <p className="text-danger-text">None of this preset&apos;s parts are owned. Browse hardware in Market to build it.</p>}
    </div>
  </Modal>;
}
