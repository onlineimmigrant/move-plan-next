// API endpoint to get all posts in a specific document set
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { JSDOM } from 'jsdom';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
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
      return NextResponse.json(
        { error: 'Document set not found' },
        { status: 404 }
      );
    }

    // Get is_numbered from the first post (or the type=doc_set post if it exists)
    const mainPost = posts.find((p: any) => p.display_config?.type === 'doc_set' && p.slug === slug);
    const isNumbered = (mainPost?.display_config?.is_numbered ?? posts[0]?.display_config?.is_numbered) ?? false;

    // Extract TOC from each post's content
    const postsWithTOC: PostInSet[] = posts.map((post: any) => {
      const toc: TOCItem[] = [];
      
      if (post.content) {
        try {
          // Parse HTML using jsdom for server-side parsing
          const dom = new JSDOM(post.content);
          const doc = dom.window.document;
          const headings = doc.querySelectorAll('h2, h3, h4');
          
          headings.forEach((heading, index) => {
            const level = parseInt(heading.tagName.substring(1));
            const text = heading.textContent || '';
            // Always use the actual ID from the heading element, or generate a fallback
            const id = heading.id || `${heading.tagName.toLowerCase()}-${index + 1}`;
            
            toc.push({ level, text, id });
          });
        } catch (error) {
          console.error('Error parsing HTML for TOC:', error);
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

    return NextResponse.json({
      set: slug,
      title: setTitle,
      is_numbered: isNumbered,
      articles: postsWithTOC
    });
  } catch (error: any) {
    console.error('Document set detail API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
