const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'present' : 'missing');
console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'present' : 'missing');

async function testDatabaseStructure() {
  console.log('Testing database structure...');
  
  // Test if organizations table exists and check its structure
  try {
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);
    
    console.log('Organizations table test:', { 
      success: !orgsError, 
      error: orgsError?.message,
      sampleData: orgs?.[0]
    });
    
    if (orgs && orgs.length > 0) {
      console.log('Organizations table columns:', Object.keys(orgs[0]));
    }
  } catch (error) {
    console.error('Error testing organizations table:', error);
  }
  
  // Test if profiles table has is_site_creator column
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, role, is_site_creator, organization_id')
      .limit(1);
    
    console.log('Profiles table test:', { 
      success: !profilesError, 
      error: profilesError?.message,
      sampleData: profiles?.[0]
    });
  } catch (error) {
    console.error('Error testing profiles table:', error);
  }
}

testDatabaseStructure().catch(console.error);
