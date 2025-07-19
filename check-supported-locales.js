// Simple script to check and set supported_locales in the database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAndUpdateSupportedLocales() {
  try {
    console.log('Checking settings table structure...');
    
    // First, let's check if the column exists by trying to query it
    const { data: testData, error: testError } = await supabase
      .from('settings')
      .select('supported_locales')
      .limit(1);
    
    if (testError && testError.message.includes('column "supported_locales" does not exist')) {
      console.log('Column supported_locales does not exist. Adding it...');
      
      // Add the column
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE settings ADD COLUMN supported_locales JSONB DEFAULT '["en", "es", "fr", "de", "ru", "it", "pt", "zh", "ja", "pl"]'::jsonb;`
      });
      
      if (alterError) {
        console.error('Error adding column:', alterError);
        return;
      }
      
      console.log('✅ Column supported_locales added successfully!');
    } else if (testError) {
      console.error('Error checking column:', testError);
      return;
    } else {
      console.log('✅ Column supported_locales already exists');
    }
    
    // Now check current settings
    const { data: settings, error: selectError } = await supabase
      .from('settings')
      .select('id, language, supported_locales')
      .order('updated_at', { ascending: false })
      .limit(5);
    
    if (selectError) {
      console.error('Error fetching settings:', selectError);
      return;
    }
    
    console.log('Current settings:');
    console.log(JSON.stringify(settings, null, 2));
    
    // Update any settings that don't have supported_locales set
    for (const setting of settings || []) {
      if (!setting.supported_locales) {
        console.log(`Updating setting ID ${setting.id} with default supported_locales...`);
        
        const { error: updateError } = await supabase
          .from('settings')
          .update({
            supported_locales: ["en", "es", "fr", "de", "ru", "it", "pt", "zh", "ja", "pl"]
          })
          .eq('id', setting.id);
        
        if (updateError) {
          console.error(`Error updating setting ${setting.id}:`, updateError);
        } else {
          console.log(`✅ Updated setting ${setting.id}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

checkAndUpdateSupportedLocales().then(() => {
  console.log('Script completed');
  process.exit(0);
});
