// src/app/api/features/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';
import { getOrganizationId } from '@/lib/supabase';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);

const hasEnvVars = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

const envErrorResponse = () => {
  console.error('Missing Supabase environment variables');
  return NextResponse.json(
    { error: 'Server configuration error: Missing Supabase credentials' },
    { status: 500 }
  );
};

export async function GET(request: NextRequest) {
  if (!hasEnvVars) return envErrorResponse();

  const { searchParams } = new URL(request.url);
  let organizationId = searchParams.get('organization_id');

  if (!organizationId) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    organizationId = await getOrganizationId(baseUrl);
    if (!organizationId) {
      console.error('Organization not found for baseUrl:', baseUrl);
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    console.log('Using fallback organization_id:', organizationId);
  }

  try {
    console.log('Fetching features for organization_id:', organizationId);
    const { data, error } = await supabase
      .from('feature')
      .select('*')
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch features', details: error.message },
        { status: 500 }
      );
    }

    console.log('Fetched features:', data);
    return NextResponse.json(data || [], { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/features:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}