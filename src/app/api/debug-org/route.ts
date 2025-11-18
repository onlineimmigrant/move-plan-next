import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;

export async function GET(request: NextRequest) {
  try {
    // For debugging - just list what's in the bucket without auth
    const { searchParams } = new URL(request.url);
    const testOrgId = searchParams.get('orgId') || 'de0d5c21-787f-49c2-a665-7ff8e599c891'; // Default tenant ID

    // List ALL objects in bucket (no delimiter to see everything)
    const listAllUrl = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects`;

    const listAllResponse = await fetch(listAllUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    });

    const allData = await listAllResponse.json();
    const allObjects = Array.isArray(allData.result) ? allData.result : (allData.result?.objects || []);
    
    // Extract unique organization IDs from keys
    const orgIds = new Set<string>();
    allObjects.forEach((obj: any) => {
      const key = obj.key as string;
      const parts = key.split('/');
      if (parts.length > 0) {
        orgIds.add(parts[0]);
      }
    });

    // Get objects for the test org
    const testOrgObjects = allObjects.filter((obj: any) => 
      obj.key.startsWith(testOrgId + '/')
    );

    // Separate by type
    const videos = testOrgObjects.filter((obj: any) => obj.key.includes('/videos/'));
    const images = testOrgObjects.filter((obj: any) => obj.key.includes('/images/') && !obj.key.includes('/thumbnails/'));
    const thumbnails = testOrgObjects.filter((obj: any) => obj.key.includes('/thumbnails/'));

    return NextResponse.json({
      test_org_id: testOrgId,
      r2_bucket: {
        name: R2_BUCKET_NAME,
        total_objects: allObjects.length,
        all_organization_ids: Array.from(orgIds),
        test_org_stats: {
          total: testOrgObjects.length,
          videos: videos.length,
          images: images.length,
          thumbnails: thumbnails.length,
        },
        sample_videos: videos.slice(0, 5).map((o: any) => o.key),
        sample_images: images.slice(0, 5).map((o: any) => o.key),
        sample_thumbnails: thumbnails.slice(0, 5).map((o: any) => o.key),
      },
      expected_paths: {
        videos: `${testOrgId}/videos/`,
        images: `${testOrgId}/images/`,
        thumbnails: `${testOrgId}/thumbnails/`,
      },
    });
  } catch (error) {
    console.error('[debug-org] Error:', error);
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
