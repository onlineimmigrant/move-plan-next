// Script to attach existing R2 videos from storage to a product
// Usage: node attach-r2-videos-to-product.js <product_id>

const SUPABASE_URL = 'https://rgbmdfaoowqbgshjuwwm.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnYm1kZmFvb3dxYmdzaGp1d3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTc3OTE1MiwiZXhwIjoyMDU3MzU1MTUyfQ.Y2cSgHrtrxmJUs6bc39nnfL9ZNPWyI4764L5dbM09Cs';
const R2_ACCOUNT_ID = '148ea28e9ba5c752eb75dc3225df2e2c';
const R2_BUCKET_NAME = 'product-videos';
const CLOUDFLARE_API_TOKEN = '4EcATZ-xSB42joRPEbn_3gXbVjISjkTEb-ZG9r5g';
const R2_PUBLIC_URL = 'https://pub-6891bafd3bd54c36b02da71be2099135.r2.dev';
const ORG_ID = '6695b959-45ef-44b4-a68c-9cd0fe0e25a3';

async function main() {
  const productId = process.argv[2];
  
  if (!productId) {
    console.error('Usage: node attach-r2-videos-to-product.js <product_id>');
    console.error('Example: node attach-r2-videos-to-product.js 123');
    process.exit(1);
  }

  console.log('Fetching product...');
  
  // Get product to verify it exists and get org_id
  const productResponse = await fetch(`${SUPABASE_URL}/rest/v1/product?id=eq.${productId}`, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    }
  });

  const products = await productResponse.json();
  if (!products || products.length === 0) {
    console.error('Product not found:', productId);
    process.exit(1);
  }

  const product = products[0];
  console.log('Product found:', product.product_name);
  console.log('Organization:', product.organization_id);

  // List R2 videos for this organization
  console.log('\nFetching R2 videos...');
  const orgId = product.organization_id || ORG_ID; // Use product's org or fallback
  const prefix = `${orgId}/videos/`;
  const listUrl = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects?prefix=${encodeURIComponent(prefix)}`;

  console.log('Looking for videos in:', prefix);

  const r2Response = await fetch(listUrl, {
    headers: { 'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}` }
  });

  const r2Data = await r2Response.json();
  const videos = Array.isArray(r2Data.result) ? r2Data.result : [];

  console.log(`Found ${videos.length} videos in R2 storage`);

  if (videos.length === 0) {
    console.log('No videos to attach');
    return;
  }

  // Get existing product_media for this product
  const mediaResponse = await fetch(`${SUPABASE_URL}/rest/v1/product_media?product_id=eq.${productId}&is_video=eq.true`, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    }
  });

  const existingMedia = await mediaResponse.json();
  const existingUrls = new Set(existingMedia.map(m => m.video_url));
  
  console.log(`Product already has ${existingMedia.length} videos attached`);

  // Get max order
  let maxOrder = 0;
  if (existingMedia.length > 0) {
    maxOrder = Math.max(...existingMedia.map(m => m.order || 0));
  }

  // Attach new videos
  console.log('\nAttaching videos...');
  let attached = 0;
  let skipped = 0;

  for (const video of videos) {
    const videoUrl = `${R2_PUBLIC_URL}/${video.key}`;
    
    if (existingUrls.has(videoUrl)) {
      console.log(`⏭️  Skipping (already attached): ${video.key.split('/').pop()}`);
      skipped++;
      continue;
    }

    maxOrder++;

    const mediaData = {
      product_id: parseInt(productId),
      organization_id: product.organization_id,
      order: maxOrder,
      is_video: true,
      video_player: 'r2',
      video_url: videoUrl,
      thumbnail_url: null, // R2 videos don't have auto-generated thumbnails
      image_url: null,
    };

    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/product_media`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(mediaData)
    });

    if (insertResponse.ok) {
      console.log(`✅ Attached: ${video.key.split('/').pop()}`);
      attached++;
    } else {
      const error = await insertResponse.text();
      console.error(`❌ Failed to attach ${video.key.split('/').pop()}:`, error);
    }
  }

  console.log(`\n✨ Done! Attached ${attached} videos, skipped ${skipped}`);
  console.log(`\nView product: http://localhost:3000/products/<product-slug>`);
}

main().catch(console.error);
