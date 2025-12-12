import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const { accountId } = await request.json();

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Fetch target user's profile to determine org and role
    const { data: targetProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, organization_id')
      .eq('id', accountId)
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // If deleting an admin/superadmin, ensure at least one other admin remains in the organization
    const isPrivileged = targetProfile.role === 'admin' || targetProfile.role === 'superadmin';
    if (isPrivileged && targetProfile.organization_id) {
      const { data: admins, error: adminsError } = await supabase
        .from('profiles')
        .select('id')
        .eq('organization_id', targetProfile.organization_id)
        .in('role', ['admin', 'superadmin']);

      if (adminsError) {
        return NextResponse.json(
          { error: 'Failed to validate admin count' },
          { status: 500 }
        );
      }

      const others = (admins || []).filter(a => a.id !== accountId);
      if (others.length === 0) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin/superadmin in this organization.' },
          { status: 409 }
        );
      }
    }

    // Delete auth user (cascades to profile if FK is set)
    const { error: authError } = await supabase.auth.admin.deleteUser(accountId);
    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      );
    }

    // Also ensure profile row is deleted in case cascade is not configured
    await supabase.from('profiles').delete().eq('id', accountId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete account' },
      { status: 500 }
    );
  }
}
