// List products for your organization
const SUPABASE_URL = 'https://rgbmdfaoowqbgshjuwwm.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnYm1kZmFvb3dxYmdzaGp1d3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTc3OTE1MiwiZXhwIjoyMDU3MzU1MTUyfQ.Y2cSgHrtrxmJUs6bc39nnfL9ZNPWyI4764L5dbM09Cs';
const YOUR_ORG = '6695b959-45ef-44b4-a68c-9cd0fe0e25a3';

async function listProducts() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/product?organization_id=eq.${YOUR_ORG}&select=id,product_name,slug`, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    }
  });

  const products = await response.json();
  
  console.log(`\nProducts for organization ${YOUR_ORG}:`);
  console.log(`Total: ${products.length}\n`);
  
  products.forEach(p => {
    console.log(`ID: ${p.id.toString().padEnd(6)} | ${p.product_name}`);
  });
  
  console.log(`\nTo attach R2 videos to a product, run:`);
  console.log(`node attach-r2-videos-to-product.js <product_id>`);
}

listProducts().catch(console.error);
