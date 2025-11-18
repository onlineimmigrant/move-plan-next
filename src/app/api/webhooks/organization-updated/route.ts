import { NextRequest, NextResponse } from 'next/server';
import { syncR2CORSWithOrganizations } from '@/lib/cloudflareR2';

/**
 * Webhook endpoint to automatically sync R2 CORS when organizations are updated
 * This can be called from database triggers or application logic
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const webhookSecret = request.headers.get('x-webhook-secret');
    if (webhookSecret !== process.env.SYNC_API_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { event, organization } = body;

    console.log('[organization-webhook] Event:', event, 'Org ID:', organization?.id);

    // Sync CORS whenever organization is created or updated
    if (['organization.created', 'organization.updated', 'organization.domains.updated'].includes(event)) {
      const success = await syncR2CORSWithOrganizations();

      if (!success) {
        console.error('[organization-webhook] Failed to sync CORS');
        // Don't fail the webhook, just log the error
      } else {
        console.log('[organization-webhook] CORS synced successfully');
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('[organization-webhook] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
