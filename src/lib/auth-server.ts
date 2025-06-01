// src/lib/auth-server.ts
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function isAdminServer(): Promise<boolean> {
  const cookieStore = await cookies(); // Await cookies()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
      },
    }
  );

  try {
    // Get session from cookies (Supabase stores auth token in sb-auth-token or similar)
    const authToken = cookieStore.get('sb-auth-token')?.value;
    if (!authToken) {
      console.log('No auth token found in cookies');
      return false;
    }

    // Use auth token to get user
    const { data: { user }, error: sessionError } = await supabase.auth.getUser(authToken);
    if (sessionError || !user) {
      console.log('No authenticated user found:', sessionError?.message);
      return false;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      console.error('Error fetching profile:', error?.message);
      return false;
    }

    return profile.role === 'admin';
  } catch (err) {
    console.error('Error checking admin status:', err);
    return false;
  }
}