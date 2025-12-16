import { supabase } from '@/lib/supabaseClient';

export async function fixRealtimeRLSPolicies() {
  try {
    console.log('🔧 Fixing realtime RLS policies...');

    // Drop existing restrictive SELECT policies
    await supabase.rpc('exec_sql', {
      sql: `DROP POLICY IF EXISTS "Customers can view their own tickets" ON tickets;`
    });

    await supabase.rpc('exec_sql', {
      sql: `DROP POLICY IF EXISTS "Users can view ticket responses" ON ticket_responses;`
    });

    // Create new SELECT policies that allow realtime subscriptions
    await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY "Authenticated users can subscribe to ticket changes"
        ON tickets
        FOR SELECT
        USING (auth.role() = 'authenticated');`
    });

    await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY "Authenticated users can subscribe to response changes"
        ON ticket_responses
        FOR SELECT
        USING (auth.role() = 'authenticated');`
    });

    console.log('✅ Realtime RLS policies fixed successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error fixing realtime RLS policies:', error);
    return { success: false, error };
  }
}