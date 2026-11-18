export type OnboardingEvent =
  | { type: 'terminal:guess'; count: number; hasDeadDigit: boolean; solved: boolean; pans?: number; pots?: number }
  | { type: 'terminal:exit-requested' }
  | { type: 'terminal:won'; nodeId: string; guesses: number }
  | { type: 'terminal:lost'; nodeId: string }
  | { type: 'map:districtTagTapped'; district: string }
  | { type: 'map:nodeSelected'; nodeId: string }
  | { type: 'map:jackIn'; nodeId: string }
  | { type: 'market:gateOpened' }
  | { type: 'market:bought'; itemId: string }
  | { type: 'market:equipped'; itemId: string }
  | { type: 'comms:viewed' };

type Listener = (e: OnboardingEvent) => void;
const listeners = new Set<Listener>();

export function emit(e: OnboardingEvent) {
  listeners.forEach((l) => l(e));
}

export function subscribe(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
