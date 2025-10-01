import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch sample organizations (public endpoint - no auth required)
export async function GET() {
  try {
    console.log('Fetching sample organizations for showcase');

    // Get all sample organizations grouped by type
    const { data: sampleOrgs, error: sampleError } = await supabase
      .from('organizations')
      .select('id, name, type, base_url, created_at')
      .eq('is_sample', true)
      .order('type')
      .order('created_at', { ascending: true });

    if (sampleError) {
      console.error('Error fetching sample organizations:', sampleError);
      return NextResponse.json({ 
        error: 'Failed to fetch sample organizations', 
        details: sampleError.message,
        code: sampleError.code 
      }, { status: 500 });
    }

    console.log('Successfully fetched sample organizations:', sampleOrgs?.length || 0);

    // Group organizations by type and add numbering for duplicates
    const groupedSamples: { [key: string]: any[] } = {};
    const typeCounts: { [key: string]: number } = {};

    (sampleOrgs || []).forEach(org => {
      const orgType = org.type;
      
      if (!groupedSamples[orgType]) {
        groupedSamples[orgType] = [];
        typeCounts[orgType] = 0;
      }
      
      typeCounts[orgType]++;
      
      // Add display name with numbering if multiple samples of same type
      const displayName = typeCounts[orgType] > 1 
        ? `${org.name}-${typeCounts[orgType]}`
        : org.name;

      groupedSamples[orgType].push({
        ...org,
        displayName,
        sampleNumber: typeCounts[orgType]
      });
    });

    // Convert to array format for easier frontend consumption
    const sampleShowcase = Object.entries(groupedSamples).map(([type, orgs]) => ({
      type,
      typeDisplayName: formatTypeDisplayName(type),
      organizations: orgs,
      count: orgs.length
    }));

    console.log(`Found ${sampleOrgs?.length || 0} sample organizations across ${sampleShowcase.length} types`);

    return NextResponse.json({
      success: true,
      sampleTypes: sampleShowcase,
      totalSamples: sampleOrgs?.length || 0
    });

  } catch (error: any) {
    console.error('Sample organizations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to format type names for display
function formatTypeDisplayName(type: string): string {
  const typeMap: { [key: string]: string } = {
    'education': 'Education Services',
    'immigration': 'Immigration Services', 
    'realestate': 'Real Estate Services',
    'miner': 'Mining & Blockchain Services',
    'job': 'Job & Career Services',
    'platform': 'Platform Services',
    'healthcare': 'Healthcare Services',
    'finance': 'Financial Services',
    'retail': 'Retail & E-commerce',
    'consulting': 'Consulting Services',
    'technology': 'Technology Services',
    'legal': 'Legal Services'
  };

  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1) + ' Services';
}
