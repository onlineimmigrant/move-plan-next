import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role for storage operations
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

// Storage quota: 50MB per user
const MAX_USER_QUOTA = 50 * 1024 * 1024; // 50MB in bytes
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const chatSessionId = formData.get('chatSessionId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        maxSize: MAX_FILE_SIZE
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'text/plain',
      'text/markdown',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: `Invalid file type: ${file.type}. Allowed: PDF, DOCX, TXT, MD, Images` 
      }, { status: 400 });
    }

    // Check user's current storage usage
    const { data: quotaData } = await supabaseAdmin
      .from('user_storage_quota')
      .select('current_usage, max_quota')
      .eq('user_id', user.id)
      .single();

    const currentUsage = quotaData?.current_usage || 0;
    const maxQuota = quotaData?.max_quota || MAX_USER_QUOTA;

    // Check if adding this file would exceed quota
    if (currentUsage + file.size > maxQuota) {
      // Delete oldest files to make space
      const spaceNeeded = (currentUsage + file.size) - maxQuota;
      
      const { data: oldFiles } = await supabaseAdmin
        .from('chat_files')
        .select('id, file_path, file_size')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      let spaceFreed = 0;
      const filesToDelete = [];

      for (const oldFile of oldFiles || []) {
        if (spaceFreed >= spaceNeeded) break;
        filesToDelete.push(oldFile);
        spaceFreed += oldFile.file_size;
      }

      // Delete old files
      for (const oldFile of filesToDelete) {
        // Delete from storage
        await supabaseAdmin.storage
          .from('chat-files')
          .remove([oldFile.file_path]);

        // Delete from database
        await supabaseAdmin
          .from('chat_files')
          .delete()
          .eq('id', oldFile.id);
      }
    }

    // Generate unique file path
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 7);
    const fileExt = file.name.split('.').pop();
    const sanitizedName = file.name
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .substring(0, 50);
    
    const fileName = `${user.id}/${chatSessionId || 'general'}/${sanitizedName}-${timestamp}-${random}.${fileExt}`;

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('chat-files')
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to upload file',
        details: uploadError.message 
      }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('chat-files')
      .getPublicUrl(fileName);

    // Save file metadata to database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const { data: fileRecord, error: dbError } = await supabaseAdmin
      .from('chat_files')
      .insert({
        user_id: user.id,
        chat_session_id: chatSessionId || null,
        file_name: file.name,
        file_path: fileName,
        file_size: file.size,
        mime_type: file.type,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Cleanup storage if database insert failed
      await supabaseAdmin.storage
        .from('chat-files')
        .remove([fileName]);

      return NextResponse.json({ 
        error: 'Failed to save file metadata',
        details: dbError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord.id,
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
        path: fileName,
        expiresAt: expiresAt.toISOString()
      }
    });

  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload file',
      details: error.message 
    }, { status: 500 });
  }
}

// GET endpoint to list user's files for a chat session
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get chat session ID from query params
    const { searchParams } = new URL(request.url);
    const chatSessionId = searchParams.get('chatSessionId');

    // Get user's files
    let query = supabaseAdmin
      .from('chat_files')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (chatSessionId) {
      query = query.eq('chat_session_id', chatSessionId);
    }

    const { data: files, error: filesError } = await query;

    if (filesError) {
      return NextResponse.json({ 
        error: 'Failed to fetch files',
        details: filesError.message 
      }, { status: 500 });
    }

    // Get storage quota
    const { data: quotaData } = await supabaseAdmin
      .from('user_storage_quota')
      .select('current_usage, max_quota')
      .eq('user_id', user.id)
      .single();

    // Get public URLs for files
    const filesWithUrls = files?.map(file => ({
      ...file,
      url: supabaseAdmin.storage
        .from('chat-files')
        .getPublicUrl(file.file_path).data.publicUrl
    }));

    return NextResponse.json({
      files: filesWithUrls || [],
      quota: {
        used: quotaData?.current_usage || 0,
        max: quotaData?.max_quota || MAX_USER_QUOTA,
        percentage: Math.round(((quotaData?.current_usage || 0) / (quotaData?.max_quota || MAX_USER_QUOTA)) * 100)
      }
    });

  } catch (error: any) {
    console.error('Get files error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch files',
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE endpoint to remove a file
export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileId } = await request.json();
    if (!fileId) {
      return NextResponse.json({ error: 'File ID required' }, { status: 400 });
    }

    // Get file record
    const { data: file, error: fetchError } = await supabaseAdmin
      .from('chat_files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('chat-files')
      .remove([file.file_path]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
    }

    // Delete from database (trigger will update quota)
    const { error: dbError } = await supabaseAdmin
      .from('chat_files')
      .delete()
      .eq('id', fileId);

    if (dbError) {
      return NextResponse.json({ 
        error: 'Failed to delete file',
        details: dbError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Delete file error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete file',
      details: error.message 
    }, { status: 500 });
  }
}
