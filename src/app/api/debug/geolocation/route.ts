// Test endpoint to check geolocation data
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const geoData = {
    // Vercel geolocation data
    geo: (request as any).geo,
    
    // Headers that might contain location info
    headers: {
      'x-vercel-ip-country': request.headers.get('x-vercel-ip-country'),
      'x-vercel-ip-city': request.headers.get('x-vercel-ip-city'),
      'x-vercel-ip-country-region': request.headers.get('x-vercel-ip-country-region'),
      'x-vercel-ip-latitude': request.headers.get('x-vercel-ip-latitude'),
      'x-vercel-ip-longitude': request.headers.get('x-vercel-ip-longitude'),
      'cf-ipcountry': request.headers.get('cf-ipcountry'),
      'x-user-country': request.headers.get('x-user-country'),
      'x-user-currency': request.headers.get('x-user-currency'),
      'x-forwarded-for': request.headers.get('x-forwarded-for'),
      'x-real-ip': request.headers.get('x-real-ip'),
      'user-agent': request.headers.get('user-agent'),
    },
    
    // All headers for debugging
    allHeaders: Object.fromEntries(request.headers.entries()),
    
    // Request info
    url: request.url,
    ip: (request as any).ip || 'unknown',
    nextUrl: request.nextUrl,
  };

  return NextResponse.json({
    success: true,
    message: 'Geolocation debug data',
    data: geoData,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}