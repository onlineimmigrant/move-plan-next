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

// Generic R2 listing.
// Behavior:
//  - Regular users: scoped to organization determined by base_url/base_url_local.
//  - Superadmin/owner role: may supply ?organization_id=<orgId> to inspect another org's folder.
// Use /api/products/[id]/r2-videos for product-scoped listings.
export async function GET(request: NextRequest) {
  try {
    // Check if R2 credentials are configured
    if (!R2_ACCOUNT_ID || !R2_BUCKET_NAME || !CLOUDFLARE_API_TOKEN) {
      console.error('[r2-videos] Missing R2 credentials');
      return NextResponse.json({ 
        error: 'R2 storage not configured. Add environment variables to Vercel.' 
      }, { status: 500 });
    }

    // Get auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load user profile for organization_id and role check
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('[r2-videos] Failed to get user profile:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
    }

    const organizationId = profile.organization_id;
    if (!organizationId) {
      console.error('[r2-videos] User has no organization_id:', user.id);
      return NextResponse.json({ error: 'Organization not found' }, { status: 403 });
    }

    console.log('[r2-videos] Using organizationId:', organizationId);

    const { searchParams } = new URL(request.url);
    const requestedOrgId = searchParams.get('organization_id');
    const filterFolder = searchParams.get('folder'); // Optional folder filter
    let effectiveOrgId = organizationId;

    // Owner (superadmin) override: allow inspecting other org folders
    if (requestedOrgId && requestedOrgId !== organizationId) {
      if (profile.role === 'owner') {
        // Verify organization exists
        const { data: orgCheck, error: orgError } = await supabase
          .from('organizations')
          .select('id')
          .eq('id', requestedOrgId)
          .single();
        if (orgError || !orgCheck) {
          return NextResponse.json({ error: 'Requested organization not found' }, { status: 404 });
        }
        effectiveOrgId = requestedOrgId;
      } else {
        // Ignore override silently (could also return 403)
        console.warn('[r2-videos] Non-owner attempted org override:', { userId: user.id, requestedOrgId });
      }
    }

    // List objects in R2 bucket for the effective organization
    const prefix = filterFolder 
      ? `${effectiveOrgId}/videos/${filterFolder}/`
      : `${effectiveOrgId}/videos/`;
    console.log('[r2-videos] Listing with prefix:', prefix);

    // Fetch all objects with pagination support
    let allObjects: any[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const listUrl = cursor
        ? `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects?prefix=${encodeURIComponent(prefix)}&cursor=${encodeURIComponent(cursor)}`
        : `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects?prefix=${encodeURIComponent(prefix)}`;

      const response = await fetch(listUrl, {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[r2-videos] R2 list failed:', response.status, errorText);
        return NextResponse.json({ error: 'Failed to list R2 videos', details: errorText }, { status: 500 });
      }

      const data = await response.json();
      
      // Handle both array and object response formats from Cloudflare
      const objects = Array.isArray(data.result) ? data.result : (data.result?.objects || []);
      allObjects = allObjects.concat(objects);

      // Check if there are more results - pagination info is in result_info
      cursor = data.result_info?.cursor;
      hasMore = data.result_info?.is_truncated === true && !!cursor;
      
      console.log('[r2-videos] Fetched batch:', { 
        batchSize: objects.length, 
        totalSoFar: allObjects.length,
        hasMore,
        cursor: cursor ? 'present' : 'none',
        isTruncated: data.result_info?.is_truncated
      });
    }

    console.log('[r2-videos] Total objects fetched:', allObjects.length);
    
    // Transform R2 objects to video data with folder information
    const folders = new Set<string>();
    const videos = allObjects
      .filter((obj: any) => obj.key.endsWith('.mp4') || obj.key.endsWith('.webm') || obj.key.endsWith('.mov'))
      .map((obj: any) => {
        // Extract folder from key: orgId/videos/folder/file.mp4
        const keyParts = obj.key.split('/');
        const folder = keyParts.length >= 4 ? keyParts[2] : 'uncategorized';
        folders.add(folder);
        
        return {
          url: `${R2_PUBLIC_URL}/${obj.key}`,
          fileName: obj.key.split('/').pop(),
          folder,
          fullKey: obj.key,
          size: obj.size,
          uploaded: obj.last_modified || obj.uploaded,
        };
      });

    return NextResponse.json({
      success: true,
      videos,
      folders: Array.from(folders).sort(),
      count: videos.length,
      organization_id: effectiveOrgId,
      override_applied: effectiveOrgId !== organizationId,
      user_role: profile.role,
    });
  } catch (error) {
    console.error('[r2-videos] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch R2 videos', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
