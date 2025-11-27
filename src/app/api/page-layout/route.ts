import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/page-layout?organization_id=xxx
 * Fetch all page sections (hero, template sections, heading sections) with their order
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organization_id = searchParams.get('organization_id');

    if (!organization_id) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }

    console.log('[API Page Layout] Fetching page layout for organization:', organization_id);

    // Fetch hero section
    const { data: hero, error: heroError } = await supabase
      .from('website_hero')
      .select('*')
      .eq('organization_id', organization_id)
      .maybeSingle();

    if (heroError) {
      console.error('[API Page Layout] Error fetching hero:', heroError);
      throw heroError;
    }

    // Fetch template sections
    const { data: templateSections, error: templateError } = await supabase
      .from('website_templatesection')
      .select('*')
      .eq('organization_id', organization_id)
      .order('order', { ascending: true });

    if (templateError) {
      console.error('[API Page Layout] Error fetching template sections:', templateError);
      throw templateError;
    }

    // Fetch heading sections
    const { data: headingSections, error: headingError } = await supabase
      .from('website_templatesectionheading')
      .select('*')
      .eq('organization_id', organization_id)
      .order('order', { ascending: true });

    if (headingError) {
      console.error('[API Page Layout] Error fetching heading sections:', headingError);
      throw headingError;
    }

    // Transform all sections into a unified format
    const sections = [];

    // Add hero section (always first)
    if (hero) {
      sections.push({
        id: hero.id,
        type: 'hero',
        title: 'Hero Section',
        order: hero.display_order || 0,
        page: hero.url_page || 'home',
        data: hero
      });
    }

    // Add template sections
    if (templateSections) {
      templateSections.forEach(section => {
        // Determine title based on section_type or heading
        let title = 'Template Section';
        if (section.section_type) {
          const typeLabels: Record<string, string> = {
            general: 'General Section',
            brand: 'Brands Section',
            article_slider: 'Article Slider',
            contact: 'Contact Section',
            faq: 'FAQ Section',
            reviews: 'Reviews Section',
            help_center: 'Help Center',
            real_estate: 'Real Estate',
            pricing_plans: 'Pricing Plans'
          };
          title = typeLabels[section.section_type] || section.section_type;
        } else if (section.heading) {
          title = section.heading;
        } else if (section.template) {
          title = section.template;
        }

        sections.push({
          id: section.id,
          type: 'template_section',
          title: title,
          order: section.order || 0,
          page: section.url_page || 'home',
          data: section
        });
      });
    }

    // Add heading sections
    if (headingSections) {
      headingSections.forEach(section => {
        // Extract title from new JSONB structure or fallback to old field
        let title = 'Heading Section';
        if (section.content?.title) {
          title = section.content.title;
        } else if (section.heading) {
          title = section.heading;
        }
        
        sections.push({
          id: section.id,
          type: 'heading_section',
          title: title,
          order: section.order || 0,
          page: section.url_page || 'home',
          data: section
        });
      });
    }

    // Sort all sections by order
    sections.sort((a, b) => a.order - b.order);

    console.log('[API Page Layout] Successfully fetched page layout:', {
      total_sections: sections.length,
      hero: !!hero,
      template_sections: templateSections?.length || 0,
      heading_sections: headingSections?.length || 0
    });

    return NextResponse.json({ sections });
  } catch (error) {
    console.error('[API Page Layout] Failed to fetch page layout:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page layout' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/page-layout
 * Update the order of all page sections
 * 
 * Body: {
 *   organization_id: string,
 *   sections: Array<{
 *     id: string,
 *     type: 'hero' | 'template_section' | 'heading_section',
 *     order: number
 *   }>
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { organization_id, sections } = body;

    if (!organization_id || !sections || !Array.isArray(sections)) {
      return NextResponse.json(
        { error: 'organization_id and sections array are required' },
        { status: 400 }
      );
    }

    console.log('[API Page Layout] Updating page layout for organization:', organization_id);
    console.log('[API Page Layout] Updating', sections.length, 'sections');

    // Group sections by type
    const heroSections = sections.filter(s => s.type === 'hero');
    const templateSections = sections.filter(s => s.type === 'template_section');
    const headingSections = sections.filter(s => s.type === 'heading_section');

    // Update hero section
    if (heroSections.length > 0) {
      for (const section of heroSections) {
        const { error } = await supabase
          .from('website_hero')
          .update({
            display_order: section.order,
            updated_at: new Date().toISOString()
          })
          .eq('id', section.id);

        if (error) {
          console.error('[API Page Layout] Error updating hero:', error);
          throw error;
        }
      }
    }

    // Update template sections
    if (templateSections.length > 0) {
      for (const section of templateSections) {
        const { error } = await supabase
          .from('website_templatesection')
          .update({
            order: section.order,
            updated_at: new Date().toISOString()
          })
          .eq('id', section.id);

        if (error) {
          console.error('[API Page Layout] Error updating template section:', error);
          throw error;
        }
      }
    }

    // Update heading sections
    if (headingSections.length > 0) {
      for (const section of headingSections) {
        const { error } = await supabase
          .from('website_templatesectionheading')
          .update({
            order: section.order,
            updated_at: new Date().toISOString()
          })
          .eq('id', section.id);

        if (error) {
          console.error('[API Page Layout] Error updating heading section:', error);
          throw error;
        }
      }
    }

    console.log('[API Page Layout] Successfully updated page layout');

    return NextResponse.json({
      success: true,
      updated: {
        hero: heroSections.length,
        template_sections: templateSections.length,
        heading_sections: headingSections.length
      }
    });
  } catch (error) {
    console.error('[API Page Layout] Failed to update page layout:', error);
    return NextResponse.json(
      { error: 'Failed to update page layout' },
      { status: 500 }
    );
  }
}
