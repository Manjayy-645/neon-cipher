import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Creates an admin client using the service_role key for trusted server-only operations
 * (e.g. generating and storing secrets, processing payouts, verifying server-side guesses).
 * Never import this file into client components.
 */
export function createAdminClient() {
  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable.');
  }
  // Fallback to anon key if service role key not provided yet in development
  const key = serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
  }

  return createSupabaseClient<Database>(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
