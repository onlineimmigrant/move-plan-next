
//lib/supabaseAdmin.js
import { createClient } from '@supabase/supabase-js';

// In Next.js, environment variables are accessed via process.env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate that the environment variables are defined
if (!supabaseUrl) {
  throw new Error('Missing Supabase environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing Supabase service role key. Ensure SUPABASE_SERVICE_ROLE_KEY is set.');
}

// Admin Supabase client (for server-side use only)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});