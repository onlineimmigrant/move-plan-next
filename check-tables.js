require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use the same environment variables as the app
const supabaseUrl = 'https://rgbmdfaoowqbgshjuwwm.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkTables() {
  try {
    // Check what tables exist
    const { data, error } = await supabase.rpc('get_table_names');
    
    if (error && error.code === 'PGRST202') {
      // Function doesn't exist, use information_schema instead
      const { data: tables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .like('table_name', '%blog%,%product%,%feature%,%faq%');
      
      if (tableError) {
        console.error('Error querying information_schema:', tableError);
        
        // Try alternative method - check specific table names
        console.log('\nTrying alternative method - checking specific tables:');
        
        const tablesToCheck = ['blog_post', 'blog_posts', 'product', 'products', 'feature', 'features', 'faq', 'faqs'];
        
        for (const tableName of tablesToCheck) {
          try {
            const { data, error } = await supabase
              .from(tableName)
              .select('*')
              .limit(1);
            
            if (!error) {
              console.log(`✅ Table '${tableName}' exists and is accessible`);
            } else if (error.code === '42P01') {
              console.log(`❌ Table '${tableName}' does not exist`);
            } else {
              console.log(`⚠️  Table '${tableName}' exists but error: ${error.message}`);
            }
          } catch (e) {
            console.log(`❌ Table '${tableName}' - Error: ${e.message}`);
          }
        }
      } else {
        console.log('Tables found:', tables);
      }
    } else {
      console.log('Tables found:', data);
    }
  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

checkTables();
