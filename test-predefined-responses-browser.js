// Quick test to check predefined responses table accessibility
// Run this in your browser console on any page where Supabase is loaded

(async function testPredefinedResponses() {
  console.log('=== Testing Predefined Responses ===');
  
  // Get the Supabase client (adjust import path if needed)
  const { supabase } = await import('/src/lib/supabase.js');
  
  // Get current user's organization
  const { data: { session } } = await supabase.auth.getSession();
  console.log('User session:', session?.user?.id || 'Not logged in');
  
  // Try to fetch predefined responses
  console.log('Fetching predefined responses...');
  const { data, error } = await supabase
    .from('ticket_predefined_responses')
    .select('id, title, message')
    .order('title', { ascending: true });
  
  if (error) {
    console.error('❌ Error:', error);
    console.log('Table might not exist or RLS policy prevents access');
  } else {
    console.log('✅ Success! Found responses:', data?.length || 0);
    console.table(data);
  }
  
  // Also check tickets table
  console.log('\nChecking tickets table...');
  const { data: ticketsData, error: ticketsError } = await supabase
    .from('tickets')
    .select('id, subject, status')
    .limit(5);
  
  if (ticketsError) {
    console.error('❌ Tickets error:', ticketsError);
  } else {
    console.log('✅ Tickets found:', ticketsData?.length || 0);
    console.table(ticketsData);
  }
})();
