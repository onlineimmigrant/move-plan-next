require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCompleteFixedTemplateMetricsCloning() {
  console.log('🧪 Testing FIXED Template Metrics Cloning Process');
  
  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
  
  try {
    console.log('\n📋 Step 1: Template Sections Cloning with ID Mapping');
    const { data: sourceTemplateSections } = await supabase
      .from('website_templatesection')
      .select('*')
      .eq('organization_id', sourceOrgId);

    console.log('Source template sections found:', sourceTemplateSections?.length || 0);

    // Simulate template section ID mapping
    let templateSectionIdMapping = {};
    sourceTemplateSections?.forEach((section, index) => {
      templateSectionIdMapping[section.id] = 2000 + index; // Simulate new IDs
    });
    console.log('Template section ID mapping sample:', 
      Object.fromEntries(Object.entries(templateSectionIdMapping).slice(0, 5)));

    console.log('\n📊 Step 2: Website Metrics Cloning with ID Mapping');
    const { data: sourceWebsiteMetrics } = await supabase
      .from('website_metric')
      .select('*')
      .eq('organization_id', sourceOrgId);

    console.log('Source website metrics found:', sourceWebsiteMetrics?.length || 0);

    // Simulate website metric ID mapping
    let websiteMetricIdMapping = {};
    sourceWebsiteMetrics?.forEach((metric, index) => {
      websiteMetricIdMapping[metric.id] = 1000 + index; // Simulate new IDs
    });
    console.log('Website metric ID mapping sample:', 
      Object.fromEntries(Object.entries(websiteMetricIdMapping).slice(0, 5)));

    console.log('\n🔗 Step 3: Template Section Metrics with BOTH ID Mappings');
    const { data: sourceTemplateSectionMetrics } = await supabase
      .from('website_templatesection_metrics')
      .select(`
        *,
        website_templatesection:templatesection_id (organization_id),
        website_metric:metric_id (organization_id)
      `);

    const orgTemplateSectionMetrics = sourceTemplateSectionMetrics?.filter(metric => 
      metric.website_templatesection?.organization_id === sourceOrgId ||
      metric.website_metric?.organization_id === sourceOrgId
    ) || [];

    console.log('Org-specific template section metrics found:', orgTemplateSectionMetrics.length);

    console.log('\nFixed mapping examples:');
    orgTemplateSectionMetrics.slice(0, 5).forEach((metric, index) => {
      const { id, website_templatesection, website_metric, ...metricWithoutId } = metric;
      
      const metricData = {
        ...metricWithoutId,
        templatesection_id: templateSectionIdMapping[metric.templatesection_id] || metric.templatesection_id,
        metric_id: websiteMetricIdMapping[metric.metric_id] || metric.metric_id,
      };

      console.log(`${index + 1}. Template Section Metric ${id}:`);
      console.log(`   Original templatesection_id: ${metric.templatesection_id} → New: ${metricData.templatesection_id}`);
      console.log(`   Original metric_id: ${metric.metric_id} → New: ${metricData.metric_id}`);
      console.log(`   Would insert:`, metricData);
    });

    console.log(`\n✅ Total properly mapped template section metrics: ${orgTemplateSectionMetrics.length}`);
    console.log('\n🎯 This should fix the cross-organization sharing issue!');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testCompleteFixedTemplateMetricsCloning();
