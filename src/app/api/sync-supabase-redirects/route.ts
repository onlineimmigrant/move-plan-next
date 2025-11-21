import { NextRequest, NextResponse } from 'next/server';
import { updateSupabaseRedirectUrls, getCurrentRedirectUrls } from '@/lib/supabase-redirect-sync';

/**
 * API endpoint to sync Supabase redirect URLs
 * GET - Returns current redirect URLs
 * POST - Updates Supabase with all organization domains
 */
export async function GET(request: NextRequest) {
  try {
    const redirectUrls = await getCurrentRedirectUrls();

    return NextResponse.json({
      success: true,
      count: redirectUrls.length,
      redirectUrls,
    });
  } catch (error) {
    console.error('Error getting redirect URLs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for authorization (optional - add your own auth logic)
    const authHeader = request.headers.get('x-webhook-secret');
    const expectedSecret = process.env.SYNC_API_SECRET;

    if (expectedSecret && authHeader !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await updateSupabaseRedirectUrls();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          redirectUrls: result.redirectUrls,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase redirect URLs updated successfully',
      count: result.redirectUrls.length,
      redirectUrls: result.redirectUrls,
    });
  } catch (error) {
    console.error('Error updating redirect URLs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
