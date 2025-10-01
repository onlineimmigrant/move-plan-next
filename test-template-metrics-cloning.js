require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTemplateSectionMetricsCloning() {
  console.log('🧪 Testing Template Section Metrics Cloning Logic');
  
  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
  
  try {
    // Test the exact query from the clone route
    console.log('1. Getting template section metrics with joins...');
    const { data: sourceTemplateSectionMetrics, error: templateSectionMetricsError } = await supabase
      .from('website_templatesection_metrics')
      .select(`
        *,
        website_templatesection:templatesection_id (organization_id),
        website_metric:metric_id (organization_id)
      `);

    console.log('All template section metrics found:', sourceTemplateSectionMetrics?.length || 0);
    console.log('Error:', templateSectionMetricsError?.message);

    if (sourceTemplateSectionMetrics && sourceTemplateSectionMetrics.length > 0) {
      console.log('\n2. Filtering for source organization...');
      
      // Filter to only those belonging to our source organization
      const orgTemplateSectionMetrics = sourceTemplateSectionMetrics.filter(metric => 
        metric.website_templatesection?.organization_id === sourceOrgId ||
        metric.website_metric?.organization_id === sourceOrgId
      );

      console.log('Org-specific template section metrics found:', orgTemplateSectionMetrics.length);

      if (orgTemplateSectionMetrics.length > 0) {
        console.log('\n3. Sample metrics to be cloned:');
        orgTemplateSectionMetrics.slice(0, 3).forEach((metric, index) => {
          console.log(`${index + 1}. Metric ID ${metric.id}:`);
          console.log(`   - templatesection_id: ${metric.templatesection_id}`);
          console.log(`   - metric_id: ${metric.metric_id}`);
          console.log(`   - template section org: ${metric.website_templatesection?.organization_id || 'N/A'}`);
          console.log(`   - metric org: ${metric.website_metric?.organization_id || 'N/A'}`);
        });

        console.log('\n4. Simulating cloning process...');
        let successfulMetrics = 0;
        let failedMetrics = 0;

        for (const metric of orgTemplateSectionMetrics) {
          const { id, website_templatesection, website_metric, ...metricWithoutId } = metric;

          console.log(`Processing metric ${id}: templatesection_id=${metric.templatesection_id}, metric_id=${metric.metric_id}`);
          
          // We would insert this data (simulated)
          const metricData = {
            ...metricWithoutId,
          };

          console.log(`   Would insert:`, metricData);
          successfulMetrics++; // Simulate success
        }

        console.log(`\n📊 Simulation Results: ${successfulMetrics}/${orgTemplateSectionMetrics.length} successful`);
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testTemplateSectionMetricsCloning();
