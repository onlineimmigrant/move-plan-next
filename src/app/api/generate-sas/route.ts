import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient, BlobSASPermissions } from '@azure/storage-blob'; // Import BlobSASPermissions
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING!;

export async function POST(req: NextRequest) {
  try {
    const { filePath, lessonId } = await req.json();
    console.log('Received SAS request:', { filePath, lessonId });

    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return NextResponse.json({ error: 'Unauthorized: No auth header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token received:', token.slice(0, 10) + '...');

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.error('Supabase auth error:', error?.message || 'No user found');
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
      console.error('Lesson fetch error:', lessonError?.message);
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }
    console.log('Lesson topic ID:', lessonData.topic_id);

    // Generate the SAS URL
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient('course-materials');
    const blobClient = containerClient.getBlobClient(filePath);

    const sasToken = await blobClient.generateSasUrl({
      startsOn: new Date(),
      expiresOn: new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hour expiry
      permissions: BlobSASPermissions.parse('r'), // Use BlobSASPermissions.parse for read permission
    });

    console.log('Generated SAS URL:', sasToken);
    return NextResponse.json({ sasUrl: sasToken });
  } catch (error) {
    console.error('Error generating SAS token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}