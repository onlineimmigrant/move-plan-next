require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMetricsCloning() {
  console.log('🔍 Checking if Metrics are Actually Being Cloned');
  
  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
  
  try {
    // Check existing organizations to see if any have cloned metrics
    console.log('1. Checking existing organizations...');
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (organizations) {
      console.log(`Found ${organizations.length} recent organizations:`);
      organizations.forEach((org, index) => {
        const isSource = org.id === sourceOrgId;
        console.log(`${index + 1}. ${org.name} (${org.id.slice(0, 8)}...) ${isSource ? '← SOURCE' : ''}`);
      });

      // Check if any non-source organizations have website metrics
      console.log('\n2. Checking website metrics in each organization...');
      for (const org of organizations) {
        if (org.id === sourceOrgId) continue;
        
        const { data: metrics } = await supabase
          .from('website_metric')
          .select('id, title')
          .eq('organization_id', org.id);

        console.log(`   ${org.name}: ${metrics?.length || 0} website metrics`);
        
        if (metrics && metrics.length > 0) {
          console.log('     Sample metrics:', metrics.slice(0, 2).map(m => m.title));
        }
      }

      // Check template section metrics
      console.log('\n3. Checking template section metrics...');
      for (const org of organizations) {
        if (org.id === sourceOrgId) continue;
        
        // Get template section metrics that reference metrics from this org
        const { data: templateMetrics } = await supabase
          .from('website_templatesection_metrics')
          .select(`
            id,
            templatesection_id,
            metric_id,
            website_metric:metric_id (organization_id, title)
          `)
          .eq('website_metric.organization_id', org.id);

        console.log(`   ${org.name}: ${templateMetrics?.length || 0} template section metrics`);
      }
    }

    // Check the source organization metrics for comparison
    console.log('\n4. Source organization metrics (for reference):');
    const { data: sourceMetrics } = await supabase
      .from('website_metric')
      .select('id, title')
      .eq('organization_id', sourceOrgId);
    
    console.log(`   Source has ${sourceMetrics?.length || 0} website metrics`);

    const { data: sourceTemplateMetrics } = await supabase
      .from('website_templatesection_metrics')
      .select(`
        id,
        templatesection_id,
        metric_id,
        website_metric:metric_id (organization_id)
      `)
      .eq('website_metric.organization_id', sourceOrgId);
    
    console.log(`   Source has ${sourceTemplateMetrics?.length || 0} template section metrics`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkMetricsCloning();
