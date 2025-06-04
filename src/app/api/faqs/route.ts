// /app/api/faqs/route.ts
import { NextResponse } from 'next/server';
import { supabase, getOrganizationId } from '@/lib/supabase';
import { getBaseUrl } from '@/lib/utils';
import { FAQ } from '@/types/faq';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id'); // Changed to snake_case

    if (!organizationId) {
      console.error('Missing organization_id in query params');
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 });
    }

    // Resolve organizationId using getBaseUrl
    let baseUrl = getBaseUrl(true);
    console.log('API /faqs baseUrl:', baseUrl, 'organization_id from query:', organizationId);

    let resolvedOrganizationId: string | null = null;
    try {
      resolvedOrganizationId = await getOrganizationId(baseUrl);
      if (!resolvedOrganizationId) {
        throw new Error('Organization not found');
      }
      console.log('Resolved organizationId:', resolvedOrganizationId);
    } catch (err) {
      console.error('Error resolving organizationId with initial baseUrl:', err);
      // Fallback to NEXT_PUBLIC_BASE_URL
      baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      console.log('Falling back to baseUrl:', baseUrl);
      try {
        resolvedOrganizationId = await getOrganizationId(baseUrl);
        if (!resolvedOrganizationId) {
          throw new Error('Organization not found after fallback');
        }
        console.log('Resolved organizationId after fallback:', resolvedOrganizationId);
      } catch (fallbackErr) {
        console.error('Error resolving organizationId after fallback:', fallbackErr);
        return NextResponse.json({ error: 'Failed to resolve organization' }, { status: 500 });
      }
    }

    // Validate that the provided organizationId matches the resolved one
    if (resolvedOrganizationId !== organizationId) {
      console.error('Mismatched organizationId:', organizationId, 'resolved:', resolvedOrganizationId);
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('faq')
      .select('id, order, display_order, question, answer, section, organization_id, product_sub_type_id, display_home_page')
      .eq('display_home_page', true)
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
      .order('order', { ascending: true });

    if (error || !data) {
      console.error('Error fetching FAQs data:', error?.message || 'No FAQs found', 'organization_id:', organizationId, 'data:', data);
      return NextResponse.json(
        { error: 'Failed to fetch FAQs data', details: error?.message || 'No FAQs found' },
        { status: 500 }
      );
    }

    const faqsData: FAQ[] = data.map(item => ({
      ...item,
      organization_id: item.organization_id || null,
    }));

    console.log('API /faqs fetched FAQs:', faqsData);

    return NextResponse.json(faqsData, {
      status: 200,
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
    });
  } catch (error) {
    console.error('Unexpected error in faqs API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}