// MOCK: replace with Supabase.
import { AccountSettings } from './types';

function getUrl(path: string): string {
  if (typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null') {
    return `${window.location.origin}${path}`;
  }
  return path;
}

export const settingsService = {
  async getSettings(): Promise<AccountSettings> {
    const res = await fetch(getUrl('/api/mock/settings'), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Failed to load settings: ${res.statusText}`);
    }
    return res.json();
  },

  async updateSettings(settings: Partial<AccountSettings>): Promise<AccountSettings> {
    const res = await fetch(getUrl('/api/mock/settings'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to save settings: ${res.statusText}`);
    }
    return res.json();
  },
};
