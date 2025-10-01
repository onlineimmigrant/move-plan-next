require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigateTemplateMetrics() {
  console.log('🔍 Investigating website_templatesection_metrics');
  
  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
  
  try {
    // Get template section metrics with simpler query first
    const { data: metrics, error } = await supabase
      .from('website_templatesection_metrics')
      .select('*')
      .limit(5);

    console.log('All template section metrics found:', metrics?.length || 0);

    // Then try with organization filter
    const { data: orgMetrics, error: orgError } = await supabase
      .from('website_templatesection_metrics')
      .select('*')
      .eq('organization_id', sourceOrgId)
      .limit(3);

    console.log('Error:', error?.message);
    console.log('Org-specific metrics found:', orgMetrics?.length || 0);
    console.log('Org Error:', orgError?.message);

    if (metrics && metrics.length > 0) {
      console.log('\nSample metric structure (any org):');
      console.log('First metric keys:', Object.keys(metrics[0]));
      console.log('First metric:', metrics[0]);
    }

    if (orgMetrics && orgMetrics.length > 0) {
      console.log('\nOrg-specific metrics:');
      orgMetrics.forEach((metric, index) => {
        console.log(`${index + 1}. Metric ID ${metric.id}:`, metric);
      });
    }

    // Also check regular website_metric table
    console.log('\n📊 Checking website_metric table:');
    const { data: websiteMetrics } = await supabase
      .from('website_metric')
      .select('*')
      .eq('organization_id', sourceOrgId)
      .limit(3);

    console.log('Website metrics found:', websiteMetrics?.length || 0);
    if (websiteMetrics && websiteMetrics.length > 0) {
      console.log('Website metric keys:', Object.keys(websiteMetrics[0]));
      websiteMetrics.forEach((metric, index) => {
        console.log(`${index + 1}. Metric:`, metric);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

investigateTemplateMetrics();
