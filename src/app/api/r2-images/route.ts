import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
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

    const listUrl = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects?prefix=${encodeURIComponent(prefix)}`;

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

    console.log('[r2-images] API Response:', { 
      success: data.success, 
      objectCount: objects.length,
      prefix,
      sampleKeys: objects.slice(0, 5).map((o: any) => o.key)
    });

    // Extract unique folders and images
    const foldersSet = new Set<string>();
    const images: any[] = [];

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
      const isImageFile = fileName && /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName);
      
      if (!filterFolder) {
        // At root level - show folders and files
        if (parts.length > 1 && parts[0]) {
          // This is in a subfolder - add the folder
          foldersSet.add(parts[0]);
        }
        
        // Add all image files found
        if (isImageFile) {
          const imageFolder = parts.length > 1 ? parts[0] : 'uncategorized';
          images.push({
            url: `${R2_PUBLIC_URL}/${key}`,
            fileName,
            fullKey: key,
            folder: imageFolder,
            size: obj.size,
            uploaded: obj.last_modified || obj.uploaded,
          });
        }
      } else {
        // Inside a folder - show only files in this folder
        if (isImageFile && parts.length === 1) {
          // Direct file in this folder
          images.push({
            url: `${R2_PUBLIC_URL}/${key}`,
            fileName,
            fullKey: key,
            folder: filterFolder,
            size: obj.size,
            uploaded: obj.last_modified || obj.uploaded,
          });
        }
      }
    });

    return NextResponse.json({
      images,
      folders: Array.from(foldersSet).sort(),
    });

  } catch (error) {
    console.error('[r2-images] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch images' 
    }, { status: 500 });
  }
}
