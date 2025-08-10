import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  console.log('🔍 Simple test endpoint called');
  return NextResponse.json({ 
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    environment: {
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'exists' : 'missing',
      service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'exists' : 'missing'
    }
  });
}
