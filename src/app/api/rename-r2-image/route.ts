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

export async function POST(request: NextRequest) {
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'owner')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { oldKey, newFileName } = await request.json();

    if (!oldKey || !newFileName) {
      return NextResponse.json({ 
        error: 'Missing oldKey or newFileName' 
      }, { status: 400 });
    }

    // Extract folder from old key
    const keyParts = oldKey.split('/');
    const folder = keyParts.slice(0, -1).join('/');
    
    // Sanitize new filename
    const sanitized = newFileName.replace(/[^a-zA-Z0-9-_\.]/g, '_');
    const newKey = `${folder}/${sanitized}`;

    // Copy object to new key
    const getUrl = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${encodeURIComponent(oldKey)}`;

    const getResponse = await fetch(getUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    });

    if (!getResponse.ok) {
      return NextResponse.json({ 
        error: 'Failed to get image' 
      }, { status: 500 });
    }

    const imageBuffer = await getResponse.arrayBuffer();
    const contentType = getResponse.headers.get('content-type') || 'image/jpeg';

    // Upload to new key
    const putUrl = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${encodeURIComponent(newKey)}`;

    const putResponse = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': contentType,
      },
      body: imageBuffer,
    });

    if (!putResponse.ok) {
      return NextResponse.json({ 
        error: 'Failed to upload renamed image' 
      }, { status: 500 });
    }

    // Delete old object
    const deleteUrl = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${encodeURIComponent(oldKey)}`;

    await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    });

    // Update product_media references
    const oldUrl = `${R2_PUBLIC_URL}/${oldKey}`;
    const newUrl = `${R2_PUBLIC_URL}/${newKey}`;

    await supabase
      .from('product_media')
      .update({ image_url: newUrl })
      .eq('image_url', oldUrl);

    return NextResponse.json({
      success: true,
      newUrl,
      newFileName: sanitized,
    });

  } catch (error) {
    console.error('[rename-r2-image] Error:', error);
    return NextResponse.json({ 
      error: 'Rename failed' 
    }, { status: 500 });
  }
}
