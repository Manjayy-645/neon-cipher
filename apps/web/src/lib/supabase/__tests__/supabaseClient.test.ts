import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const userJwt = process.env.SUPABASE_TEST_USER_JWT;
if (!url || !anonKey || !userJwt) {
  throw new Error('Start the isolated Data API fixture and source its env file before running tests (scripts/ci-data-api.sh).');
}
const options = { auth: { persistSession: false, autoRefreshToken: false } };

describe('Supabase Data API against the real migration', () => {
  it('connects and reads the seeded public profile', async () => {
    const supabase = createClient<Database>(url, anonKey, options);
    const { data, error } = await supabase.from('profiles').select('*').limit(5);
    expect(error).toBeNull();
    expect(data?.some((profile) => profile.handle === 'CI_RLS_FIXTURE')).toBe(true);
  });

  it('denies anonymous access to private user settings', async () => {
    const supabase = createClient<Database>(url, anonKey, options);
    const { data, error } = await supabase.from('user_settings').select('*');
    if (error) {
      expect(error.code).toBe('42501'); // A grant denial is stricter than an empty RLS result.
      expect(data).toBeNull();
    } else {
      expect(data).toEqual([]);
    }
  });

  it('enforces ownership RLS for an authenticated user', async () => {
    const supabase = createClient<Database>(url, anonKey, {
      ...options, global: { headers: { Authorization: `Bearer ${userJwt}` } },
    });
    const { data, error } = await supabase.from('user_settings').select('user_id');
    expect(error).toBeNull();
    expect(data).toEqual([{ user_id: '00000000-0000-4000-8000-000000000001' }]);
  });

  it.each(['anon', 'authenticated'])('denies %s access to game secrets', async (role) => {
    const supabase = createClient<Database>(url, anonKey, {
      ...options,
      ...(role === 'authenticated' ? { global: { headers: { Authorization: `Bearer ${userJwt}` } } } : {}),
    });
    const { data, error } = await supabase.from('game_secrets').select('*');
    if (error) {
      expect(error.code).toBe('42501'); // Network/auth/schema errors must never pass this assertion.
      expect(data).toBeNull();
    } else {
      expect(data).toEqual([]);
    }
  });
});
