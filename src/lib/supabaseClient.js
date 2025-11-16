import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || !process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID) {
  throw new Error(
    'Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and NEXT_PUBLIC_SUPABASE_PROJECT_ID are set.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? {
      getItem: (key) => localStorage.getItem(key),
      setItem: (key, value) => localStorage.setItem(key, value),
      removeItem: (key) => localStorage.removeItem(key),
    } : undefined,
    flowType: 'pkce',
    cookieOptions: {
      name: `sb-${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}-auth-token`,
      lifetime: 60 * 60 * 24 * 7,
      domain: 'localhost',
      path: '/',
      sameSite: 'Lax',
      secure: false,
    },
  },
});

// Optional: Track auth state changes (reduced logging)