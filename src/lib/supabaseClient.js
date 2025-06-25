import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('supabaseClient - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
console.log('supabaseClient - NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey);
console.log('supabaseClient - NEXT_PUBLIC_SUPABASE_PROJECT_ID:', process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID);

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
      setItem: (key, value) => {
        localStorage.setItem(key, value);
        console.log('Storage set:', key, value.slice(0, 20));
      },
      removeItem: (key) => {
        localStorage.removeItem(key);
        console.log('Storage removed:', key);
      },
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

supabase.auth.onAuthStateChange((event, session) => {
  console.log('supabaseClient - Auth state changed:', event, 'Session:', session ? {
    access_token: session.access_token?.substring(0, 10) + '...',
    user_id: session.user?.id,
  } : null);
  console.log('Cookies after auth change:', document.cookie);
  console.log('LocalStorage:', localStorage.getItem(`sb-${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}-auth-token`));
});