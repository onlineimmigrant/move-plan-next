import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const geoCountry = (request as any).geo?.country;
  const cfCountry = request.headers.get('cf-ipcountry');
  const vercelCountry = request.headers.get('x-vercel-ip-country');
  const forwardedCountry = request.headers.get('x-forwarded-country');
  const realIpCountry = request.headers.get('x-real-ip-country');
  
  const allHeaders = Object.fromEntries(request.headers.entries());
  
  return NextResponse.json({
    geoData: {
      geoCountry,
      cfCountry,
      vercelCountry,
      forwardedCountry,
      realIpCountry,
      finalCountry: geoCountry || vercelCountry || cfCountry || forwardedCountry || realIpCountry || 'US'
    },
    request: {
      geo: (request as any).geo,
      headers: allHeaders,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      nextUrl: request.nextUrl.href
    },
    env: process.env.NODE_ENV
  });
}

export const runtime = 'edge';