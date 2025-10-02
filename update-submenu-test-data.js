// Script to add test descriptions and images to submenu items
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://rgbmdfaoowqbgshjuwwm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnYm1kZmFvb3dxYmdzaGp1d3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTc3OTE1MiwiZXhwIjoyMDU3MzU1MTUyfQ.Y2cSgHrtrxmJUs6bc39nnfL9ZNPWyI4764L5dbM09Cs'
);

async function updateSubmenuItems() {
  try {
    console.log('Fetching current submenu items...');
    
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
    
    // Update each item with sample descriptions and images
    for (const item of items) {
      const updates = {
        description: `Explore our comprehensive ${item.name.toLowerCase()} services and discover innovative solutions tailored to your needs. Our expert team provides professional guidance and support.`,
        description_translation: {
          "en": `Explore our comprehensive ${item.name.toLowerCase()} services and discover innovative solutions tailored to your needs.`,
          "es": `Explore nuestros servicios integrales de ${item.name.toLowerCase()} y descubre soluciones innovadoras adaptadas a tus necesidades.`,
          "fr": `Explorez nos services complets de ${item.name.toLowerCase()} et découvrez des solutions innovantes adaptées à vos besoins.`
        },
        image: `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&auto=format&q=60` // Sample image
      };
      
      const { error: updateError } = await supabase
        .from('website_submenuitem')
        .update(updates)
        .eq('id', item.id);
      
      if (updateError) {
        console.error(`Error updating item ${item.id}:`, updateError);
      } else {
        console.log(`✅ Updated item ${item.id}: "${item.name}"`);
      }
    }
    
    console.log('\n✅ All submenu items have been updated with descriptions and images!');
    console.log('🔄 Refresh your browser to see the changes.');
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

// Run the update
updateSubmenuItems();