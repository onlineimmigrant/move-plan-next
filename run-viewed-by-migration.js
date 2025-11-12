const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('🔄 Running migration to add viewed_by column...');
  
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Add viewed_by column to bookings table
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS viewed_by JSONB DEFAULT '[]'::jsonb;

      -- Add comment
      COMMENT ON COLUMN bookings.viewed_by IS 'Array of user IDs who have viewed this booking. Used for "NEW" badge functionality.';

      -- Create index
      CREATE INDEX IF NOT EXISTS idx_bookings_viewed_by ON bookings USING gin (viewed_by);
    `
  });

  if (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  console.log('✅ Migration completed successfully!');
  console.log('   - Added viewed_by column (JSONB, default: []');
  console.log('   - Created GIN index for performance');
}

runMigration();
