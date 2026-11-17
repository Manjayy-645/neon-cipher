import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

afterEach(() => {
  cleanup();
});


// jsdom has no native top layer. Unit tests cover modal lifecycle/callbacks;
// real-browser tests verify inertness, Tab containment and hit testing.
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute('open', '');
  this.querySelector<HTMLElement>('button, input, [tabindex="0"]')?.focus();
};
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute('open');
};
