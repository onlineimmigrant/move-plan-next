// Script to fix R2 video records that have video URLs in thumbnail_url field
// This clears thumbnail_url if it contains a .mp4 file URL

const SUPABASE_URL = 'https://rgbmdfaoowqbgshjuwwm.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnYm1kZmFvb3dxYmdzaGp1d3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTc3OTE1MiwiZXhwIjoyMDU3MzU1MTUyfQ.Y2cSgHrtrxmJUs6bc39nnfL9ZNPWyI4764L5dbM09Cs';

async function main() {
  console.log('Fetching R2 video records...');
  
  // Get all R2 videos
  const response = await fetch(`${SUPABASE_URL}/rest/v1/product_media?video_player=eq.r2&select=*`, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    }
  });

  const records = await response.json();
  console.log(`Found ${records.length} R2 video records`);

  // Find records with .mp4 in thumbnail_url
  const needsFixing = records.filter(r => 
    r.thumbnail_url && r.thumbnail_url.includes('.mp4')
  );

  console.log(`\nRecords needing fix: ${needsFixing.length}`);
  
  if (needsFixing.length === 0) {
    console.log('No records need fixing!');
    return;
  }

  // Show what will be fixed
  console.log('\nWill clear thumbnail_url for:');
  needsFixing.forEach(r => {
    console.log(`  - ID ${r.id}: ${r.thumbnail_url}`);
  });

  // Fix each record
  console.log('\nFixing records...');
  let fixed = 0;
  let failed = 0;

  for (const record of needsFixing) {
    try {
      const updateResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/product_media?id=eq.${record.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ thumbnail_url: null })
        }
      );

      if (updateResponse.ok) {
        console.log(`✅ Fixed ID ${record.id}`);
        fixed++;
      } else {
        const error = await updateResponse.text();
        console.error(`❌ Failed to fix ID ${record.id}:`, error);
        failed++;
      }
    } catch (error) {
      console.error(`❌ Error fixing ID ${record.id}:`, error.message);
      failed++;
    }
  }

  console.log(`\n✅ Fixed: ${fixed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('\nDone! R2 videos should now show placeholder thumbnails.');
}

main().catch(console.error);
