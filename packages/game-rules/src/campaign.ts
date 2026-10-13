import { IceType } from './index';

export interface DialogueLine {
  speaker: 'nix' | 'glitch' | 'system';
  text: string;
  mood?: 'neutral' | 'urgent' | 'warning' | 'encouraging';
}

export interface ChapterContract {
  principalDebtStart: number;
  debtReduction: number;
  bounty: number;
  riskRating: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  creditor: string;
  terms: string[];
}

export interface ChapterRules {
  digits: number;
  allowDuplicates: boolean;
  attempts: number;
  timerSeconds: number;
  ice: IceType;
  unlimitedTries: boolean;
}

export interface TutorialStep {
  id: string;
  phase: 'map' | 'sheet' | 'terminal';
  targetSelector: string;
  title: string;
  nixDialogue: string;
  actionRequired:
    | 'tap-node'
    | 'tap-jack-in'
    | 'input-digits'
    | 'submit-guess'
    | 'dismiss-callout'
    | 'free-play';
  spotlightPadding?: number;
}

export interface ChapterData {
  id: string;
  number: number;
  title: string;
  tagline: string;
  target: string;
  mapNodeId: string;
  mapLocation: string;
  district: 'slums' | 'commercial';
  lesson: string;
  rules: ChapterRules;
  contract: ChapterContract;
  briefingDialogue: DialogueLine[];
  debriefDialogue: DialogueLine[];
  unlocksReward?: 'blackMarket' | 'bridge' | 'onlinePlay';
  unlockRewardLabel?: string;
  tutorialSteps?: TutorialStep[];
}

export const INITIAL_DEBT = 10000;

