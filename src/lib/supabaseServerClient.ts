// lib/supabaseServerClient.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseServerInstance: SupabaseClient | null = null;

function createSupabaseServer(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase environment variables:', { supabaseUrl, supabaseServiceRoleKey });
    throw new Error('Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Lazy getter for server client
export const supabaseServer = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    if (!supabaseServerInstance) {
      supabaseServerInstance = createSupabaseServer();
    }
    return supabaseServerInstance[prop as keyof SupabaseClient];
  }
});

export async function fetchSettings() {
  try {
    const { data, error } = await supabaseServer
      .from('settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error('supabaseServer fetchSettings error:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      return null;
    }
    return data;
  } catch (error) {
    console.error('supabaseServer fetchSettings catch error:', error);
    return null;
  }
}
