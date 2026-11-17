'use client';

import React, { useEffect, useId, useRef } from 'react';
import { useOverlayStore } from '@/stores/overlay-store';

interface ModalProps {
  label: string;
  onClose: () => void;
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  dismissible?: boolean;
}

/**
 * Native modal top layer escapes scene transforms/stacking without losing the
 * invoking surface's theme. showModal makes everything behind it inert, owns
 * focus/Tab traversal, and supports nested dialogs (e.g. Settings → Reset).
 */
export function Modal({ label, onClose, children, header, footer, className = '', dismissible = true }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    useOverlayStore.setState((state) => ({ modals: [...state.modals, id] }));
    return () => {
      dialog.close();
      useOverlayStore.setState((state) => ({ modals: state.modals.filter((modal) => modal !== id) }));
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [id]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      aria-modal="true"
      className="app-modal"
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (dismissible) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && dismissible) onClose();
        event.stopPropagation();
      }}
      // Keep terminal/window shortcuts from consuming input inside dialogs.
      onKeyDown={(event) => event.stopPropagation()}
      onKeyUp={(event) => event.stopPropagation()}
    >
      <div className={`modal-surface ${className}`}>
        {header && <div className="modal-header">{header}</div>}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </dialog>
  );
}
