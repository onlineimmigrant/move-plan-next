// src/lib/supabaseServerClient.js
import { createClient } from '@supabase/supabase-js';

// Use the service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
}

// Server-side Supabase client
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});