export const CHAPTERS: ChapterData[] = [
  {
    id: 'chapter-1',
    number: 1,
    title: 'Scraping Dirt',
    tagline: 'First probe on street hardware',
    target: 'Rusty Soda Machine',
    mapNodeId: 'n1',
    mapLocation: 'Slums, near the water tower',
    district: 'slums',
    lesson: 'Pot, Pan and elimination',
    rules: {
      digits: 3,
      allowDuplicates: false,
      attempts: 99,
      timerSeconds: 0,
      ice: 'None',
      unlimitedTries: true,
    },
    contract: {
      principalDebtStart: 10000,
      debtReduction: 1500,
      bounty: 120,
      riskRating: 'LOW',
      creditor: 'Kovacs Loan Syndicate',
      terms: [
        'Non-disclosure protocol: keep syndicate telemetry silent.',
        'Debt relief credit: $1,500 applied directly to Kovacs loan balance.',
        'Zero failure penalty: training sandbox node.',
        'Syndicate vig: waived for introductory breach.',
      ],
    },
    briefingDialogue: [
      {
        speaker: 'glitch',
        text: 'Wake up, decker. You owe the Kovacs Syndicate ten thousand credits, and the shark is already eyeing your cyberdeck for parts.',
        mood: 'urgent',
      },
      {
        speaker: 'glitch',
        text: 'I bought you a 24-hour grace window. Down by the water tower is a derelict soda machine. No ICE, no countdown. Crack it, pocket the cash, and prove you can pay down this debt.',
        mood: 'neutral',
      },
      {
        speaker: 'nix',
        text: 'Take a breath. I am patching into your optical feed. We will start clean with 3 unique digits. Green is a Pot, amber is a Pan. I will walk you through every step.',
        mood: 'encouraging',
      },
    ],
    debriefDialogue: [
      {
        speaker: 'glitch',
        text: 'Clean breach. The syndicate ledger just knocked $1,500 off your debt. $8,500 left on your tab.',
        mood: 'encouraging',
      },
      {
        speaker: 'nix',
        text: 'You handled the elimination math perfectly. Next target will have a live clock, so keep your head cool.',
        mood: 'neutral',
      },
    ],
    tutorialSteps: [
      {
        id: 'c1-step-1-map-node',
        phase: 'map',
        targetSelector: '[data-marker-id="n1"]',
        title: 'LOCATE TARGET',
        nixDialogue: 'See that soda machine over by the water tower? Tap its marker to inspect the lock.',
        actionRequired: 'tap-node',
        spotlightPadding: 12,
      },
      {
        id: 'c1-step-2-sheet-jackin',
        phase: 'sheet',
        targetSelector: '[data-tutorial="jack-in"]',
        title: 'ESTABLISH LINK',
        nixDialogue: '3 digits, zero countdown, unlimited tries. Hit JACK IN to link your deck.',
        actionRequired: 'tap-jack-in',
        spotlightPadding: 8,
      },
      {
        id: 'c1-step-3-terminal-digits',
        phase: 'terminal',
        targetSelector: '[data-tutorial="keypad"]',
        title: 'KEYPAD PROBE',
        nixDialogue: 'Enter 3 different digits to probe the circuit. Try typing "1 - 2 - 3".',
        actionRequired: 'input-digits',
        spotlightPadding: 10,
      },
      {
        id: 'c1-step-4-terminal-submit',
        phase: 'terminal',
        targetSelector: '[data-tutorial="submit"]',
        title: 'TRANSMIT GUESS',
        nixDialogue: 'Three digits loaded. Hit SUBMIT to ping the memory core.',
        actionRequired: 'submit-guess',
        spotlightPadding: 8,
      },
      {
        id: 'c1-step-5-terminal-clues',
        phase: 'terminal',
        targetSelector: '[data-tutorial="history"]',
        title: 'READ POTS & PANS',
        nixDialogue: 'POT (green dot) = right digit, right slot. PAN (amber ring) = right digit, wrong slot. Dash = dead digit.',
        actionRequired: 'dismiss-callout',
        spotlightPadding: 12,
      },
      {
        id: 'c1-step-6-terminal-solve',
        phase: 'terminal',
        targetSelector: '[data-tutorial="keypad"]',
        title: 'ELIMINATE & CRACK',
        nixDialogue: 'Dead digits are automatically crossed off your pad. Deduce the remaining numbers and finish the breach!',
        actionRequired: 'free-play',
        spotlightPadding: 10,
      },
    ],
  },
  {
    id: 'chapter-2',
    number: 2,
    title: 'The Corner Store Job',
    tagline: 'Timers and attempt lockout',
    target: 'Market Register',
    mapNodeId: 'n4',
    mapLocation: 'Eastern edge of the Slums',
    district: 'slums',
    lesson: 'Timers and lockout; unlocks market',
    unlocksReward: 'blackMarket',
    unlockRewardLabel: 'UNLOCKS BLACK MARKET',
    rules: {
      digits: 4,
      allowDuplicates: false,
      attempts: 7,
      timerSeconds: 90,
      ice: 'None',
      unlimitedTries: false,
    },
    contract: {
      principalDebtStart: 8500,
      debtReduction: 2500,
      bounty: 650,
      riskRating: 'MEDIUM',
      creditor: 'Kovacs Loan Syndicate',
      terms: [
        'Attempt cap: 7 burns maximum before security tripwire snaps.',
        'Active trace clock: 90 seconds soft lockout timer.',
        'Debt relief credit: $2,500 applied directly to Kovacs balance.',
        'Syndicate milestone: Unlocks Black Market broker network.',
      ],
    },
    briefingDialogue: [
      {
        speaker: 'glitch',
        text: 'The corner bodega on the eastern strip skipped their syndicate protection fee. Their cash register is sitting armed.',
        mood: 'neutral',
      },
      {
        speaker: 'glitch',
        text: 'Clear this register and I will officially authorize your deck for my Black Market network. You will need high-grade tools for what comes next.',
        mood: 'urgent',
      },
      {
        speaker: 'nix',
        text: 'Heads up: this target introduces real pressure. You have 7 attempts and a 90-second trace countdown. Do not panic—disciplined logic is faster than frantic button mashing.',
        mood: 'warning',
      },
    ],
    debriefDialogue: [
      {
        speaker: 'glitch',
        text: 'Clean score. Debt slashed by $2,500. $6,000 remaining on your ledger, and my Black Market broker channel is now unlocked.',
        mood: 'encouraging',
      },
      {
        speaker: 'nix',
        text: 'You held your nerve against the timer. Stock up on sabotage tools and rig upgrades at Glitch’s market before we move up.',
        mood: 'encouraging',
      },
    ],
    tutorialSteps: [
      {
        id: 'c2-step-1-map-node',
        phase: 'map',
        targetSelector: '[data-marker-id="n4"]',
        title: 'LOCATE REGISTER',
        nixDialogue: 'Glitch highlighted the corner register on the eastern slum edge. Select it on the map.',
        actionRequired: 'tap-node',
        spotlightPadding: 12,
      },
      {
        id: 'c2-step-2-sheet-timer',
        phase: 'sheet',
        targetSelector: '[data-tutorial="sheet-specs"]',
        title: 'CHECK PRESSURE SPECS',
        nixDialogue: 'Notice the stakes: 4 digits, 7 tries, and a 90s countdown. Hit JACK IN when ready.',
        actionRequired: 'tap-jack-in',
        spotlightPadding: 10,
      },
      {
        id: 'c2-step-3-terminal-timer',
        phase: 'terminal',
        targetSelector: '[data-tutorial="terminal-timer"]',
        title: 'TRACE COUNTDOWN',
        nixDialogue: 'That clock is your trace window. 90 seconds. Stay calm and test numbers methodically.',
        actionRequired: 'dismiss-callout',
        spotlightPadding: 8,
      },
      {
        id: 'c2-step-4-terminal-pips',
        phase: 'terminal',
        targetSelector: '[data-tutorial="attempt-pips"]',
        title: 'WATCH ATTEMPT PIPS',
        nixDialogue: '7 attempt pips only. Every guess counts. Crack this code and Glitch unlocks the Black Market.',
        actionRequired: 'free-play',
        spotlightPadding: 8,
      },
    ],
  },
  {
    id: 'chapter-3',
    number: 3,
    title: 'Dirty Collateral',
    tagline: 'System distortion and sabotage defense',
    target: 'Chop-shop Safe',
    mapNodeId: 'n7',
    mapLocation: 'Industrial pocket',
    district: 'slums',
    lesson: 'Tools and Firewall Patch',
    unlocksReward: 'bridge',
    unlockRewardLabel: 'UNLOCKS RIVER BRIDGE ACCESS',
    rules: {
      digits: 4,
      allowDuplicates: false,
      attempts: 6,
      timerSeconds: 60,
      ice: 'Liar',
      unlimitedTries: false,
    },
    contract: {
      principalDebtStart: 6000,
      debtReduction: 3000,
      bounty: 2800,
      riskRating: 'HIGH',
      creditor: 'Kovacs Loan Syndicate',
      terms: [
        'Hostile ICE profile: Liar distortion active (one telemetry entry faked).',
        'Attempt cap: 6 cycles under a 60s hard firewall clock.',
        'Debt relief credit: $3,000 applied directly to balance.',
        'Transit clearance: Unlocks police bridge crossing into Commercial district.',
      ],
    },
    briefingDialogue: [
      {
        speaker: 'glitch',
        text: 'The loan shark hid valuable collateral inside an industrial chop-shop safe. But someone left defensive ICE running.',
        mood: 'urgent',
      },
      {
        speaker: 'glitch',
        text: 'Liar ICE is active—one history row is completely falsified. Pop that safe and I will forge the security transit permit to cross the river bridge into Commercial.',
        mood: 'neutral',
      },
      {
        speaker: 'nix',
        text: 'Distortion messes with your deduction. Equipping a Firewall Patch or sabotage tool will shield your deck. Watch for contradictions between rows.',
        mood: 'warning',
      },
    ],
    debriefDialogue: [
      {
        speaker: 'glitch',
        text: 'Safe popped and collateral retrieved. Kovacs is sweating—your remaining debt is down to $3,000. River bridge transit permit is now active.',
        mood: 'encouraging',
      },
      {
        speaker: 'nix',
        text: 'You outsmarted Liar ICE. Cross the bridge when you are ready; Commercial high-rises are where the serious deckers duel.',
        mood: 'neutral',
      },
    ],
  },
  {
    id: 'chapter-4',
    number: 4,
    title: 'The Rogue Signal',
    tagline: 'Duel feed interception across the river',
    target: 'Commercial Relay',
    mapNodeId: 'n10',
    mapLocation: 'Commercial, across the bridge',
    district: 'commercial',
    lesson: 'Reading the shared feed, sabotage',
    unlocksReward: 'onlinePlay',
    unlockRewardLabel: 'UNLOCKS ONLINE PLAY (DUEL)',
    rules: {
      digits: 5,
      allowDuplicates: false,
      attempts: 6,
      timerSeconds: 60,
      ice: 'None',
      unlimitedTries: false,
    },
    contract: {
      principalDebtStart: 3000,
      debtReduction: 3000,
      bounty: 9500,
      riskRating: 'CRITICAL',
      creditor: 'Kovacs Loan Syndicate',
      terms: [
        'Target tier: High-frequency corporate relay in Commercial district.',
        'Shared broadcast feed: Rival AI operative Null_Byte intercepting live.',
        'Debt relief credit: $3,000 — 100% DEBT EXTINCTION UPON VICTORY.',
        'Global clearance: Full access to online 1v1 Cipher Duel networks.',
      ],
    },
    briefingDialogue: [
      {
        speaker: 'glitch',
        text: 'Final assignment. A high-bandwidth commercial relay across the bridge is transmitting unencrypted bearer bonds.',
        mood: 'urgent',
      },
      {
        speaker: 'glitch',
        text: 'A rival decker named Null_Byte is locked onto the same signal. Beat them to the code, and your debt to Kovacs Syndicate drops to exactly ZERO.',
        mood: 'encouraging',
      },
      {
        speaker: 'nix',
        text: 'Shared duel dynamics! Every guess you broadcast is visible, and so is theirs. Read their clues to steal deductions, and strike before they solve it.',
        mood: 'warning',
      },
    ],
    debriefDialogue: [
      {
        speaker: 'glitch',
        text: 'Null_Byte crashed out! Debt balance: $0. You are completely debt-free. Online duel network frequencies are now open to you.',
        mood: 'encouraging',
      },
      {
        speaker: 'nix',
        text: 'Zero balance. No loan sharks, no leash. You are a true decker now. Step into the arena and take on the city.',
        mood: 'encouraging',
      },
    ],
  },
];

export function getChapterById(id: string): ChapterData | undefined {
  return CHAPTERS.find((c) => c.id === id);
}

export function getChapterByNodeId(nodeId: string): ChapterData | undefined {
  return CHAPTERS.find((c) => c.mapNodeId === nodeId);
}

export function calculateRemainingDebt(completedChapterIds: string[]): number {
  let debt = INITIAL_DEBT;
  for (const chapter of CHAPTERS) {
    if (completedChapterIds.includes(chapter.id)) {
      debt = Math.max(0, debt - chapter.contract.debtReduction);
    }
  }
  return debt;
}
