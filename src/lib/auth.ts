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

    // Allow both admin and superadmin roles
    return profile.role === 'admin' || profile.role === 'superadmin';
  } catch (err) {
    console.error('Error checking admin status:', err);
    return false;
  }
}

export async function isSuperadminClient(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return false;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      return false;
    }

    return profile.role === 'superadmin';
  } catch (err) {
    console.error('Error checking superadmin status:', err);
    return false;
  }
}