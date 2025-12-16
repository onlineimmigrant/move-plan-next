// src/lib/auth.ts
import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseClientPromise: Promise<SupabaseClient> | null = null;
let supabaseClientInstance: SupabaseClient | null = null;

async function getSupabaseClient(): Promise<SupabaseClient> {
  if (supabaseClientInstance) return supabaseClientInstance;

  if (!supabaseClientPromise) {
    supabaseClientPromise = import('./supabaseClient').then((mod) => {
      supabaseClientInstance = mod.supabase;
      return mod.supabase;
    });
  }

  return supabaseClientPromise;
}

export async function isAdminClient(): Promise<boolean> {
  try {
    const supabase = await getSupabaseClient();
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
    const supabase = await getSupabaseClient();
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