const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupAdminUser() {
  console.log('Setting up admin user...');
  
  try {
    // First, let's see all users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    console.log('All profiles:', profiles);
    
    if (profiles && profiles.length > 0) {
      // Update the first user to be admin with site creation permissions
      const userId = profiles[0].id;
      
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          role: 'admin',
          is_site_creator: true
        })
        .eq('id', userId)
        .select()
        .single();
      
      console.log('Updated profile:', { updatedProfile, updateError });
      
      // Also create a general organization if it doesn't exist
      const { data: generalOrg, error: generalOrgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('type', 'general')
        .limit(1);
      
      console.log('General organization check:', { generalOrg, generalOrgError });
      
      if (!generalOrg || generalOrg.length === 0) {
        const { data: newGeneralOrg, error: createGeneralError } = await supabase
          .from('organizations')
          .insert({
            name: 'Main Organization',
            type: 'general',
            base_url: null,
            base_url_local: 'http://localhost:3000'
          })
          .select()
          .single();
        
        console.log('Created general organization:', { newGeneralOrg, createGeneralError });
        
        if (newGeneralOrg) {
          // Update the admin user to belong to the general organization
          const { data: profileUpdate, error: profileUpdateError } = await supabase
            .from('profiles')
            .update({
              organization_id: newGeneralOrg.id
            })
            .eq('id', userId)
            .select();
          
          console.log('Updated profile with organization:', { profileUpdate, profileUpdateError });
        }
      } else {
        // Update the admin user to belong to the existing general organization
        const { data: profileUpdate, error: profileUpdateError } = await supabase
          .from('profiles')
          .update({
            organization_id: generalOrg[0].id
          })
          .eq('id', userId)
          .select();
        
        console.log('Updated profile with existing organization:', { profileUpdate, profileUpdateError });
      }
    }
  } catch (error) {
    console.error('Error setting up admin user:', error);
  }
}

setupAdminUser().catch(console.error);
