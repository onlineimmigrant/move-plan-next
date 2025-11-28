import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

let supabaseServer: SupabaseClient;

if (supabaseUrl && serviceRoleKey) {
  // Prefer service role on the server when available (bypasses RLS for server-only use)
  supabaseServer = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
} else {
  // Fallback to anon client for development or missing envs
  supabaseServer = supabase as unknown as SupabaseClient;
}

export { supabaseServer };
