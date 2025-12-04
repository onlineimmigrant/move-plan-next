// lib/supabaseAdmin.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseAdminInstance: SupabaseClient | null = null;

function createSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Validate environment variables
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Lazy getter for admin client
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    if (!supabaseAdminInstance) {
      supabaseAdminInstance = createSupabaseAdmin();
    }
    return supabaseAdminInstance[prop as keyof SupabaseClient];
  }
});
