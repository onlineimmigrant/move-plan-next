import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { downloadLocation } = await request.json();

    if (!downloadLocation) {
      return NextResponse.json({ error: 'Download location is required' }, { status: 400 });
    }

    const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

    if (!accessKey) {
      console.error('Unsplash Access Key not configured');
      return NextResponse.json({ error: 'Unsplash API not configured' }, { status: 500 });
    }

    // Trigger download tracking (required by Unsplash API guidelines)
    const response = await fetch(downloadLocation, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to track download:', await response.text());
      // Don't fail the request if tracking fails - it's not critical
      return NextResponse.json({ success: false, error: 'Tracking failed but image can still be used' });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, url: data.url });
  } catch (error) {
    console.error('Error tracking download:', error);
    return NextResponse.json({ success: false, error: 'Failed to track download' }, { status: 500 });
  }
}
