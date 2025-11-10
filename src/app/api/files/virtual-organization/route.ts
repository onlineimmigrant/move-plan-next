import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get virtual folder organization for current user's shared files
export async function GET(request: NextRequest) {
  try {
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

    // Fetch virtual organization for this user
    const { data: organizations, error: orgError } = await supabase
      .from('shared_file_organization')
      .select('*')
      .eq('user_id', user.id);

    if (orgError) {
      console.error('Error fetching virtual organization:', orgError);
      return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 });
    }

    // Get unique virtual folders
    const virtualFolders = Array.from(
      new Set(
        (organizations || [])
          .map(org => org.virtual_folder)
          .filter(folder => folder !== null)
      )
    );

    return NextResponse.json({ 
      organizations: organizations || [],
      virtualFolders 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// POST - Update virtual folder organization for a shared file
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { file_share_id, virtual_folder } = body;

    // Validate required fields
    if (!file_share_id) {
      return NextResponse.json({ 
        error: 'Missing required field: file_share_id' 
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

    // Check if file share exists and user has access to it
    const { data: fileShare, error: shareError } = await supabase
      .from('file_shares')
      .select('*')
      .eq('id', file_share_id)
      .eq('shared_with_user_id', user.id)
      .eq('is_active', true)
      .single();

    if (shareError || !fileShare) {
      return NextResponse.json({ error: 'File share not found or access denied' }, { status: 404 });
    }

    // Check if organization entry already exists
    const { data: existingOrg } = await supabase
      .from('shared_file_organization')
      .select('*')
      .eq('user_id', user.id)
      .eq('file_share_id', file_share_id)
      .single();

    if (existingOrg) {
      // Update existing organization
      const { data: updatedOrg, error: updateError } = await supabase
        .from('shared_file_organization')
        .update({ virtual_folder: virtual_folder || null })
        .eq('id', existingOrg.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating organization:', updateError);
        return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
      }

      return NextResponse.json({ organization: updatedOrg }, { status: 200 });
    } else {
      // Create new organization entry
      const { data: newOrg, error: insertError } = await supabase
        .from('shared_file_organization')
        .insert({
          user_id: user.id,
          file_share_id,
          virtual_folder: virtual_folder || null
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating organization:', insertError);
        return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
      }

      return NextResponse.json({ organization: newOrg }, { status: 201 });
    }
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove virtual folder organization (reset to root)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const file_share_id = searchParams.get('file_share_id');

    if (!file_share_id) {
      return NextResponse.json({ error: 'Missing file_share_id' }, { status: 400 });
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

    // Delete organization entry (sets file back to root)
    const { error: deleteError } = await supabase
      .from('shared_file_organization')
      .delete()
      .eq('user_id', user.id)
      .eq('file_share_id', file_share_id);

    if (deleteError) {
      console.error('Error deleting organization:', deleteError);
      return NextResponse.json({ error: 'Failed to delete organization' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Organization removed' }, { status: 200 });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
