require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigateTemplateSectionMetricsIssue() {
  console.log('🔍 Investigating Template Section Metrics Cross-Organization Issue');
  
  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
  
  try {
    // Check where these 151 template section metrics are pointing
    console.log('1. Analyzing template section metrics distribution...');
    
    const { data: allTemplateMetrics } = await supabase
      .from('website_templatesection_metrics')
      .select(`
        id,
        templatesection_id,
        metric_id,
        website_metric:metric_id (organization_id, title),
        website_templatesection:templatesection_id (organization_id)
      `)
      .limit(20);

    if (allTemplateMetrics) {
      console.log('\nFirst 10 template section metrics:');
      allTemplateMetrics.slice(0, 10).forEach((metric, index) => {
        console.log(`${index + 1}. TSM ID: ${metric.id}`);
        console.log(`   templatesection_id: ${metric.templatesection_id} (org: ${metric.website_templatesection?.organization_id || 'N/A'})`);
        console.log(`   metric_id: ${metric.metric_id} (org: ${metric.website_metric?.organization_id || 'N/A'})`);
      });
    }

    // Check if template sections are properly cloned per organization
    console.log('\n2. Checking template sections per organization...');
    
    const { data: organizations } = await supabase
      .from('organizations')
      .select('id, name')
      .order('created_at', { ascending: false })
      .limit(5);

    for (const org of organizations) {
      const { data: templateSections } = await supabase
        .from('website_templatesection')
        .select('id, organization_id')
        .eq('organization_id', org.id);

      console.log(`   ${org.name}: ${templateSections?.length || 0} template sections`);
    }

    // Check the actual problem: are template section metrics sharing IDs?
    console.log('\n3. Checking if template section metrics are properly isolated...');
    
    const testOrgId = 'clon5-metexam';
    const { data: testOrgTemplateMetrics } = await supabase
      .from('website_templatesection_metrics')
      .select(`
        id,
        templatesection_id,
        metric_id,
        website_templatesection:templatesection_id (organization_id)
      `)
      .limit(10);

    if (testOrgTemplateMetrics) {
      console.log('\nSample template section metrics analysis:');
      testOrgTemplateMetrics.forEach((metric, index) => {
        const belongsToOrg = metric.website_templatesection?.organization_id;
        console.log(`${index + 1}. TSM ${metric.id}: template section belongs to org ${belongsToOrg}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

investigateTemplateSectionMetricsIssue();
