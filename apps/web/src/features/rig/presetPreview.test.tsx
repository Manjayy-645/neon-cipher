import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RIG_PRESETS } from '@neon-cipher/game-rules';
import { PresetPreview } from './PresetPreview';
import type { RigStateResponse } from './rigService';

const rig: RigStateResponse = { hardware: {}, equippedRails: {}, inventory: { memory_buffer_mk1: 1 }, equippedTools: ['cryo_spike'] };

describe('Rig preset decision safety', () => {
  it('shows owned/missing parts and example effects without applying until confirmed', async () => {
    const apply = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn();
    render(<PresetPreview preset={RIG_PRESETS[0]} rig={rig} onApply={apply} onClose={close} />);
    expect(screen.getByRole('dialog', { name: 'Preview rig preset' })).toBeInTheDocument();
    expect(screen.getByText('Memory Buffer Mk I · Owned')).toBeInTheDocument();
    expect(screen.getByText('Heuristic Co-Processor · Missing')).toBeInTheDocument();
    expect(screen.getByText('8 → 9')).toBeInTheDocument();
    expect(screen.getByText(/Missing modules are not purchased/)).toBeInTheDocument();
    expect(apply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(close).toHaveBeenCalledOnce();
    expect(apply).not.toHaveBeenCalled();
  });
  it('applies the selected preset only through the confirmation action', async () => {
    const apply = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn();
    render(<PresetPreview preset={RIG_PRESETS[0]} rig={rig} onApply={apply} onClose={close} />);
    fireEvent.click(screen.getByRole('button', { name: 'Apply owned parts' }));
    await waitFor(() => expect(apply).toHaveBeenCalledExactlyOnceWith('safe_learner'));
    expect(close).toHaveBeenCalledOnce();
  });
  it('cannot clear the current rig by applying a preset with no owned parts', () => {
    render(<PresetPreview preset={RIG_PRESETS[0]} rig={{ ...rig, inventory: {} }} onApply={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Apply owned parts' })).toBeDisabled();
  });
});
