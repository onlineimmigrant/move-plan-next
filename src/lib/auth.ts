// src/lib/auth.ts
import { supabase } from './supabase';

export async function isAdminClient(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user found');
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