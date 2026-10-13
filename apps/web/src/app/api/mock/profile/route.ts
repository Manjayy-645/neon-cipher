import { NextResponse } from 'next/server';
import {
  getProfile,
  updateCosmetics,
  getSkillTree,
  unlockSkillNode,
  getFactions,
  acceptFactionContract,
  getDailyBreach,
  submitDailyBreachAttempt,
  getAchievements,
  getReplays,
  getFriends,
  getNotifications,
  markNotificationRead,
} from '../db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get('section') || 'all';

  if (section === 'profile') {
    return NextResponse.json({ profile: getProfile() });
  }

  if (section === 'skills') {
    return NextResponse.json(getSkillTree());
  }

  if (section === 'factions') {
    return NextResponse.json({ factions: getFactions() });
  }

  if (section === 'daily-breach') {
    return NextResponse.json({ dailyBreach: getDailyBreach() });
  }

  if (section === 'achievements') {
    return NextResponse.json({ achievements: getAchievements() });
  }

  if (section === 'replays') {
    return NextResponse.json({ replays: getReplays() });
  }

  if (section === 'friends') {
    return NextResponse.json({ friends: getFriends() });
  }

  if (section === 'notifications') {
    return NextResponse.json({ notifications: getNotifications() });
  }

  return NextResponse.json({
    profile: getProfile(),
    skillTree: getSkillTree(),
    factions: getFactions(),
    dailyBreach: getDailyBreach(),
    achievements: getAchievements(),
    replays: getReplays(),
    friends: getFriends(),
    notifications: getNotifications(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'update-cosmetics') {
      const updated = updateCosmetics(body.cosmetics);
      return NextResponse.json({ success: true, profile: updated });
    }

    if (action === 'unlock-skill') {
      const res = unlockSkillNode(body.skillId);
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json(res);
    }

    if (action === 'accept-contract') {
      const res = acceptFactionContract(body.contractId);
      return NextResponse.json(res);
    }

    if (action === 'submit-daily') {
      const { guessesCount, timeSeconds } = body;
      const updated = submitDailyBreachAttempt(Number(guessesCount), Number(timeSeconds));
      return NextResponse.json({ success: true, dailyBreach: updated });
    }

    if (action === 'mark-notification-read') {
      const notifs = markNotificationRead(body.notificationId);
      return NextResponse.json({ success: true, notifications: notifs });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
