import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  const page = searchParams.get('page') || '1';
  const perPage = searchParams.get('per_page') || '30';

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    );
  }

  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    console.error('PEXELS_API_KEY is not configured');
    return NextResponse.json(
      { error: 'Pexels API is not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform Pexels response to our format
    const transformedPhotos = data.photos.map((photo: any) => ({
      id: photo.id,
      url: photo.src.large2x, // High quality image
      thumbnail: photo.src.medium,
      photographer: photo.photographer,
      photographer_url: photo.photographer_url,
      photo_url: photo.url,
      avg_color: photo.avg_color,
      width: photo.width,
      height: photo.height,
    }));

    return NextResponse.json({
      photos: transformedPhotos,
      total_results: data.total_results,
      page: data.page,
      per_page: data.per_page,
      next_page: data.next_page,
    });
  } catch (error) {
    console.error('Error fetching from Pexels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images from Pexels' },
      { status: 500 }
    );
  }
}
