// API endpoint to list all document sets for an organization
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all posts with document sets for this organization
    const { data: posts, error } = await supabase
      .from('blog_post')
      .select('organization_config')
      .eq('organization_id', organizationId)
      .not('organization_config->doc_set', 'is', null)
      .eq('display_config->>display_this_post', 'true');

    if (error) {
      console.error('Error fetching document sets:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Extract unique document sets with their titles
    const setsMap = new Map<string, { slug: string; title: string; count: number }>();
    
    posts?.forEach((post: any) => {
      const docSet = post.organization_config?.doc_set;
      const docSetTitle = post.organization_config?.doc_set_title;
      
      if (docSet) {
        if (setsMap.has(docSet)) {
          const existing = setsMap.get(docSet)!;
          existing.count += 1;
        } else {
          setsMap.set(docSet, {
            slug: docSet,
            title: docSetTitle || docSet,
            count: 1
          });
        }
      }
    });

    // Convert to array and sort alphabetically
    const sets = Array.from(setsMap.values()).sort((a, b) => 
      a.title.localeCompare(b.title)
    );

    return NextResponse.json(sets);
  } catch (error: any) {
    console.error('Document sets API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
