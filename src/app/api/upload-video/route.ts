import { NextRequest, NextResponse } from 'next/server';
import { uploadVideoToR2 } from '@/lib/r2';
import { nanoid } from 'nanoid';
import { createClient } from '@supabase/supabase-js';
import { getOrganizationId } from '@/lib/getSettings';

export const runtime = 'nodejs'; // Use Node.js runtime for file handling

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
  console.log('[upload-video] POST request received');
  try {
    console.log('[upload-video] Request received');
    
    // Get auth token from request
    const authHeader = request.headers.get('authorization');
    console.log('[upload-video] Auth header present:', !!authHeader);
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    console.log('[upload-video] User lookup:', { userId: user?.id, authError: authError?.message });

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get organization from base_url
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const organizationId = await getOrganizationId(baseUrl);
    
    if (!organizationId) {
      console.error('[upload-video] Failed to determine organization from base_url:', baseUrl);
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 403 }
      );
    }

    // Get user's role from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('Profile lookup:', { userId: user.id, profile, profileError, organizationId });

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json(
        { error: `Profile lookup failed: ${profileError.message}` },
        { status: 500 }
      );
    }

    // Check if user is admin
    if (profile.role !== 'admin' && profile.role !== 'owner') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'uncategorized';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only MP4, WebM, MOV, and AVI are supported.' },
        { status: 400 }
      );
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 500MB.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${nanoid()}.${fileExtension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2 with organization isolation and folder
    const videoUrl = await uploadVideoToR2(
      buffer, 
      fileName, 
      file.type,
      organizationId,
      folder
    );

    return NextResponse.json({
      success: true,
      videoUrl,
      fileName: file.name,
      size: file.size,
      organizationId,
      folder,
    });
  } catch (error) {
    console.error('[upload-video] ERROR:', error);
    console.error('[upload-video] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        error: 'Failed to upload video',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
