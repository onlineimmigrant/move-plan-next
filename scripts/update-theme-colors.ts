// Script to update theme colors in settings table
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateThemeColors() {
  console.log('🎨 Updating theme colors in settings...');

  // First, check current values
  const { data: currentData, error: fetchError } = await supabase
    .from('settings')
    .select('id, organization_id, primary_color, primary_shade, secondary_color, secondary_shade')
    .limit(5);

  if (fetchError) {
    console.error('❌ Error fetching current settings:', fetchError);
    return;
  }

  console.log('\n📊 Current settings:');
  console.log(JSON.stringify(currentData, null, 2));

  // Update all settings with default colors
  const { data: updateData, error: updateError } = await supabase
    .from('settings')
    .update({
      primary_color: 'sky',
      primary_shade: 600,
      secondary_color: 'gray',
      secondary_shade: 500,
    })
    .is('primary_color', null)
    .select();

  if (updateError) {
    console.error('❌ Error updating settings:', updateError);
    return;
  }

  console.log('\n✅ Updated settings:');
  console.log(JSON.stringify(updateData, null, 2));

  // Verify the update
  const { data: verifyData, error: verifyError } = await supabase
    .from('settings')
    .select('id, organization_id, primary_color, primary_shade, secondary_color, secondary_shade')
    .limit(5);

  if (verifyError) {
    console.error('❌ Error verifying settings:', verifyError);
    return;
  }

  console.log('\n🔍 Verified settings after update:');
  console.log(JSON.stringify(verifyData, null, 2));
}

updateThemeColors().then(() => {
  console.log('\n✨ Done!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
