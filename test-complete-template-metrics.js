require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCompleteTemplateMetricsCloning() {
  console.log('🧪 Testing Complete Template Metrics Cloning Process');
  
  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
  
  try {
    // Step 1: Test website metrics cloning
    console.log('\n📊 Step 1: Testing Website Metrics Cloning');
    const { data: sourceWebsiteMetrics, error: websiteMetricsError } = await supabase
      .from('website_metric')
      .select('*')
      .eq('organization_id', sourceOrgId);

    console.log('Source website metrics found:', sourceWebsiteMetrics?.length || 0);
    if (websiteMetricsError) console.log('Error:', websiteMetricsError.message);

    if (sourceWebsiteMetrics && sourceWebsiteMetrics.length > 0) {
      console.log('Sample website metrics:');
      sourceWebsiteMetrics.slice(0, 3).forEach((metric, index) => {
        console.log(`${index + 1}. ID: ${metric.id}, Title: "${metric.title}"`);
      });

      // Simulate ID mapping
      let websiteMetricIdMapping = {};
      sourceWebsiteMetrics.forEach((metric, index) => {
        websiteMetricIdMapping[metric.id] = 1000 + index; // Simulate new IDs
      });
      console.log('Simulated ID mapping:', websiteMetricIdMapping);

      // Step 2: Test template section metrics with mapping
      console.log('\n🔗 Step 2: Testing Template Section Metrics with ID Mapping');
      
      const { data: sourceTemplateSectionMetrics, error: templateSectionMetricsError } = await supabase
        .from('website_templatesection_metrics')
        .select(`
          *,
          website_templatesection:templatesection_id (organization_id),
          website_metric:metric_id (organization_id)
        `);

      if (sourceTemplateSectionMetrics && sourceTemplateSectionMetrics.length > 0) {
        const orgTemplateSectionMetrics = sourceTemplateSectionMetrics.filter(metric => 
          metric.website_templatesection?.organization_id === sourceOrgId ||
          metric.website_metric?.organization_id === sourceOrgId
        );

        console.log('Org-specific template section metrics found:', orgTemplateSectionMetrics.length);

        console.log('\nSample mappings:');
        orgTemplateSectionMetrics.slice(0, 5).forEach((metric, index) => {
          const { id, website_templatesection, website_metric, ...metricWithoutId } = metric;
          
          const metricData = {
            ...metricWithoutId,
            metric_id: websiteMetricIdMapping[metric.metric_id] || metric.metric_id,
          };

          console.log(`${index + 1}. Template Section Metric ${id}:`);
          console.log(`   Original metric_id: ${metric.metric_id} → New metric_id: ${metricData.metric_id}`);
          console.log(`   templatesection_id: ${metric.templatesection_id} (unchanged)`);
          console.log(`   Would insert:`, metricData);
        });

        console.log(`\n📊 Total template section metrics to clone: ${orgTemplateSectionMetrics.length}`);
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testCompleteTemplateMetricsCloning();
