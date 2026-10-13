export type NixSituation =
  | 'overview'
  | 'lockedTap'
  | 'district'
  | 'tier1'
  | 'tier2'
  | 'tier3'
  | 'tier4'
  | 'tier5'
  | 'contested'
  | 'cooldown';

export const NIX_GUIDE_LINES: Record<NixSituation, string> = {
  overview: 'Two districts. The Slums are open. Tap it to look closer.',
  lockedTap: 'Fogged out. Cross the bridge before you go poking around there.',
  district: "Rings are open jobs. Diamonds mean a rival's been here. Start with a T1.",
  tier1: 'Quiet corner. Three digits, no repeats.',
  tier2: 'Signal stable. Lock is local.',
  tier3: 'Corporate lock. Digits can repeat here.',
  tier4: 'Heavy ICE detected. High risk, high bounty.',
  tier5: 'Bank grade security. Bring your best deck.',
  contested: "Rival decker's been here. Expect company.",
  cooldown: 'Locked out. Come back when the timer ends.',
};
