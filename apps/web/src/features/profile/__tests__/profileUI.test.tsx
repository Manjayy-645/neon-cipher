import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeckerProfileCard } from '../DeckerProfileCard';
import { SkillTreeView } from '../SkillTreeView';
import { FactionView } from '../FactionView';
import { DailyBreachView } from '../DailyBreachView';
import { ExtrasHub } from '../ExtrasHub';
import ProfilePage from '@/app/profile/page';
import { profileService } from '../profileService';
import {
  DeckerProfile,
  SkillNode,
  FactionStanding,
  DailyBreachData,
  Achievement,
  BreachReplay,
  FriendProfile,
  AppNotification,
  SPECIALIZATION_SKILLS,
  FACTION_CATALOG,
} from '@neon-cipher/game-rules';

describe('Task 13: Profile, Skills, Factions, Daily Breach & Extras UI', () => {
  // 1. DeckerProfileCard (8.0)
  describe('DeckerProfileCard (8.0)', () => {
    const mockProfile: DeckerProfile = {
      handle: 'ZERO_COOL',
      avatarUrl: '/icons/glyph-router.svg',
      rank: {
        level: 8,
        title: 'Elite Phantom',
        currentXp: 1450,
        nextLevelXp: 2000,
      },
      stats: {
        totalHacks: 120,
        successfulBreaches: 96,
        failedBreaches: 24,
        winRatePercent: 80,
        currentStreak: 5,
        bestStreak: 14,
        fastestBreachSeconds: 12,
        fewestGuesses: 3,
        totalCreditsEarned: 245000,
      },
      cosmetics: {
        activeBadge: 'badge-phantom',
        unlockedBadges: ['badge-phantom', 'badge-cybersamurai'],
        activeTerminalTheme: 'theme-amber',
        unlockedThemes: ['theme-amber', 'theme-emerald'],
        activeDeckFrame: 'frame-carbon',
        unlockedFrames: ['frame-carbon', 'frame-titanium'],
      },
    };

    it('renders decker handle, rank level, XP progress bar, and combat stats', () => {
      const handleUpdate = vi.fn();
      render(<DeckerProfileCard profile={mockProfile} onUpdateCosmetics={handleUpdate} />);

      expect(screen.getByText('ZERO_COOL')).toBeDefined();
      expect(screen.getByText('LVL 8')).toBeDefined();
      expect(screen.getByText('Elite Phantom')).toBeDefined();
      expect(screen.getByText(/1450 \/ 2000 XP/)).toBeDefined();

      // Stats
      expect(screen.getByText('80%')).toBeDefined();
      expect(screen.getByText(/96 won \/ 120 total/)).toBeDefined();
      expect(screen.getByText('12s')).toBeDefined();
      expect(screen.getByText('3 probes')).toBeDefined();
      expect(screen.getByText('$245,000')).toBeDefined();
    });

    it('allows switching to Cosmetics tab and selecting cosmetics loadout', () => {
      const handleUpdate = vi.fn();
      render(<DeckerProfileCard profile={mockProfile} onUpdateCosmetics={handleUpdate} />);

      const cosmeticsTabBtn = screen.getByRole('button', { name: /cosmetics/i });
      fireEvent.click(cosmeticsTabBtn);

      expect(screen.getByText('TERMINAL COLOR MATRIX')).toBeDefined();
      const emeraldThemeBtn = screen.getByRole('button', { name: /theme emerald/i });
      fireEvent.click(emeraldThemeBtn);

      expect(handleUpdate).toHaveBeenCalledWith({ activeTerminalTheme: 'theme-emerald' });
    });
  });

  // 2. SkillTreeView (8.1)
  describe('SkillTreeView (8.1)', () => {
    const mockSkills: SkillNode[] = [
      {
        id: 'pattern_recognition',
        name: 'Pattern Recognition',
        branch: 'analysis',
        tier: 1,
        pointCost: 2,
        prerequisites: [],
        unlocked: true,
        effectKey: 'pattern_rec',
        description: 'Highlights eliminating patterns.',
        effectSummary: '-1 candidate digit after 3 attempts',
      },
      {
        id: 'entropy_reduction',
        name: 'Entropy Reduction',
        branch: 'analysis',
        tier: 2,
        pointCost: 4,
        prerequisites: ['pattern_recognition'],
        unlocked: false,
        effectKey: 'entropy_red',
        description: 'Filters out noise in high-entropy ciphers.',
        effectSummary: 'Initial guess feedback reveals duplicate state',
      },
      {
        id: 'deep_deduction',
        name: 'Deep Deduction',
        branch: 'analysis',
        tier: 3,
        pointCost: 6,
        prerequisites: ['entropy_reduction'],
        unlocked: false,
        effectKey: 'deep_ded',
        description: 'Predictive analysis routing.',
        effectSummary: 'Shows guaranteed excluded digits',
      },
      {
        id: 'ghost_protocol',
        name: 'Ghost Protocol',
        branch: 'stealth',
        tier: 1,
        pointCost: 2,
        prerequisites: [],
        unlocked: false,
        effectKey: 'ghost_prot',
        description: 'Scrambles trace telemetry.',
        effectSummary: '+5 seconds trace time before lock',
      },
    ];

    it('renders available skill points and all 3 branch categories', () => {
      const handleUnlock = vi.fn();
      render(<SkillTreeView skills={mockSkills} availablePoints={5} onUnlockSkill={handleUnlock} />);

      expect(screen.getByText('5 SP')).toBeDefined();
      expect(screen.getByRole('heading', { name: 'Matrix Analysis' })).toBeDefined();
      expect(screen.getByRole('heading', { name: 'Ghost Protocol' })).toBeDefined();
      expect(screen.getByRole('heading', { name: 'Social Engineering' })).toBeDefined();
      expect(screen.getByText(/ACTIVE IN INFILTRATION/)).toBeDefined();
    });

    it('allows unlocking an eligible skill with sufficient SP and met prerequisites', () => {
      const handleUnlock = vi.fn();
      render(<SkillTreeView skills={mockSkills} availablePoints={5} onUnlockSkill={handleUnlock} />);

      // Entropy Reduction requires pattern_recognition (which is unlocked) and costs 4 SP (we have 5)
      const unlockBtn = screen.getByRole('button', { name: /unlock \(4 sp\)/i });
      fireEvent.click(unlockBtn);

      expect(handleUnlock).toHaveBeenCalledWith('entropy_reduction');
    });

    it('disables skills where prerequisites are not met', () => {
      const handleUnlock = vi.fn();
      render(<SkillTreeView skills={mockSkills} availablePoints={10} onUnlockSkill={handleUnlock} />);

      // Deep Deduction requires entropy_reduction (not unlocked)
      expect(screen.getByText(/Req: entropy_reduction/)).toBeDefined();
    });

    it('renders 3 canonical branches (Infiltration, Analysis, Exploitation) and Nix guides', () => {
      const handleUnlock = vi.fn();
      const handleRespec = vi.fn();
      render(
        <SkillTreeView
          skills={SPECIALIZATION_SKILLS}
          availablePoints={6}
          onUnlockSkill={handleUnlock}
          onRespec={handleRespec}
        />
      );

      expect(screen.getByRole('heading', { name: 'Infiltration' })).toBeDefined();
      expect(screen.getByRole('heading', { name: 'Analysis' })).toBeDefined();
      expect(screen.getByRole('heading', { name: 'Exploitation' })).toBeDefined();
      expect(screen.getByText(/Pick this tree if you hate countdown timers/i)).toBeDefined();
      expect(screen.getByText(/Pick this tree if you want the cyberdeck to help you/i)).toBeDefined();
      expect(screen.getByText(/Pick this tree to maximize credit bounties/i)).toBeDefined();
    });

    it('displays free respec button and triggers onRespec when clicked', () => {
      const handleUnlock = vi.fn();
      const handleRespec = vi.fn();
      const skillsWithUnlocked = SPECIALIZATION_SKILLS.map((s) =>
        s.id === 'slipstream_boot' ? { ...s, unlocked: true } : s
      );

      render(
        <SkillTreeView
          skills={skillsWithUnlocked}
          availablePoints={5}
          onUnlockSkill={handleUnlock}
          onRespec={handleRespec}
        />
      );

      const respecBtn = screen.getByRole('button', { name: /\[respec points \(free\)\]/i });
      expect(respecBtn).toBeDefined();
      expect(screen.getByText(/Experiment freely—resetting your skill points is always free/i)).toBeDefined();

      fireEvent.click(respecBtn);
      expect(handleRespec).toHaveBeenCalledTimes(1);
    });

    it('enforces Capstone mutual exclusivity warning in UI when a Capstone is active', () => {
      const handleUnlock = vi.fn();
      // Phantom Protocol is unlocked (Infiltration Capstone)
      const skillsWithActiveCapstone = SPECIALIZATION_SKILLS.map((s) =>
        s.id === 'phantom_protocol' ? { ...s, unlocked: true } : s
      );

      render(
        <SkillTreeView
          skills={skillsWithActiveCapstone}
          availablePoints={10}
          onUnlockSkill={handleUnlock}
        />
      );

      expect(screen.getByText(/\[CAPSTONE ACTIVE: PHANTOM PROTOCOL\]/i)).toBeDefined();
      // Analysis Capstone (Quantum Sieve) should show exclusivity warning
      const capstoneWarnings = screen.getAllByText(/Mutually exclusive with active Capstone\. Respec to switch\./i);
      expect(capstoneWarnings.length).toBeGreaterThanOrEqual(1);
    });

    it('supports Nix Playstyle Quiz and displays recommendation', () => {
      const handleUnlock = vi.fn();
      render(
        <SkillTreeView
          skills={SPECIALIZATION_SKILLS}
          availablePoints={5}
          onUnlockSkill={handleUnlock}
        />
      );

      const quizToggleBtn = screen.getByRole('button', { name: /\[find your playstyle ▼\]/i });
      fireEvent.click(quizToggleBtn);

      const timersStressBtn = screen.getByRole('button', { name: /“Timers stress me out\.”/i });
      fireEvent.click(timersStressBtn);

      expect(screen.getByText(/NIX RECOMMENDATION: INFILTRATION TREE/i)).toBeDefined();
      expect(screen.getByText(/Slipstream Boot gives you \+5s free padding/i)).toBeDefined();
    });
  });

  // 3. FactionView (8.2)
  describe('FactionView (8.2)', () => {
    const mockFactions: FactionStanding[] = [
      {
        id: 'collective',
        name: 'The Collective',
        motto: 'Open source data for all minds.',
        description: 'Decentralized hacktivists dedicated to liberating corporate databases.',
        reputation: 65,
        standingLevel: 'Favored',
        perks: ['+15% payout from media nodes', 'Zero penalty on trace failures'],
        opposingFactionId: 'aegis',
        exclusiveContracts: [
          {
            id: 'contract-col-1',
            title: 'Subvert Grid Relay 4',
            description: 'Crack relay node without triggering ICE alerts.',
            bounty: 15000,
            reputationReward: 15,
            targetNode: 'node-col-1',
            repPenaltyOpponents: 10,
            opposingFactionId: 'aegis',
          },
        ],
      },
      {
        id: 'aegis',
        name: 'Aegis Defense',
        motto: 'Order, compliance, fortress security.',
        description: 'Corporate cybersecurity conglomerate contracting elite deckers to patch zero-days.',
        reputation: -40,
        standingLevel: 'Hostile',
        perks: ['Discounted ICE breaker utilities', 'Access to military-grade cyberdeck hardware'],
        opposingFactionId: 'collective',
        exclusiveContracts: [],
      },
    ];

    it('renders standing levels, perks, and mutual exclusion warnings', () => {
      const handleAccept = vi.fn();
      render(<FactionView factions={mockFactions} onAcceptContract={handleAccept} />);

      expect(screen.getByRole('heading', { name: 'The Collective' })).toBeDefined();
      expect(screen.getByText('Favored (+65)')).toBeDefined();
      expect(screen.getByRole('heading', { name: 'Aegis Defense' })).toBeDefined();
      expect(screen.getByText('Hostile (-40)')).toBeDefined();

      // Mutual exclusion warning
      const warnings = screen.getAllByText(/MUTUAL EXCLUSION:/);
      expect(warnings.length).toBeGreaterThanOrEqual(1);
    });

    it('allows accepting exclusive syndicate contracts', () => {
      const handleAccept = vi.fn();
      render(<FactionView factions={mockFactions} onAcceptContract={handleAccept} />);

      const contractBtn = screen.getByRole('button', { name: /accept contract \(subvert grid relay 4\)/i });
      fireEvent.click(contractBtn);

      expect(handleAccept).toHaveBeenCalledWith('contract-col-1');
    });

    it('renders 3 reputation milestone ranks and Glitch tactical intel', () => {
      const handleAccept = vi.fn();
      render(<FactionView factions={FACTION_CATALOG} onAcceptContract={handleAccept} />);

      expect(screen.getByRole('heading', { name: 'Kovacs Syndicate' })).toBeDefined();
      expect(screen.getByRole('heading', { name: 'Street Collective' })).toBeDefined();
      expect(screen.getByRole('heading', { name: 'Aeris Corp' })).toBeDefined();

      // Glitch Intel Callouts
      expect(screen.getByText(/Pay your campaign debt on time and take Kovacs contract hits/i)).toBeDefined();
      expect(screen.getByText(/Defend Slum district nodes, crack media relays/i)).toBeDefined();

      // Reputation Milestones Ranks
      expect(screen.getAllByText('Rank 1: Known').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Rank 2: Trusted').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Rank 3: Inner Circle').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/✓ REACHED/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  // 4. DailyBreachView (8.3)
  describe('DailyBreachView (8.3)', () => {
    const mockDaily: DailyBreachData = {
      date: '2026-10-12',
      seed: 'DAILY_SEED_20261012',
      nodeName: 'Nexus Core Apex',
      tier: 4,
      digits: 5,
      allowDuplicates: true,
      maxAttempts: 7,
      timeLimitSeconds: 60,
      bounty: 50000,
      userCompleted: false,
      leaderboard: [
        {
          rank: 1,
          handle: 'CIPHER_GHOST',
          avatarUrl: '/icons/glyph-vault.svg',
          guessesCount: 3,
          timeSeconds: 19,
          rewardTier: 'APEX',
          completedAt: '04:12 UTC',
        },
        {
          rank: 2,
          handle: 'ZERO_COOL',
          avatarUrl: '/icons/glyph-router.svg',
          guessesCount: 4,
          timeSeconds: 24,
          rewardTier: 'GOLD',
          completedAt: '08:35 UTC',
        },
      ],
    };

    it('renders target specs, bounty, and leaderboard', () => {
      const handleSubmit = vi.fn();
      render(<DailyBreachView data={mockDaily} onSubmitAttempt={handleSubmit} />);

      expect(screen.getByText('Nexus Core Apex')).toBeDefined();
      expect(screen.getByText('Tier 4 Corporate Node • 5 Digits')).toBeDefined();
      expect(screen.getByText('$50,000')).toBeDefined();
      expect(screen.getByText('CIPHER_GHOST')).toBeDefined();
      expect(screen.getByText('3 guesses')).toBeDefined();
      expect(screen.getByText('19s')).toBeDefined();
    });

    it('submits a daily attempt simulation', () => {
      const handleSubmit = vi.fn();
      render(<DailyBreachView data={mockDaily} onSubmitAttempt={handleSubmit} />);

      const submitBtn = screen.getByRole('button', { name: /submit daily attempt/i });
      fireEvent.click(submitBtn);

      expect(handleSubmit).toHaveBeenCalledWith(4, 42);
    });

    it('renders completed state when user has solved today breach', () => {
      const completedDaily: DailyBreachData = {
        ...mockDaily,
        userCompleted: true,
        userResult: {
          rank: 2,
          guessesCount: 4,
          timeSeconds: 24,
        },
      };

      const handleSubmit = vi.fn();
      render(<DailyBreachView data={completedDaily} onSubmitAttempt={handleSubmit} />);

      expect(screen.getByText('✓ DAILY BREACH COMPLETED')).toBeDefined();
      expect(screen.getAllByText('#2').length).toBeGreaterThanOrEqual(1);
    });
  });

  // 5. ExtrasHub (8.4)
  describe('ExtrasHub (8.4)', () => {
    const mockAchievements: Achievement[] = [
      {
        id: 'first_blood',
        title: 'First Contact',
        description: 'Successfully complete your first node breach.',
        category: 'mastery',
        progress: 1,
        maxProgress: 1,
        unlocked: true,
        rewardCoins: 50,
      },
    ];

    const mockReplays: BreachReplay[] = [
      {
        id: 'replay-1',
        nodeName: 'Subway Terminal 09',
        date: '2026-10-12',
        targetDigits: 4,
        secretCodeRevealed: '4821',
        won: true,
        guesses: [
          { step: 1, guess: '1234', pots: 0, pans: 2, timeElapsedSeconds: 4, note: 'Initial test probe' },
          { step: 2, guess: '4821', pots: 0, pans: 4, timeElapsedSeconds: 9, note: 'Breached' },
        ],
      },
    ];

    const mockFriends: FriendProfile[] = [
      {
        id: 'friend-1',
        handle: 'NEO_PHREAK',
        avatarUrl: '/icons/glyph-terminal.svg',
        rankTitle: 'Hardware Hacker',
        status: 'online',
        bestStreak: 12,
      },
    ];

    const mockNotifications: AppNotification[] = [
      {
        id: 'notif-1',
        title: 'Syndicate Bounty Paid',
        message: 'The Collective has transferred 15,000 CR to your account.',
        timestamp: Date.now() - 3600000,
        read: false,
        type: 'contract',
      },
    ];

    it('renders achievements in Trophies tab', () => {
      const handleMarkRead = vi.fn();
      render(
        <ExtrasHub
          achievements={mockAchievements}
          replays={mockReplays}
          friends={mockFriends}
          notifications={mockNotifications}
          onMarkNotificationRead={handleMarkRead}
        />
      );

      expect(screen.getByText('First Contact')).toBeDefined();
      expect(screen.getByText('+50 coins')).toBeDefined();
      expect(screen.getByText('CLAIMED')).toBeDefined();
    });

    it('allows stepping through replay log with Next and Prev buttons', () => {
      const handleMarkRead = vi.fn();
      render(
        <ExtrasHub
          achievements={mockAchievements}
          replays={mockReplays}
          friends={mockFriends}
          notifications={mockNotifications}
          onMarkNotificationRead={handleMarkRead}
        />
      );

      const replaysTab = screen.getByRole('button', { name: /replays/i });
      fireEvent.click(replaysTab);

      expect(screen.getByText('STEP 1 OF 2')).toBeDefined();
      expect(screen.getByText('1234')).toBeDefined();

      const nextBtn = screen.getByRole('button', { name: /next guess/i });
      fireEvent.click(nextBtn);

      expect(screen.getByText('STEP 2 OF 2')).toBeDefined();
      expect(screen.getAllByText('4821').length).toBeGreaterThanOrEqual(1);
    });

    it('renders Possibility Funnel counter, CRT terminal surface, and Nix Coach Breakdown', () => {
      const handleMarkRead = vi.fn();
      render(
        <ExtrasHub
          achievements={mockAchievements}
          replays={mockReplays}
          friends={mockFriends}
          notifications={mockNotifications}
          onMarkNotificationRead={handleMarkRead}
        />
      );

      const replaysTab = screen.getByRole('button', { name: /replays/i });
      fireEvent.click(replaysTab);

      // Terminal Header & Surface
      expect(screen.getByText(/\[BREACH REPLAY ANALYZER \/\/ NIX COACH V2\.4\]/i)).toBeDefined();

      // Possibility Funnel Counter Banner
      expect(screen.getByText(/POSSIBILITY FUNNEL \(CANDIDATE COLLAPSE\)/i)).toBeDefined();
      expect(screen.getByText(/START: 5,040/i)).toBeDefined();

      // Nix Turn Breakdown
      expect(screen.getByText(/NIX TURN 1 BREAKDOWN:/i)).toBeDefined();
      expect(screen.getAllByText(/Nix/i).length).toBeGreaterThanOrEqual(1);

      // Next step should update candidates and commentary
      const nextBtn = screen.getByRole('button', { name: /next guess/i });
      fireEvent.click(nextBtn);

      expect(screen.getByText(/NIX TURN 2 BREAKDOWN:/i)).toBeDefined();
      expect(screen.getByText(/CLUTCH SOLVE/i)).toBeDefined();
    });

    it('renders friends comms roster and status indicators', () => {
      const handleMarkRead = vi.fn();
      render(
        <ExtrasHub
          achievements={mockAchievements}
          replays={mockReplays}
          friends={mockFriends}
          notifications={mockNotifications}
          onMarkNotificationRead={handleMarkRead}
        />
      );

      const commsTab = screen.getByRole('button', { name: /comms/i });
      fireEvent.click(commsTab);

      expect(screen.getByText('NEO_PHREAK')).toBeDefined();
      expect(screen.getByText('Hardware Hacker')).toBeDefined();
      expect(screen.getByText('12 WINS')).toBeDefined();
    });

    it('renders notifications inbox and triggers mark as read', () => {
      const handleMarkRead = vi.fn();
      render(
        <ExtrasHub
          achievements={mockAchievements}
          replays={mockReplays}
          friends={mockFriends}
          notifications={mockNotifications}
          onMarkNotificationRead={handleMarkRead}
        />
      );

      const inboxTab = screen.getByRole('button', { name: /inbox/i });
      fireEvent.click(inboxTab);

      expect(screen.getByText('Syndicate Bounty Paid')).toBeDefined();
      const markReadBtn = screen.getByRole('button', { name: /mark read/i });
      fireEvent.click(markReadBtn);

      expect(handleMarkRead).toHaveBeenCalledWith('notif-1');
    });
  });

  // 6. ProfilePage (Unified Hub)
  describe('ProfilePage Integration', () => {
    it('renders loading state and then full page with top tab navigation', async () => {
      const mockAllData = {
        profile: {
          handle: 'ZERO_COOL',
          avatarUrl: '/icons/glyph-router.svg',
          rank: { level: 5, title: 'Code Infiltrator', currentXp: 400, nextLevelXp: 1000 },
          stats: {
            totalHacks: 50,
            successfulBreaches: 40,
            winRatePercent: 80,
            currentStreak: 4,
            bestStreak: 10,
            fastestBreachSeconds: 15,
            fewestGuesses: 3,
            totalCreditsEarned: 50000,
          },
          cosmetics: {
            activeBadge: 'badge-phantom',
            unlockedBadges: ['badge-phantom'],
            activeTerminalTheme: 'theme-amber',
            unlockedThemes: ['theme-amber'],
            activeDeckFrame: 'frame-carbon',
            unlockedFrames: ['frame-carbon'],
          },
        },
        skillTree: {
          skills: [],
          availablePoints: 3,
        },
        factions: [],
        dailyBreach: {
          date: '2026-10-12',
          seed: 'TEST',
          nodeName: 'Test Apex',
          tier: 1,
          digits: 4,
          allowDuplicates: false,
          maxAttempts: 6,
          timeLimitSeconds: 60,
          bounty: 1000,
          userCompleted: false,
          leaderboard: [],
        },
        achievements: [],
        replays: [],
        friends: [],
        notifications: [],
      };

      vi.spyOn(profileService, 'getAll').mockResolvedValue(mockAllData as any);

      render(<ProfilePage />);

      // Should display top navigation tabs once loaded
      const skillsTab = await screen.findByRole('button', { name: /8.1 skills/i });
      expect(skillsTab).toBeDefined();

      const factionsTab = screen.getByRole('button', { name: /8.2 factions/i });
      expect(factionsTab).toBeDefined();

      const dailyTab = screen.getByRole('button', { name: /8.3 daily/i });
      expect(dailyTab).toBeDefined();

      const extrasTab = screen.getByRole('button', { name: /8.4 extras/i });
      expect(extrasTab).toBeDefined();

      // Default section is 8.0 Profile
      expect(screen.getByText('ZERO_COOL')).toBeDefined();

      // Switch to 8.1 Skills
      fireEvent.click(skillsTab);
      expect(screen.getByText('NEURAL SKILL TREE')).toBeDefined();
    });
  });
});
