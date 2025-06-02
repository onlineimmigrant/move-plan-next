// /app/api/faqs/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { FAQ } from '@/types/faq';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('faq')
      .select('*')
      .eq('display_home_page', true)
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching FAQs data:', error, 'organization_id:', organizationId);
      return NextResponse.json(
        { error: 'Failed to fetch FAQs data', details: error.message },
        { status: 500 }
      );
    }

    const faqsData: FAQ[] = (data || []).map(item => ({
      ...item,
      organization_id: item.organization_id || null,
    }));

    return NextResponse.json(faqsData, {
      status: 200,
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
    });
  } catch (error) {
    console.error('Error in faqs API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}