//lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// In Next.js, environment variables are accessed via process.env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate that the environment variables are defined
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
}

// Client-side Supabase client (for general use)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);