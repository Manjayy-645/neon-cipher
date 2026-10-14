export type StepId =
  | 'splash' | 'cold.intro' | 'cold.clues' | 'cold.deadkey' | 'cold.play' | 'cold.breach'
  | 'glitch.intro' | 'profile.create'
  | 'map.overview' | 'map.district' | 'map.node'
  | 'ch2.hack' | 'ch2.result'
  | 'market.gate' | 'market.buy' | 'market.equip'
  | 'comms.nav' | 'comms.debt' | 'save.prompt' | 'done';

export const STEP_ORDER: StepId[] = [
  'splash', 'cold.intro', 'cold.clues', 'cold.deadkey', 'cold.play', 'cold.breach',
  'glitch.intro', 'profile.create', 'map.overview', 'map.district', 'map.node',
  'ch2.hack', 'ch2.result', 'market.gate', 'market.buy', 'market.equip',
  'comms.nav', 'comms.debt', 'save.prompt', 'done',
];

export const TUTORIAL = {
  terminalId: 'tutorial-soda', mapNodeId: 's1', name: 'Rusty Soda Machine',
  payout: 120, cooldownMs: 14 * 60 * 1000,
};
export const CH2_NODE_ID = 'n4';
export const START_BALANCE = { credits: 0, coins: 0 };
export const STALL_MS = 25000;
export const RESERVED_CALLSIGNS = ['NULL_BYTE', 'GLITCH', 'NIX', 'ALEX', 'ADMIN', 'KOVACS'];

export interface StepDef {
  route: string;            // where the step happens
  chrome: boolean;          // HUD and bottom nav visible
  speaker: 'nix' | 'glitch';
  target?: string;          // data-tour value to spotlight
  lines: string[];
  advance: 'tap' | 'event' | 'form';
  event?: string;           // OnboardingEvent type that ends an 'event' step
}

export const STEPS: Record<StepId, StepDef> = {
  'splash':        { route: '/', chrome: false, speaker: 'nix', lines: [], advance: 'form' },
  'cold.intro':    { route: '/terminal/tutorial-soda', chrome: false, speaker: 'nix', target: 'keypad',
                     lines: ['Type any three numbers. No wrong answers yet.'], advance: 'event', event: 'terminal:guess' },
  'cold.clues':    { route: '/terminal/tutorial-soda', chrome: false, speaker: 'nix', target: 'clue-marks-latest',
                     lines: ['Filled dot: right number, right slot.', 'Ring: right number, wrong slot.', 'Dash: not in the code.'],
                     advance: 'tap' },
  'cold.deadkey':  { route: '/terminal/tutorial-soda', chrome: false, speaker: 'nix', target: 'dead-key',
                     lines: ['Dead number. I grayed that key out so you do not touch it again.'], advance: 'tap' },
  'cold.play':     { route: '/terminal/tutorial-soda', chrome: false, speaker: 'nix', lines: [], advance: 'event', event: 'terminal:won' },
  'cold.breach':   { route: '/terminal/tutorial-soda', chrome: false, speaker: 'nix', target: 'breach-banner',
                     lines: ['Breached. Not bad for a first lock.'], advance: 'tap' },
  'glitch.intro':  { route: '/onboarding/glitch', chrome: false, speaker: 'glitch',
                     lines: ['Rookie. You just cracked a soda machine for pocket change. Congratulations.',
                             'You also owe the Kovacs Syndicate ten thousand. They do not take excuses.',
                             'Nix will keep you alive. I will keep you busy. Open the map.'], advance: 'tap' },
  'profile.create':{ route: '/onboarding/profile', chrome: false, speaker: 'glitch', lines: [], advance: 'form' },
  'map.overview':  { route: '/map', chrome: true, speaker: 'nix', target: 'tag-slums',
                     lines: ['Two districts. The Slums are open. Tap it to look closer.'], advance: 'event', event: 'map:districtTagTapped' },
  'map.district':  { route: '/map', chrome: true, speaker: 'nix', target: `node-${CH2_NODE_ID}`,
                     lines: ['Rings are open jobs. Start with the corner store.'], advance: 'event', event: 'map:nodeSelected' },
  'map.node':      { route: '/map', chrome: true, speaker: 'nix', target: 'jack-in',
                     lines: ['Four digits, seven tries, sixty seconds. A tighter lock pays more.'], advance: 'event', event: 'map:jackIn' },
  'ch2.hack':      { route: `/terminal/${CH2_NODE_ID}`, chrome: false, speaker: 'nix', lines: [], advance: 'event', event: 'terminal:won' },
  'ch2.result':    { route: `/terminal/${CH2_NODE_ID}`, chrome: false, speaker: 'nix', target: 'breach-banner',
                     lines: ['Clean job. The Black Market is open. Go see Alex.'], advance: 'tap' },
  'market.gate':   { route: '/market', chrome: true, speaker: 'nix', target: 'shop-open',
                     lines: ['Alex runs the counter. Open the shop.'], advance: 'event', event: 'market:gateOpened' },
  'market.buy':    { route: '/market', chrome: true, speaker: 'nix', target: 'buy-firewall-patch',
                     lines: ['Firewall Patch. It blocks one sabotage in a duel. Worth having.'], advance: 'event', event: 'market:bought' },
  'market.equip':  { route: '/market', chrome: true, speaker: 'nix', target: 'equip-firewall-patch',
                     lines: ['Equip it. You can carry two tools.'], advance: 'event', event: 'market:equipped' },
  'comms.nav':     { route: '/market', chrome: true, speaker: 'nix', target: 'nav-comms',
                     lines: ['Check your debt in Comms.'], advance: 'event', event: 'comms:viewed' },
  'comms.debt':    { route: '/comms', chrome: true, speaker: 'nix', target: 'debt-tracker',
                     lines: ['Ten thousand to go. Chapter 3 opens the bridge when you are ready.'], advance: 'tap' },
  'save.prompt':   { route: '/comms', chrome: true, speaker: 'nix', lines: [], advance: 'form' },
  'done':          { route: '/map', chrome: true, speaker: 'nix', lines: [], advance: 'form' },
};

export const STALL_HINTS = {
  tutorial: ['Change one number at a time and watch the marks.',
             'The marks count matches, not positions. Use that.',
             'A guess with no marks tells you which numbers to forget.'],
  ch2: ['Two right but in the wrong slot? Swap them.',
        'Watch the clock, but do not rush the first guess.',
        'Use the dead keys. They are free information.'],
};
