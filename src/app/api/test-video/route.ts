// Test endpoint to verify API routes work
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  console.log('[test-video] Test endpoint hit!');
  return NextResponse.json({ 
    success: true, 
    message: 'API routes are working',
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  console.log('[test-video] POST test endpoint hit!');
  
  try {
    const body = await req.json();
    console.log('[test-video] Received body:', body);
    
    return NextResponse.json({ 
      success: true, 
      message: 'POST received',
      receivedData: body
    });
  } catch (error) {
    console.error('[test-video] Error:', error);
    return NextResponse.json({ 
      error: 'Failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
