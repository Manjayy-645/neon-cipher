import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { TargetDirectory } from '../TargetDirectory';
import { useMapStore } from '@/stores/map-store';
import { useCampaignStore } from '@/stores/campaign-store';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { getNodes } from '../nodeService';

beforeEach(() => {
  act(() => {
    useMapStore.getState().resetMapState();
    useCampaignStore.setState({ unlocks: { bridge: false, blackMarket: false, onlinePlay: false } });
    useOnboardingStore.setState({ step: 'done', skipped: true, crackedNodes: {} });
  });
});

describe('City target directory', () => {
  it('selects the same target dossier and district as the map without starting a breach', () => {
    render(<TargetDirectory />);
    const node = getNodes().find((entry) => entry.district === 'commercial')!;
    fireEvent.change(screen.getByRole('combobox', { name: 'Select a city target' }), { target: { value: node.id } });
    expect(useMapStore.getState()).toMatchObject({ activeNodeId: node.id, selectedNodeId: node.id, selectedDistrict: 'commercial', view: 'node', sheetState: 'half' });
    expect(useCampaignStore.getState().unlocks.bridge).toBe(false);
  });

  it('names locked targets and their actual Chapter 3 requirement', () => {
    render(<TargetDirectory />);
    const node = getNodes().find((entry) => entry.requiresUnlock)!;
    expect(screen.getByRole('option', { name: new RegExp(node.name) })).toHaveTextContent('Locked — Chapter 3');
  });

  it('keeps onboarding target restrictions and uses owned state after a breach', () => {
    useOnboardingStore.setState({ step: 'map.district', skipped: false, crackedNodes: { n1: { crackedAt: 0, cooldownMs: 0 } } });
    render(<TargetDirectory />);
    expect(screen.getByRole('option', { name: /Rusty Soda Machine/ })).toBeDisabled();
    expect(screen.getByRole('option', { name: /Rusty Soda Machine/ })).toHaveTextContent('Owned');
    expect(screen.getByRole('option', { name: /Market Register/ })).toBeEnabled();
  });
});
