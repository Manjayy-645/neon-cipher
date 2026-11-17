// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Next.js supplies this poison-pill import internally. Mock it only in the
// server unit runner; the real client-import rejection is verified by Next build.
vi.mock('server-only', () => ({}));
const createSupabaseClient = vi.hoisted(() => vi.fn(() => ({ kind: 'admin-client' })));
vi.mock('@supabase/supabase-js', () => ({ createClient: createSupabaseClient }));

import { createAdminClient } from '@/lib/supabase/server';
import { createAdminClient as createExplicitAdminClient } from '@/lib/supabase/admin.server';

// This is a server-context test under app/api; all keys below are mock fixtures.
describe('server-only Supabase admin client', () => {
  beforeEach(() => {
    createSupabaseClient.mockClear();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.invalid');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-admin-key');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-public-key');
  });

  afterEach(() => vi.unstubAllEnvs());

  it('preserves the existing server import path', () => {
    expect(createAdminClient).toBe(createExplicitAdminClient);
  });

  it('passes only the privileged key and disables persisted browser auth', () => {
    expect(createAdminClient()).toEqual({ kind: 'admin-client' });
    expect(createSupabaseClient).toHaveBeenCalledWith(
      'https://example.supabase.invalid',
      'test-admin-key',
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  });

  it('fails closed when only a public key is configured', () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    expect(() => createAdminClient()).toThrow('Missing SUPABASE_SERVICE_ROLE_KEY');
    expect(createSupabaseClient).not.toHaveBeenCalled();
  });

  it('fails closed without a project URL', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    expect(() => createAdminClient()).toThrow('Missing NEXT_PUBLIC_SUPABASE_URL');
    expect(createSupabaseClient).not.toHaveBeenCalled();
  });
});
