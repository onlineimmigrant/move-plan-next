import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

const toTime = (value: unknown): number => {
  if (!value) return 0;
  const date = value instanceof Date ? value : new Date(value as any);
  const time = date.getTime();
  return Number.isFinite(time) ? time : 0;
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check if R2 credentials are configured
    if (!R2_ACCOUNT_ID || !R2_BUCKET_NAME || !CLOUDFLARE_API_TOKEN) {
      console.error('[r2-images-product] Missing R2 credentials:', {
        hasAccountId: !!R2_ACCOUNT_ID,
        hasBucketName: !!R2_BUCKET_NAME,
        hasApiToken: !!CLOUDFLARE_API_TOKEN
      });
      return NextResponse.json({ 
        error: 'R2 storage not configured. Please add CLOUDFLARE_API_TOKEN, R2_ACCOUNT_ID, and R2_BUCKET_NAME to environment variables.' 
      }, { status: 500 });
    }

    const { id } = await params;
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
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
    console.log('[r2-images-product] Using organizationId:', organizationId);

    const { searchParams } = new URL(request.url);
    const filterFolder = searchParams.get('folder');
    
    // Build prefix for R2 listing - match video structure
    const prefix = filterFolder 
      ? `${organizationId}/images/${filterFolder}/`
      : `${organizationId}/images/`;

    console.log('[r2-images-product] Listing with prefix:', prefix);

    const listUrl = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects?prefix=${encodeURIComponent(prefix)}`;

    const listResponse = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    });

    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.error('[r2-images-product] List failed:', {
        status: listResponse.status,
        statusText: listResponse.statusText,
        error: errorText,
        url: listUrl
      });
      return NextResponse.json({ 
        error: 'Failed to list images',
        details: listResponse.status === 401 ? 'Invalid Cloudflare API token' : 
                 listResponse.status === 404 ? 'R2 bucket not found' :
                 `Cloudflare API error: ${listResponse.statusText}`
      }, { status: 500 });
    }

    const data = await listResponse.json();
    
    // Handle both array and object response formats from Cloudflare
    const objects = Array.isArray(data.result) ? data.result : (data.result?.objects || []);

    console.log('[r2-images-product] Found objects:', objects.length, 'Sample keys:', objects.slice(0, 5).map((o: any) => o.key));

    // Extract unique folders and images
    const foldersSet = new Set<string>();
    const images: any[] = [];
    const folderLatest = new Map<string, number>();

    objects.forEach((obj: any) => {
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

    console.log('[r2-images-product] Returning:', { images: images.length, folders: Array.from(foldersSet).length });

    return NextResponse.json({
      images,
      folders: sortedFolders,
    });

  } catch (error) {
    console.error('[r2-images-product] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch images' 
    }, { status: 500 });
  }
}
