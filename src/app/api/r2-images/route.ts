import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

const toTime = (value: unknown): number => {
  if (!value) return 0;
  const date = value instanceof Date ? value : new Date(value as any);
  const time = date.getTime();
  return Number.isFinite(time) ? time : 0;
};

export async function GET(request: NextRequest) {
  try {
    // Check if R2 credentials are configured
    if (!R2_ACCOUNT_ID || !R2_BUCKET_NAME || !CLOUDFLARE_API_TOKEN) {
      console.error('[r2-images] Missing R2 credentials');
      return NextResponse.json({ 
        error: 'R2 storage not configured. Add environment variables to Vercel.' 
      }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization + role
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 403 });
    }

    const organizationId = profile.organization_id;
    console.log('[r2-images] Using organizationId:', organizationId);

    const { searchParams } = new URL(request.url);
    const filterFolder = searchParams.get('folder');
    
    // Build prefix for R2 listing - match video structure exactly
    const prefix = filterFolder 
      ? `${organizationId}/images/${filterFolder}/`
      : `${organizationId}/images/`;

    console.log('[r2-images] Listing with prefix:', prefix);

    // Fetch all objects with pagination support
    let allObjects: any[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const listUrl = cursor
        ? `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects?prefix=${encodeURIComponent(prefix)}&cursor=${encodeURIComponent(cursor)}`
        : `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects?prefix=${encodeURIComponent(prefix)}`;

      const listResponse = await fetch(listUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
      });

      if (!listResponse.ok) {
        const errorText = await listResponse.text();
        console.error('[r2-images] List failed:', errorText);
        return NextResponse.json({ 
          error: 'Failed to list images' 
        }, { status: 500 });
      }

      const data = await listResponse.json();
      
      // Handle both array and object response formats from Cloudflare
      const objects = Array.isArray(data.result) ? data.result : (data.result?.objects || []);
      allObjects = allObjects.concat(objects);

      // Check if there are more results - pagination info is in result_info
      cursor = data.result_info?.cursor;
      hasMore = data.result_info?.is_truncated === true && !!cursor;
      
      console.log('[r2-images] Fetched batch:', { 
        batchSize: objects.length, 
        totalSoFar: allObjects.length,
        hasMore,
        cursor: cursor ? 'present' : 'none',
        isTruncated: data.result_info?.is_truncated
      });
    }

    console.log('[r2-images] Total objects fetched:', allObjects.length);

    // Extract unique folders and images
    const foldersSet = new Set<string>();
    const images: any[] = [];
    const folderLatest = new Map<string, number>();

    allObjects.forEach((obj: any) => {
      const key = obj.key as string;
      
      // Remove prefix to get relative path
      const relativePath = key.replace(prefix, '');
      
      // Skip empty paths
      if (!relativePath) return;
      
      // Split into parts
      const parts = relativePath.split('/').filter(p => p);
      
      if (parts.length === 0) return;
      
      // Get the file name (last part)
      const fileName = parts[parts.length - 1];
      
      // Check if this is an image file
      const allowSvg = profile?.role === 'superadmin';
      const isImageFile = fileName && (allowSvg
        ? /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileName)
        : /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName)
      );
      
      if (!filterFolder) {
        // At root level - show folders and files
        if (parts.length > 1 && parts[0]) {
          // This is in a subfolder - add the folder
          foldersSet.add(parts[0]);
        }
        
        // Add all image files found
        if (isImageFile) {
          const imageFolder = parts.length > 1 ? parts[0] : 'uncategorized';
          const uploaded = obj.last_modified || obj.uploaded;
          const uploadedTime = toTime(uploaded);
          const prevLatest = folderLatest.get(imageFolder) || 0;
          if (uploadedTime > prevLatest) folderLatest.set(imageFolder, uploadedTime);
          images.push({
            url: `${R2_PUBLIC_URL}/${key}`,
            fileName,
            fullKey: key,
            folder: imageFolder,
            size: obj.size,
            uploaded,
          });
        }
      } else {
        // Inside a folder - show only files in this folder
        if (isImageFile && parts.length === 1) {
          // Direct file in this folder
          const uploaded = obj.last_modified || obj.uploaded;
          const uploadedTime = toTime(uploaded);
          const prevLatest = folderLatest.get(filterFolder) || 0;
          if (uploadedTime > prevLatest) folderLatest.set(filterFolder, uploadedTime);
          images.push({
            url: `${R2_PUBLIC_URL}/${key}`,
            fileName,
            fullKey: key,
            folder: filterFolder,
            size: obj.size,
            uploaded,
          });
        }
      }
    });

    images.sort((a, b) => {
      const diff = toTime(b.uploaded) - toTime(a.uploaded);
      if (diff !== 0) return diff;
      const aName = typeof a.fileName === 'string' ? a.fileName : '';
      const bName = typeof b.fileName === 'string' ? b.fileName : '';
      return aName.localeCompare(bName);
    });

    const sortedFolders = Array.from(foldersSet).sort((a, b) => {
      const diff = (folderLatest.get(b) || 0) - (folderLatest.get(a) || 0);
      if (diff !== 0) return diff;
      return a.localeCompare(b);
    });

    return NextResponse.json({
      images,
      folders: sortedFolders,
    });

  } catch (error) {
    console.error('[r2-images] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch images' 
    }, { status: 500 });
  }
}
