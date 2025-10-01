require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rgbmdfaoowqbgshjuwwm.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkTables() {
  try {
    console.log('Checking product table structure:');
    const { data: products, error: prodError } = await supabase
      .from('product')
      .select('*')
      .eq('organization_id', 'de0d5c21-787f-49c2-a665-7ff8e599c891')
      .limit(2);
    
    console.log('Products found:', products?.length || 0);
    if (products && products.length > 0) {
      console.log('Sample product structure:', Object.keys(products[0]));
      console.log('Sample product:', products[0]);
    }
    if (prodError) console.log('Product error:', prodError);

    console.log('\nChecking website_submenuitem table structure:');
    const { data: submenuItems, error: submenuError } = await supabase
      .from('website_submenuitem')
      .select('*')
      .eq('organization_id', 'de0d5c21-787f-49c2-a665-7ff8e599c891')
      .limit(2);
    
    console.log('Submenu items found:', submenuItems?.length || 0);
    if (submenuItems && submenuItems.length > 0) {
      console.log('Sample submenu item structure:', Object.keys(submenuItems[0]));
      console.log('Sample submenu item:', submenuItems[0]);
    }
    if (submenuError) console.log('Submenu error:', submenuError);

    console.log('\nChecking website_menuitem for reference:');
    const { data: menuItems, error: menuError } = await supabase
      .from('website_menuitem')
      .select('*')
      .eq('organization_id', 'de0d5c21-787f-49c2-a665-7ff8e599c891')
      .limit(2);
    
    console.log('Menu items found:', menuItems?.length || 0);
    if (menuItems && menuItems.length > 0) {
      console.log('Sample menu item structure:', Object.keys(menuItems[0]));
    }
    if (menuError) console.log('Menu error:', menuError);

  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

checkTables();
