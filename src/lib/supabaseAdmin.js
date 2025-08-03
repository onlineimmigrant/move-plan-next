//lib/supabaseAdmin.js



import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Debug environment variables
console.log('supabaseAdmin - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
console.log('supabaseAdmin - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey);

// Validate environment variables
if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
}

// Admin Supabase client (for server-side admin tasks only)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});