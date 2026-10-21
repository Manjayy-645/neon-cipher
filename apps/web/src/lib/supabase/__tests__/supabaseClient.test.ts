import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';

describe('Supabase Client & Live Project Verification', () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xonztenapwvhaykwhwzm.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvbnp0ZW5hcHd2aGF5a3dod3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MTA1MjIsImV4cCI6MjEwODA4NjUyMn0.c9GHwCFpPhxJ3K23J_jbrJm8AnSt58VKW0qcaORUal8';

  it('connects to Supabase and queries public tables with RLS active', async () => {
    const supabase = createClient<Database>(url, anonKey);
    const { data, error } = await supabase.from('profiles').select('*').limit(5);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it('enforces RLS on user_settings (anonymous requests cannot read user records without auth)', async () => {
    const supabase = createClient<Database>(url, anonKey);
    const { data, error } = await supabase.from('user_settings').select('*');

    // With RLS, anon gets 0 rows
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('enforces server-only protection on game_secrets (anon gets permission denied or empty)', async () => {
    const supabase = createClient<Database>(url, anonKey);
    const { data, error } = await supabase.from('game_secrets').select('*');

    // game_secrets has no public policies and revoked permissions
    expect(data === null || (Array.isArray(data) && data.length === 0)).toBe(true);
  });
});
