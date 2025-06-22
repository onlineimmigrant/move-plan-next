// app/api/epub-proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import JSZip from 'jszip';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Map common EPUB file extensions to MIME types
const mimeTypes: { [key: string]: string } = {
  '.xml': 'application/xml',
  '.html': 'text/html',
  '.xhtml': 'application/xhtml+xml',
  '.css': 'text/css',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.opf': 'application/oebps-package+xml',
  '.ncx': 'application/x-dtbncx+xml',
  '.epub': 'application/epub+zip',
};

export async function GET(req: NextRequest) {
  try {
    const filePath = req.nextUrl.searchParams.get('filePath');
    const resourcePath = req.nextUrl.searchParams.get('resourcePath') || '';

    if (!filePath) {
      console.error('Missing filePath query parameter');
      return NextResponse.json({ error: 'Missing filePath' }, { status: 400 });
    }

    console.log('EPUB proxy request:', { filePath, resourcePath });

    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return NextResponse.json({ error: 'Unauthorized: No auth header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('Supabase auth error:', authError?.message || 'No user found');
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    console.log('Authenticated user:', user.id);

    // Clean file path
    const cleanedFilePath = filePath.trim().replace(/^\/+|\/+$/g, '');
    console.log('Cleaned file path:', cleanedFilePath);

    // Download the EPUB file
    const { data: epubData, error: downloadError } = await supabase.storage
      .from('sqe1-lessons')
      .download(cleanedFilePath);

    if (downloadError || !epubData) {
      console.error('Download error:', downloadError?.message);
      return NextResponse.json({ error: `Failed to download EPUB: ${downloadError?.message || 'No data'}` }, { status: 500 });
    }

    // Load EPUB as ZIP archive
    const arrayBuffer = await epubData.arrayBuffer();
    console.log('Downloaded EPUB size:', arrayBuffer.byteLength, 'bytes');

    if (arrayBuffer.byteLength === 0) {
      console.error('Downloaded EPUB is empty');
      return NextResponse.json({ error: 'Downloaded EPUB is empty' }, { status: 500 });
    }

    const zip = await JSZip.loadAsync(arrayBuffer);

    // If no resourcePath, return the full EPUB
    if (!resourcePath) {
      return new NextResponse(arrayBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/epub+zip',
          'Content-Disposition': 'inline',
          'Content-Length': arrayBuffer.byteLength.toString(),
        },
      });
    }

    // Fetch the requested resource from the ZIP
    const resourceFile = zip.file(resourcePath);
    if (!resourceFile) {
      console.error('Resource not found in EPUB:', resourcePath);
      return NextResponse.json({ error: `Resource not found: ${resourcePath}` }, { status: 404 });
    }

    const resourceData = await resourceFile.async('arraybuffer');
    console.log('Resource size:', resourceData.byteLength, 'bytes');

    // Determine Content-Type based on file extension
    const extension = resourcePath.match(/\.([^\.]+)$/)?.[1]?.toLowerCase() || '';
    const contentType = mimeTypes[`.${extension}`] || 'application/octet-stream';
    console.log('Serving resource:', resourcePath, 'Content-Type:', contentType);

    return new NextResponse(resourceData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': resourceData.byteLength.toString(),
      },
    });
  } catch (err: any) {
    console.error('EPUB proxy error:', err.message, err.stack);
    return NextResponse.json({ error: `Internal server error: ${err.message}` }, { status: 500 });
  }
}