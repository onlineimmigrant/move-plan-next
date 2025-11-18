// Script to check which organization your user belongs to

const SUPABASE_URL = 'https://rgbmdfaoowqbgshjuwwm.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnYm1kZmFvb3dxYmdzaGp1d3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTc3OTE1MiwiZXhwIjoyMDU3MzU1MTUyfQ.Y2cSgHrtrxmJUs6bc39nnfL9ZNPWyI4764L5dbM09Cs';

async function main() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('Usage: node check-user-org.js <user-email>');
    console.error('Example: node check-user-org.js user@example.com');
    process.exit(1);
  }

  console.log('Looking up user:', email);
  console.log('');

  // Get user by email
  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    }
  });

  const userData = await userResponse.json();
  const user = userData.users?.find(u => u.email === email);

  if (!user) {
    console.error('❌ User not found:', email);
    process.exit(1);
  }

  console.log('✅ User found:', user.email);
  console.log('User ID:', user.id);
  console.log('');

  // Get user's profile
  const profileResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=*`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      }
    }
  );

  const profiles = await profileResponse.json();
  if (!profiles || profiles.length === 0) {
    console.error('❌ Profile not found for user');
    process.exit(1);
  }

  const profile = profiles[0];
  console.log('Profile Organization ID:', profile.organization_id);
  console.log('');

  // Get organization details
  const orgResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/organizations?id=eq.${profile.organization_id}&select=*`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      }
    }
  );

  const orgs = await orgResponse.json();
  if (orgs && orgs.length > 0) {
    const org = orgs[0];
    console.log('📁 Organization:', org.name || org.id);
    console.log('Organization ID:', org.id);
  }

  console.log('');
  console.log('🔍 Key Point:');
  console.log('This user can only access R2 videos from organization:', profile.organization_id);
  console.log('');
  console.log('If you switch to a different site (MetExam), but are still logged in with');
  console.log('this user account, you will still see CodedHarmony\'s videos because that\'s');
  console.log('what your user belongs to.');
  console.log('');
  console.log('Solution: Create separate user accounts for each organization.');
}

main().catch(console.error);
