import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('supabaseServerClient - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
console.log('supabaseServerClient - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? 'Set' : 'Missing');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables:', { supabaseUrl, supabaseServiceRoleKey });
  throw new Error('Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
}

export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function fetchSettings() {
  try {
    console.log('Fetching settings with supabaseServer');
    const { data, error } = await supabaseServer
      .from('settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error('supabaseServer fetchSettings error:', error);
      return null;
    }
    console.log('supabaseServer settings:', data);
    return data;
  } catch (error) {
    console.error('supabaseServer fetchSettings catch error:', error);
    return null;
  }
}