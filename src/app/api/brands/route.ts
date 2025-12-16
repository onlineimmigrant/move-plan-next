// /app/api/brands/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { Brand } from '@/types/brand';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationIdParam = searchParams.get('organizationId');
    const organizationId =
      !organizationIdParam || organizationIdParam === 'undefined' || organizationIdParam === 'null'
        ? null
        : organizationIdParam;

    let query = supabase
      .from('website_brand')
      .select(`
        id,
        web_storage_address,
        name,
        organization_id
      `)
      .eq('is_active', true);

    // If organizationId isn't provided (e.g. global layout prefetch), return only global brands.
    // If it is provided, return both org-specific and global brands.
    query = organizationId
      ? query.or(`organization_id.eq.${organizationId},organization_id.is.null`)
      : query.is('organization_id', null);

    const { data, error } = await query;

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