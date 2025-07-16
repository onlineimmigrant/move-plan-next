import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');
  const offset = parseInt(searchParams.get('offset') || '0');
  const limit = parseInt(searchParams.get('limit') || '20');

  if (!organizationId) {
    return NextResponse.json(
      { error: 'Organization ID is required' },
      { status: 400 }
    );
  }

  try {
    const { data, error, count } = await supabase
      .from('faq')
      .select('id, order, display_order, question, answer, section, organization_id, product_sub_type_id', { count: 'exact' })
      .eq('organization_id', organizationId)
      .order('order', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching FAQs:', error.message);
      return NextResponse.json(
        { error: 'Failed to load FAQs' },
        { status: 500 }
      );
    }

    const totalCount = count || 0;
    const hasMore = offset + limit < totalCount;

    return NextResponse.json({
      data: data || [],
      hasMore,
      total: totalCount
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
