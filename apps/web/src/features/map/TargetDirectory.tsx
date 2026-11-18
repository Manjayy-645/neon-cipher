'use client';

import { useMapStore } from '@/stores/map-store';
import { useCampaignStore } from '@/stores/campaign-store';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { emit } from '@/features/onboarding/events';
import { CH2_NODE_ID } from '@/features/onboarding/steps';
import { getNodes, isSameNode } from './nodeService';

/** Keyboard and small-screen alternative to finding a marker on the city artwork. */
export function TargetDirectory() {
  const selectedId = useMapStore((state) => state.activeNodeId ?? state.selectedNodeId);
  const mapBridge = useMapStore((state) => state.unlocks.bridge);
  const campaignBridge = useCampaignStore((state) => state.unlocks.bridge);
  const step = useOnboardingStore((state) => state.step);
  const crackedNodes = useOnboardingStore((state) => state.crackedNodes);
  const nodes = getNodes();
  const selectedNode = nodes.find((node) => isSameNode(node.id, selectedId));
  const bridgeUnlocked = mapBridge || campaignBridge;

  return (
    <label className="flex min-w-0 flex-col gap-1 font-data text-[11px] text-ink-muted">
      <span className="uppercase tracking-wider">Find a city target</span>
      <select
        aria-label="Select a city target"
        data-testid="target-directory"
        value={selectedNode?.id ?? ''}
        className="min-h-[44px] w-full min-w-0 rounded-sm border border-line bg-panel-light px-3 text-[13px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
        onChange={(event) => {
          const node = nodes.find((entry) => entry.id === event.target.value);
          if (!node) return;
          emit({ type: 'map:nodeSelected', nodeId: node.id });
          const map = useMapStore.getState();
          map.selectNode(node.id);
          map.setSelectedDistrict(node.district);
        }}
      >
        <option value="" disabled>Choose a target to inspect</option>
        {(['slums', 'commercial'] as const).map((district) => (
          <optgroup key={district} label={district === 'slums' ? 'The Slums' : 'Commercial Strip'}>
            {nodes.filter((node) => node.district === district).map((node) => {
              const locked = node.requiresUnlock && !bridgeUnlocked;
              const owned = Object.keys(crackedNodes).some((id) => isSameNode(id, node.id));
              return (
                <option
                  key={node.id}
                  value={node.id}
                  disabled={step === 'map.district' && !isSameNode(node.id, CH2_NODE_ID)}
                >
                  {node.name} · Tier {node.tier} · {locked ? 'Locked — Chapter 3' : owned ? 'Owned' : node.status}
                </option>
              );
            })}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
