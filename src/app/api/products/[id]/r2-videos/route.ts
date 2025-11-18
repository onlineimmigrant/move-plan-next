import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;

// Lists R2 videos for the organization that owns the product.
// Authorization: user must either belong to that organization or have elevated role (admin/owner).
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
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

    // Load user profile for organization_id and role check
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();
    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
    }

    const userOrgId = profile.organization_id;
    if (!userOrgId) {
      return NextResponse.json({ error: 'User has no organization' }, { status: 403 });
    }

    // Load product to determine owning organization
    const { data: product, error: productError } = await supabase
      .from('product')
      .select('id, organization_id')
      .eq('id', productId)
      .single();
    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const productOrgId = product.organization_id;

    // Authorization: either product belongs to user's org OR user has owner role
    if (productOrgId !== userOrgId && profile.role !== 'owner') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    console.log('[product r2-videos] Using organizationId:', productOrgId);

    const prefix = `${productOrgId}/videos/`;
    console.log('[product r2-videos] Listing with prefix:', prefix);
    const listUrl = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects?prefix=${encodeURIComponent(prefix)}`;

    const r2Resp = await fetch(listUrl, {
      headers: { 'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}` }
    });
    if (!r2Resp.ok) {
      const details = await r2Resp.text();
      console.error('[product r2-videos] R2 list failed:', r2Resp.status, details);
      return NextResponse.json({ error: 'Failed to list R2 videos', details }, { status: 500 });
    }

    const json = await r2Resp.json();
    const objects = Array.isArray(json.result) ? json.result : (json.result?.objects || []);
    console.log('[product r2-videos] API Response:', { 
      success: true, 
      objectCount: objects.length, 
      prefix, 
      sampleKeys: objects.slice(0, 5).map((o: any) => o.key) 
    });
    const folders = new Set<string>();
    
    const videos = objects
      .filter((o: any) => typeof o.key === 'string' && (o.key.endsWith('.mp4') || o.key.endsWith('.webm') || o.key.endsWith('.mov')))
      .map((o: any) => {
        // Extract folder from key: orgId/videos/folder/file.mp4
        const keyParts = o.key.split('/');
        const folder = keyParts.length >= 4 ? keyParts[2] : 'uncategorized';
        folders.add(folder);
        
        return {
          url: `${R2_PUBLIC_URL}/${o.key}`,
          fileName: o.key.split('/').pop(),
          folder,
          fullKey: o.key,
          size: o.size,
          uploaded: o.last_modified || o.uploaded,
        };
      });

    return NextResponse.json({ 
      success: true, 
      videos, 
      folders: Array.from(folders).sort(),
      count: videos.length, 
      organization_id: productOrgId 
    });
  } catch (err) {
    console.error('[product r2-videos] Error:', err);
    return NextResponse.json({ error: 'Unexpected error', details: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
