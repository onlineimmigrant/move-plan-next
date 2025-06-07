import { createClient } from '@supabase/supabase-js';

// In Next.js, environment variables are accessed via process.env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug environment variables
console.log('supabaseClient - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
console.log('supabaseClient - NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey);

// Validate that the environment variables are defined
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
  );
}

// Client-side Supabase client (for general use)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Explicitly enable session persistence
    autoRefreshToken: true, // Automatically refresh the token
    detectSessionInUrl: true, // Detect session in URL for OAuth flows
    storage: typeof window !== 'undefined' ? localStorage : undefined, // Use localStorage in the browser
    flowType: 'pkce', // Use PKCE for secure auth flows
  },
});

// Debug session changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('supabaseClient - Auth state changed:', event, 'Session:', session ? {
    access_token: session.access_token?.substring(0, 10) + '...',
    user_id: session.user?.id,
  } : null);
});