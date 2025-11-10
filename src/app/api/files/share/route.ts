import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List file shares (files shared by current user or shared with current user)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view'); // 'shared-by-me' | 'shared-with-me' | 'all' (admin only)
    
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to check role and organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    let query = supabase
      .from('file_shares')
      .select('*')
      .eq('is_active', true);

    // Filter based on view type and user role
    if (view === 'shared-by-me') {
      query = query.eq('shared_by_user_id', user.id);
    } else if (view === 'shared-with-me') {
      query = query.eq('shared_with_user_id', user.id);
    } else if (view === 'all') {
      // Only admins/superadmins can view all shares
      if (profile.role === 'superadmin') {
        // Superadmin sees all shares
      } else if (profile.role === 'admin' && profile.organization_id) {
        // Admin sees shares within their organization
        query = query.eq('organization_id', profile.organization_id);
      } else {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    } else {
      // Default: show both shared by me and shared with me
      query = query.or(`shared_by_user_id.eq.${user.id},shared_with_user_id.eq.${user.id}`);
    }

    const { data: shares, error: sharesError } = await query
      .order('created_at', { ascending: false });

    if (sharesError) {
      console.error('Error fetching shares:', sharesError);
      return NextResponse.json({ error: 'Failed to fetch shares' }, { status: 500 });
    }

    // Enrich shares with user information
    const enrichedShares = await Promise.all(
      (shares || []).map(async (share) => {
        // Fetch shared_by user info
        const { data: sharedByProfile } = await supabase
          .from('profiles')
          .select('id, email, full_name, organization_id')
          .eq('id', share.shared_by_user_id)
          .single();

        // Fetch shared_with user info
        const { data: sharedWithProfile } = await supabase
          .from('profiles')
          .select('id, email, full_name, organization_id')
          .eq('id', share.shared_with_user_id)
          .single();

        return {
          ...share,
          shared_by: sharedByProfile,
          shared_with: sharedWithProfile
        };
      })
    );

    return NextResponse.json({ shares: enrichedShares }, { status: 200 });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new file share
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { file_path, file_name, is_folder, shared_with_user_id, permission_type, expires_at } = body;

    // Validate required fields
    if (!file_path || !file_name || !shared_with_user_id || !permission_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: file_path, file_name, shared_with_user_id, permission_type' 
      }, { status: 400 });
    }

    if (!['view', 'edit'].includes(permission_type)) {
      return NextResponse.json({ 
        error: 'Invalid permission_type. Must be "view" or "edit"' 
      }, { status: 400 });
    }

    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to check role and organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get the recipient's profile to check organization
    const { data: recipientProfile, error: recipientError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', shared_with_user_id)
      .single();

    if (recipientError || !recipientProfile) {
      return NextResponse.json({ error: 'Recipient user not found' }, { status: 404 });
    }

    // Check permissions based on role
    let organization_id = profile.organization_id;

    if (profile.role === 'admin') {
      // Admins can only share with users in their organization
      if (recipientProfile.organization_id !== profile.organization_id) {
        return NextResponse.json({ 
          error: 'Admins can only share files with users in their organization' 
        }, { status: 403 });
      }
    } else if (profile.role === 'superadmin') {
      // Superadmins can share with anyone, use recipient's org
      organization_id = recipientProfile.organization_id;
    } else {
      // Regular users can share their own files
      // Verify the file belongs to the user (check if file_path starts with user ID)
      if (!file_path.startsWith(`${user.id}/`)) {
        return NextResponse.json({ 
          error: 'You can only share your own files' 
        }, { status: 403 });
      }
    }

    // Check if an inactive share already exists
    const { data: existingShare, error: existingError } = await supabase
      .from('file_shares')
      .select('*')
      .eq('file_path', file_path)
      .eq('shared_by_user_id', user.id)
      .eq('shared_with_user_id', shared_with_user_id)
      .single();

    let share;
    let shareError;

    if (existingShare && !existingShare.is_active) {
      // Reactivate the existing share
      const { data: reactivatedShare, error: reactivateError } = await supabase
        .from('file_shares')
        .update({
          permission_type,
          expires_at: expires_at || null,
          is_active: true,
          created_at: new Date().toISOString() // Update created_at to current time
        })
        .eq('id', existingShare.id)
        .select()
        .single();

      share = reactivatedShare;
      shareError = reactivateError;
    } else if (existingShare && existingShare.is_active) {
      // Share is already active
      return NextResponse.json({ 
        error: 'This file is already shared with this user' 
      }, { status: 409 });
    } else {
      // Create new share
      const { data: newShare, error: createError } = await supabase
        .from('file_shares')
        .insert({
          file_path,
          file_name,
          is_folder: is_folder || false,
          shared_by_user_id: user.id,
          shared_with_user_id,
          organization_id,
          permission_type,
          expires_at: expires_at || null,
          is_active: true
        })
        .select()
        .single();

      share = newShare;
      shareError = createError;
    }

    if (shareError) {
      console.error('Error creating share:', shareError);
      return NextResponse.json({ error: 'Failed to create share' }, { status: 500 });
    }

    return NextResponse.json({ share }, { status: 201 });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Revoke a file share
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('id');

    if (!shareId) {
      return NextResponse.json({ error: 'Share ID is required' }, { status: 400 });
    }

    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get the share to verify ownership/permissions
    const { data: share, error: shareError } = await supabase
      .from('file_shares')
      .select('*')
      .eq('id', shareId)
      .single();

    if (shareError || !share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    // Check if user can delete this share
    const canDelete = 
      share.shared_by_user_id === user.id || // Owner of the share
      (profile.role === 'superadmin') || // Superadmins can delete any share
      (profile.role === 'admin' && share.organization_id === profile.organization_id); // Admins within org

    if (!canDelete) {
      return NextResponse.json({ error: 'Insufficient permissions to revoke this share' }, { status: 403 });
    }

    // Soft delete by setting is_active to false
    const { error: deleteError } = await supabase
      .from('file_shares')
      .update({ is_active: false })
      .eq('id', shareId);

    if (deleteError) {
      console.error('Error revoking share:', deleteError);
      return NextResponse.json({ error: 'Failed to revoke share' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Share revoked successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
