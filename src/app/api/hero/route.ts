// /app/api/hero/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || searchParams.get('tenantId');

    if (!organizationId) {
      console.error('No organizationId or tenantId provided in query parameters');
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    console.log('Fetching hero data for organization_id:', organizationId);

    const { data, error } = await supabase
      .from('website_hero')
      .select('*')
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
      .single();

    if (error) {
      console.error('Error fetching hero data:', error);
      return NextResponse.json({ error: 'Failed to fetch hero data', details: error.message }, { status: 500 });
    }

    if (!data) {
      console.log('No hero data found for organization_id:', organizationId);
      return NextResponse.json({ error: 'No hero data found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching hero data:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}