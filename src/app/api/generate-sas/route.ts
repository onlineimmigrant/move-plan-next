import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { filePath, lessonId } = await req.json();
    if (!filePath || !lessonId) {
      console.error('Missing required parameters:', { filePath, lessonId });
      return NextResponse.json({ error: 'Missing filePath or lessonId' }, { status: 400 });
    }
    console.log('Received signed URL request:', { filePath, lessonId });

    // Clean file path (remove leading/trailing slashes, normalize spaces)
    const cleanedFilePath = filePath.trim().replace(/^\/+|\/+$/g, '');
    console.log('Cleaned file path:', cleanedFilePath);

    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return NextResponse.json({ error: 'Unauthorized: No auth header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token received:', token.slice(0, 10) + '...');

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('Supabase auth error:', authError?.message || 'No user found');
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    console.log('Authenticated user:', user.id);

    // Verify the lesson exists
    const { data: lessonData, error: lessonError } = await supabase
      .from('edu_pro_lesson')
      .select('topic_id')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lessonData) {
      console.error('Lesson fetch error:', lessonError?.message || 'Lesson not found');
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }
    console.log('Lesson topic ID:', lessonData.topic_id);

    // Verify file exists in storage
    let fileExists = false;
    let finalFilePath = cleanedFilePath;

    // First, try exact match
    const { data: fileData, error: fileError } = await supabase.storage
      .from('sqe1-lessons') // Updated bucket name
      .list('', { search: cleanedFilePath });

    if (fileError) {
      console.error('File list error:', fileError.message);
      return NextResponse.json({ error: `Failed to list files: ${fileError.message}` }, { status: 500 });
    }

    fileExists = fileData?.some(file => file.name === cleanedFilePath);
    console.log('Exact match check:', { fileExists, filesFound: fileData?.map(f => f.name) });

    // If not found, try case-insensitive match and check subfolders
    if (!fileExists) {
      const { data: allFiles, error: allFilesError } = await supabase.storage
        .from('sqe1-lessons') // Updated bucket name
        .list('', {}); // Deep list to include subfolders

      if (allFilesError) {
        console.error('All files list error:', allFilesError.message);
        return NextResponse.json({ error: `Failed to list all files: ${allFilesError.message}` }, { status: 500 });
      }

      const lowerCasePath = cleanedFilePath.toLowerCase();
      const matchingFile = allFiles?.find(file => file.name.toLowerCase() === lowerCasePath);
      if (matchingFile) {
        fileExists = true;
        finalFilePath = matchingFile.name;
        console.log('Found case-insensitive match:', finalFilePath);
      } else {
        console.error('No matching file found in bucket. Available files:', allFiles?.map(f => f.name));
        return NextResponse.json({ error: `File not found: ${cleanedFilePath}` }, { status: 404 });
      }
    }

    // Generate signed URL
    const { data: signedUrlData, error: storageError } = await supabase.storage
      .from('sqe1-lessons') // Updated bucket name
      .createSignedUrl(finalFilePath, 3600, { download: true });

    if (storageError || !signedUrlData?.signedUrl) {
      console.error('Signed URL error:', storageError?.message);
      return NextResponse.json({ error: `Failed to generate signed URL: ${storageError?.message || 'Unknown error'}` }, { status: 500 });
    }

    console.log('Generated signed URL:', signedUrlData.signedUrl);
    return NextResponse.json({ sasUrl: signedUrlData.signedUrl });
  } catch (error: any) {
    console.error('Error generating signed URL:', error.message, error.stack);
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}