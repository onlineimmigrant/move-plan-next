// /app/api/brands/route.ts
import { NextResponse } from 'next/server';
import { supabase, getOrganizationId } from '@/lib/supabase';

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const organizationId = await getOrganizationId(baseUrl);
    if (!organizationId) {
      console.error('Organization not found');
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('website_brand')
      .select('*')
      .eq('is_active', true)
      .or(`organization_id.eq.${organizationId},organization_id.is.null`);

    if (error) {
      console.error('Error fetching brands data:', error);
      return NextResponse.json({ error: 'Failed to fetch brands data', details: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching brands data:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}