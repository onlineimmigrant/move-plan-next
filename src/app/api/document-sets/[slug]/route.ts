// API endpoint to get all posts in a specific document set
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Helper function to extract TOC from HTML without JSDOM
function extractTOCFromHTML(html: string): TOCItem[] {
  const toc: TOCItem[] = [];
  
  // Match h2, h3, h4 tags with their content and id
  const headingRegex = /<h([234])([^>]*?)id=["']([^"']+)["']([^>]*?)>(.*?)<\/h\1>/gi;
  
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1]);
    const id = match[3];
    // Remove HTML tags from text content
    const text = match[5].replace(/<[^>]+>/g, '').trim();
    
    if (text) {
      toc.push({ level, text, id });
    }
  }
  
  return toc;
}

interface TOCItem {
  level: number;
  text: string;
  id: string;
}

interface PostInSet {
  id: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  toc: TOCItem[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');

    console.log('[API] Document set request:', { slug, organizationId, supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseServiceKey });

    if (!organizationId) {
      console.error('[API] Missing organization_id');
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[API] Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Single query: Get posts that either:
    // 1. Have organization_config.doc_set matching the slug (traditional multi-post sets)
    // 2. Have slug matching AND type=doc_set (new single-post doc sets)
    const { data: posts, error } = await supabase
      .from('blog_post')
      .select('id, slug, title, description, content, organization_config, display_config')
      .eq('organization_id', organizationId)
      .eq('display_config->>display_this_post', 'true')
      .or(`organization_config->>doc_set.eq.${slug},and(slug.eq.${slug},display_config->>type.eq.doc_set)`)
      .order('organization_config->>doc_set_order', { ascending: true });

    if (error) {
      console.error('Error fetching document set:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!posts || posts.length === 0) {
      console.log('[API] No posts found for document set:', { slug, organizationId });
      return NextResponse.json(
        { error: 'Document set not found' },
        { status: 404 }
      );
    }

    console.log('[API] Found posts:', posts.length);

    // Get is_numbered from the first post (or the type=doc_set post if it exists)
    const mainPost = posts.find((p: any) => p.display_config?.type === 'doc_set' && p.slug === slug);
    const isNumbered = (mainPost?.display_config?.is_numbered ?? posts[0]?.display_config?.is_numbered) ?? false;

    // Extract TOC from each post's content
    const postsWithTOC: PostInSet[] = posts.map((post: any) => {
      let toc: TOCItem[] = [];
      
      if (post.content) {
        try {
          // Parse HTML using regex (works in all environments)
          console.log('[API] Parsing TOC for post:', post.slug);
          toc = extractTOCFromHTML(post.content);
          console.log('[API] Found headings:', toc.length);
        } catch (error) {
          console.error('[API] Error parsing HTML for TOC:', post.slug, error);
        }
      }

      return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        description: post.description || '',
        order: post.organization_config?.doc_set_order || 0,
        toc
      };
    });

    // Get the set title: use the type=doc_set post's title if found, otherwise fall back
    const setTitle = mainPost?.title || posts[0]?.organization_config?.doc_set_title || slug;

    console.log('[API] Returning document set:', { 
      set: slug, 
      title: setTitle, 
      is_numbered: isNumbered, 
      articlesCount: postsWithTOC.length 
    });

    return NextResponse.json({
      set: slug,
      title: setTitle,
      is_numbered: isNumbered,
      articles: postsWithTOC
    });
  } catch (error: any) {
    console.error('[API] Document set detail API error:', error);
    console.error('[API] Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
