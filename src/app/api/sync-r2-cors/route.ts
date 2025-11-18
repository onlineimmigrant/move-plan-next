import { NextRequest, NextResponse } from 'next/server';
import { syncR2CORSWithOrganizations, getCurrentCORSConfig } from '@/lib/cloudflareR2';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Sync R2 CORS with organization domains
 * POST /api/sync-r2-cors - Update CORS configuration
 * GET /api/sync-r2-cors - Get current CORS configuration
 */
export async function POST(request: NextRequest) {
  try {
    // Check for webhook secret first (for database trigger calls)
    const webhookSecret = request.headers.get('x-webhook-secret');
    
    if (webhookSecret === process.env.SYNC_API_SECRET) {
      // Called from database trigger - bypass auth
      console.log('[sync-r2-cors] Called from database trigger');
      const success = await syncR2CORSWithOrganizations();

      if (!success) {
        return NextResponse.json({ 
          error: 'Failed to sync CORS configuration' 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true,
        message: 'R2 CORS configuration synced successfully with organization domains'
      });
    }
    
    // Otherwise, verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check user role - only admins/owners can sync CORS
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'owner', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ 
        error: 'Forbidden. Only admins can sync CORS configuration.' 
      }, { status: 403 });
    }

    // Sync CORS
    const success = await syncR2CORSWithOrganizations();

    if (!success) {
      return NextResponse.json({ 
        error: 'Failed to sync CORS configuration' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'R2 CORS configuration synced successfully with organization domains'
    });

  } catch (error) {
    console.error('[sync-r2-cors] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

/**
 * Get current CORS configuration
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const corsConfig = await getCurrentCORSConfig();

    if (!corsConfig) {
      return NextResponse.json({ 
        error: 'Failed to fetch CORS configuration' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      cors: corsConfig
    });

  } catch (error) {
    console.error('[sync-r2-cors] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
