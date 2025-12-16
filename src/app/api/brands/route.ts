// /app/api/brands/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { Brand } from '@/types/brand';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('website_brand')
      .select(`
        id,
        web_storage_address,
        name,
        organization_id
      `)
      .eq('is_active', true)
      .or(`organization_id.eq.${organizationId},organization_id.is.null`);

    if (error) {
      console.error('Error fetching brands data:', error, 'organization_id:', organizationId);
      return NextResponse.json(
        { error: 'Failed to fetch brands data', details: error.message },
        { status: 500 }
      );
    }

    const brandsData: Brand[] = (data || []).map(item => ({
      ...item,
      organization_id: item.organization_id || null,
    }));

    return NextResponse.json(brandsData, {
      status: 200,
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
    });
  } catch (error) {
    console.error('Error in brands API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}