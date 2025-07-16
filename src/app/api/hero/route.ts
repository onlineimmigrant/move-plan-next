// /app/api/hero/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { HeroData } from '@/types/hero_data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('website_hero')
      .select('*')
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
      .single();

    if (error || !data) {
      console.error('Error fetching hero data:', error || 'No hero data found', 'organization_id:', organizationId);
      return NextResponse.json(
        { error: 'Failed to fetch hero data', details: error?.message || 'No data found' },
        { status: 500 }
      );
    }

    

    const heroData: HeroData = {
      ...data,
      organization_id: data.organization_id || null,
    };

    return NextResponse.json(heroData, {
      status: 200,
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
    });
  } catch (error) {
    console.error('Error in hero API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}