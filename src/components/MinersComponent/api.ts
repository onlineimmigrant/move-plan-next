import { supabase } from '@/lib/supabaseClient';
import { MinerData } from './types';

export async function fetchMiners(): Promise<MinerData[]> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();
      
    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    if (profile.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const { data: miners, error } = await supabase
      .from('miners')
      .select(`
        *,
        profiles (
          id,
          full_name,
          email
        )
      `)
      .eq('organization_id', profile.organization_id);

    if (error) {
      throw new Error(`Failed to fetch miners: ${error.message}`);
    }

    return miners || [];
  } catch (error) {
    console.error('Error fetching miners:', error);
    throw error;
  }
}

export async function createSampleMiners(): Promise<any> {
  // Get the session token from Supabase
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Authentication required');
  }

  const response = await fetch('/api/miners/sample', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to create sample miners: ${errorData}`);
  }

  return response.json();
}
