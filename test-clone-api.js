const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCloning() {
  try {
    // Create a test user session for API authentication
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com', // You'll need to create this user or use existing one
      password: 'testpassword123'
    });

    if (authError) {
      console.log('Auth error:', authError.message);
      console.log('Attempting to create test user...');
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'testpassword123'
      });
      
      if (signUpError) {
        console.log('Cannot authenticate. Manual testing required.');
        return;
      }
      
      console.log('Test user created. You may need to confirm email first.');
      return;
    }

    const token = authData.session?.access_token;
    if (!token) {
      console.log('No session token available');
      return;
    }

    // Now call the clone API
    const response = await fetch('http://localhost:3000/api/organizations/de0d5c21-787f-49c2-a665-7ff8e599c891/clone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Test Clone Debug',
        domain: 'testclonedebug.example.com'
      })
    });

    const result = await response.json();
    console.log('Clone result:', result);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCloning();
