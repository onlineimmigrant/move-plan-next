import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const { accountId } = await request.json();
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: targetProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, organization_id')
      .eq('id', accountId)
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const isPrivileged = targetProfile.role === 'admin' || targetProfile.role === 'superadmin';
    if (!isPrivileged || !targetProfile.organization_id) {
      return NextResponse.json({ isLastAdmin: false }, { status: 200 });
    }

    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select('id')
      .eq('organization_id', targetProfile.organization_id)
      .in('role', ['admin', 'superadmin']);

    if (adminsError) {
      return NextResponse.json({ error: 'Failed to check admin status' }, { status: 500 });
    }

    const others = (admins || []).filter(a => a.id !== accountId);
    const isLastAdmin = others.length === 0;
    return NextResponse.json({ isLastAdmin }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
