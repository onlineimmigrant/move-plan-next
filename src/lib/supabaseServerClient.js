import { createClient } from '@supabase/supabase-js';

// Use environment variables for server-side operations
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL; // Fallback to NEXT_PUBLIC_ for compatibility
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Debug environment variables
console.log('supabaseServerClient - SUPABASE_URL:', supabaseUrl);
console.log('supabaseServerClient - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey);

// Validate environment variables
if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables. Ensure SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are set.');
}

// Server-side Supabase client
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});