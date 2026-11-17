import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Modal } from '../Modal';
import { useOverlayStore } from '@/stores/overlay-store';

function Example() {
  const [open, setOpen] = useState(false);
  const [nested, setNested] = useState(false);
  return <>
    <button onClick={() => setOpen(true)}>Open example</button>
    {open && <Modal label="Example" onClose={() => setOpen(false)}
      header={<button onClick={() => setNested(true)}>Open nested</button>}
      footer={<button onClick={() => setOpen(false)}>Done</button>}>
      <p>Scrollable details</p>
      {nested && <Modal label="Nested" onClose={() => setNested(false)}>
        <button onClick={() => setNested(false)}>Cancel nested</button>
      </Modal>}
    </Modal>}
  </>;
}

describe('Modal ownership', () => {
  it('keeps the invoking focus stable across rerenders and restores it on dismissal', () => {
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Open example' });
    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Example' })).toHaveAttribute('open');
    expect(useOverlayStore.getState().modals).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Open nested' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(trigger).toHaveFocus();
    expect(useOverlayStore.getState().modals).toHaveLength(0);
  });

  it('dismissing a nested dialog leaves its parent owned and restores parent focus', () => {
    render(<Example />);
    fireEvent.click(screen.getByRole('button', { name: 'Open example' }));
    const parentTrigger = screen.getByRole('button', { name: 'Open nested' });
    parentTrigger.focus();
    fireEvent.click(parentTrigger);
    expect(useOverlayStore.getState().modals).toHaveLength(2);
    fireEvent(screen.getByRole('dialog', { name: 'Nested' }), new Event('cancel', { cancelable: true }));
    expect(screen.queryByRole('dialog', { name: 'Nested' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Example' })).toBeInTheDocument();
    expect(parentTrigger).toHaveFocus();
    expect(useOverlayStore.getState().modals).toHaveLength(1);
  });

  it('isolates game shortcuts and never treats a content click as backdrop dismissal', () => {
    const gameShortcut = vi.fn();
    const onClose = vi.fn();
    window.addEventListener('keydown', gameShortcut);
    const { unmount } = render(<Modal label="Details" onClose={onClose}><button>Details action</button></Modal>);
    fireEvent.keyDown(screen.getByRole('button'), { key: '1' });
    fireEvent.click(screen.getByRole('button'));
    expect(gameShortcut).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledOnce();
    unmount();
    window.removeEventListener('keydown', gameShortcut);
    expect(useOverlayStore.getState().modals).toHaveLength(0);
  });

  it('prevents Escape/backdrop dismissal while a transaction is pending', () => {
    const onClose = vi.fn();
    render(<Modal label="Pending" onClose={onClose} dismissible={false}><p>Processing</p></Modal>);
    const dialog = screen.getByRole('dialog');
    const cancel = new Event('cancel', { cancelable: true });
    fireEvent(dialog, cancel);
    fireEvent.click(dialog);
    expect(cancel.defaultPrevented).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
  });
});
