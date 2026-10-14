// MOCK: replace with Supabase.
import { AccountProfile, AccountSettings } from '../settings/types';
import { CampaignState, WalletData } from '@/app/api/mock/db';

export interface AuthSessionResponse {
  profile: AccountProfile;
  settings: AccountSettings;
  wallet: WalletData;
}

export interface CampaignResetResponse {
  account: {
    wallet: WalletData;
  };
  campaign: CampaignState;
}

function getUrl(path: string): string {
  if (typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null') {
    return `${window.location.origin}${path}`;
  }
  return path;
}

export const authService = {
  async getSession(): Promise<AuthSessionResponse> {
    const res = await fetch(getUrl('/api/mock/auth'), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch session: ${res.statusText}`);
    }
    return res.json();
  },

  async login(handle: string, avatarUrl: string): Promise<AuthSessionResponse> {
    const res = await fetch(getUrl('/api/mock/auth'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle, avatarUrl }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Login failed: ${res.statusText}`);
    }
    return res.json();
  },

  async logout(): Promise<void> {
    const res = await fetch(getUrl('/api/mock/auth'), {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(`Logout failed: ${res.statusText}`);
    }
  },

  async resetCampaign(): Promise<CampaignResetResponse> {
    const res = await fetch(getUrl('/api/mock/account/reset'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Reset failed: ${res.statusText}`);
    }
    return res.json();
  },

  async exportData(): Promise<Blob> {
    const res = await fetch(getUrl('/api/mock/account/export'), {
      method: 'GET',
    });
    if (!res.ok) {
      throw new Error(`Export failed: ${res.statusText}`);
    }
    return res.blob();
  },
};
