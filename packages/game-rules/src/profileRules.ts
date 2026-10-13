import {
  DeckerProfile,
  SkillNode,
  FactionStanding,
  DailyBreachData,
  Achievement,
  BreachReplay,
  FriendProfile,
  AppNotification,
} from './profileTypes';

export * from './profileTypes';

/**
 * Calculates win rate percentage rounded to 1 decimal place.
 */
export function calculateWinRate(successful: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((successful / total) * 1000) / 10;
}

/**
 * Checks whether a skill node can be unlocked given currently unlocked skill IDs and available skill points.
 */
export function canUnlockSkill(
  skill: SkillNode,
  unlockedSkillIds: string[],
  availablePoints: number
): { canUnlock: boolean; reason?: string } {
  if (skill.unlocked || unlockedSkillIds.includes(skill.id)) {
    return { canUnlock: false, reason: 'Skill already unlocked' };
  }
  if (availablePoints < skill.pointCost) {
    return { canUnlock: false, reason: `Requires ${skill.pointCost} skill points (have ${availablePoints})` };
  }
  const missingPrereqs = skill.prerequisites.filter((id) => !unlockedSkillIds.includes(id));
  if (missingPrereqs.length > 0) {
    return { canUnlock: false, reason: `Missing prerequisite skills: ${missingPrereqs.join(', ')}` };
  }
  return { canUnlock: true };
}

/**
 * Returns faction standing rank label based on numeric reputation score (-100 to +100).
 */
export function getStandingLevel(reputation: number): 'Hostile' | 'Neutral' | 'Favored' | 'Allied' {
  if (reputation <= -30) return 'Hostile';
  if (reputation >= 60) return 'Allied';
  if (reputation >= 20) return 'Favored';
  return 'Neutral';
}

/**
 * Validates whether accepting a contract creates a conflict or penalty with an opposing faction.
 */
export function checkMutualExclusion(
  faction: FactionStanding,
  opposingFaction?: FactionStanding
): { warning: boolean; message?: string } {
  if (!faction.opposingFactionId || !opposingFaction) {
    return { warning: false };
  }
  return {
    warning: true,
    message: `Warning: Assisting ${faction.name} inflicts reputation penalties on their bitter rival, ${opposingFaction.name}. High standing with both is mutually exclusive.`,
  };
}

/**
 * Daily Breach deterministic seed generator for a given date string YYYY-MM-DD
 */
export function getDailyBreachSeed(dateString: string): string {
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    hash = (hash << 5) - hash + dateString.charCodeAt(i);
    hash |= 0;
  }
  return `DB-${Math.abs(hash).toString(16).toUpperCase()}`;
}
