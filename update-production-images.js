// Script to update submenu items with production-ready placeholder images
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://rgbmdfaoowqbgshjuwwm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnYm1kZmFvb3dxYmdzaGp1d3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTc3OTE1MiwiZXhwIjoyMDU3MzU1MTUyfQ.Y2cSgHrtrxmJUs6bc39nnfL9ZNPWyI4764L5dbM09Cs'
);

async function updateWithProductionImages() {
  try {
    console.log('Updating submenu items with production-ready images...');
    
    // Get all submenu items
    const { data: items, error: fetchError } = await supabase
      .from('website_submenuitem')
      .select('*')
      .order('id');
    
    if (fetchError) {
      console.error('Error fetching items:', fetchError);
      return;
    }
    
    console.log(`Found ${items.length} submenu items`);
    
    // Define a mapping of common submenu types to appropriate images
    const imageMapping = {
      'prep': 'https://via.placeholder.com/400x300/3B82F6/ffffff?text=Prep+Materials',
      'course': 'https://via.placeholder.com/400x300/10B981/ffffff?text=Online+Course', 
      'book': 'https://via.placeholder.com/400x300/F59E0B/ffffff?text=Study+Books',
      'free': 'https://via.placeholder.com/400x300/8B5CF6/ffffff?text=Free+Resources',
      'bundle': 'https://via.placeholder.com/400x300/EF4444/ffffff?text=Course+Bundle',
      'sqe': 'https://via.placeholder.com/400x300/06B6D4/ffffff?text=SQE+Training',
      'flk': 'https://via.placeholder.com/400x300/84CC16/ffffff?text=FLK+Course'
    };
    
    // Update each item with appropriate images
    for (const item of items) {
      let imageUrl = 'https://via.placeholder.com/400x300/6B7280/ffffff?text=Course+Material'; // Default
      
      // Try to match the item name to get a more appropriate image
      const itemNameLower = item.name.toLowerCase();
      for (const [key, url] of Object.entries(imageMapping)) {
        if (itemNameLower.includes(key)) {
          imageUrl = url;
          break;
        }
      }
      
      const updates = {
        image: imageUrl
      };
      
      const { error: updateError } = await supabase
        .from('website_submenuitem')
        .update(updates)
        .eq('id', item.id);
      
      if (updateError) {
        console.error(`Error updating item ${item.id}:`, updateError);
      } else {
        console.log(`✅ Updated item ${item.id}: "${item.name}" with ${imageUrl}`);
      }
    }
    
    console.log('\n✅ All submenu items updated with production-ready placeholder images!');
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Replace placeholder.com URLs with your own hosted images');
    console.log('2. Upload real images to your Supabase storage or CDN');
    console.log('3. Update the image URLs in the database to point to your real assets');
    console.log('\n🔄 Refresh your browser to see the changes.');
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

// Run the update
updateWithProductionImages();