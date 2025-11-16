import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    console.error('Unsplash Access Key not configured');
    return NextResponse.json({ error: 'Unsplash API not configured' }, { status: 500 });
  }

  try {
    // Get curated/editorial photos as featured
    const response = await fetch(
      'https://api.unsplash.com/photos?page=1&per_page=20&order_by=popular',
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Unsplash API error:', errorData);
      return NextResponse.json(
        { error: errorData.errors?.[0] || 'Failed to load featured images' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Format response to match search API structure
    return NextResponse.json({
      results: data,
      total: data.length,
      total_pages: 1,
    });
  } catch (error) {
    console.error('Error loading featured images:', error);
    return NextResponse.json({ error: 'Failed to load featured images' }, { status: 500 });
  }
}
