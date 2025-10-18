import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadPath = formData.get('path') as string || 'avatars'; // Default to avatars folder

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type - only common image formats for avatars
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP` },
        { status: 400 }
      );
    }

    // Validate file size for avatars (stricter limit: 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          error: 'File too large for avatar. Maximum size is 2MB',
          maxSize: '2MB',
          actualSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`
        },
        { status: 400 }
      );
    }

    // Generate unique filename for avatar
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 7);
    const fileExt = file.name.split('.').pop();
    const baseName = file.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9]/g, '-');
    const fileName = `avatar-${baseName}-${timestamp}-${random}.${fileExt}`;
    
    // Construct full path with optional subdirectory
    const fullPath = uploadPath ? `${uploadPath}/${fileName}` : fileName;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase storage (gallery bucket)
    const { data, error } = await supabaseAdmin.storage
      .from('gallery')
      .upload(fullPath, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Avatar upload error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Generate public URL
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/gallery/${fullPath}`;

    return NextResponse.json({
      success: true,
      fileName: fullPath,
      url: publicUrl,
      data: data,
      type: 'avatar'
    });

  } catch (error) {
    console.error('Avatar upload API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Avatar upload failed' },
      { status: 500 }
    );
  }
}
