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

  // Pexels Videos API may require minimum query length
  if (query.trim().length < 2) {
    console.warn('[Pexels Videos] Query too short:', query);
    return NextResponse.json({
      videos: [],
      total_results: 0,
      page: parseInt(page),
      per_page: parseInt(perPage),
      next_page: null,
      message: 'Please enter at least 2 characters to search videos'
    });
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
    const videoUrl = `https://api.pexels.com/v1/videos/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`;
    console.log('[Pexels Videos] Fetching from URL:', videoUrl);
    console.log('[Pexels Videos] Query params:', { query, page, perPage });
    
    const response = await fetch(videoUrl, {
      headers: {
        Authorization: apiKey,
      },
    });

    const data = await response.json();
    console.log('[Pexels Videos] API Response status:', response.status);
    console.log('[Pexels Videos] Response keys:', Object.keys(data));
    console.log('[Pexels Videos] Full response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('[Pexels Videos] API error response:', data);
      // Check if this is an API access error
      if (data.error && typeof data.error === 'string') {
        return NextResponse.json(
          { 
            error: `Pexels Videos API: ${data.error}`,
            message: 'Videos API may require a premium Pexels account',
            videos: [], 
            total_results: 0 
          },
          { status: response.status }
        );
      }
      return NextResponse.json(
        { error: data.error || 'Pexels API error', videos: [], total_results: 0 },
        { status: response.status }
      );
    }

    // Check if videos array exists
    if (!data.videos || !Array.isArray(data.videos)) {
      console.warn('[Pexels Videos] No videos array in response');
      // Check if this is actually a photos response (API fallback)
      if (data.photos && Array.isArray(data.photos)) {
        console.warn('[Pexels Videos] API returned photos instead of videos - videos API may not be available');
        return NextResponse.json({
          videos: [],
          total_results: 0,
          page: parseInt(page),
          per_page: parseInt(perPage),
          next_page: null,
          message: 'Video search is not available with current Pexels API configuration'
        });
      }
      return NextResponse.json({
        videos: [],
        total_results: data.total_results || 0,
        page: parseInt(page),
        per_page: parseInt(perPage),
        next_page: null,
      });
    }

    // Transform Pexels video response
    const transformedVideos = data.videos.map((video: any) => ({
      id: video.id,
      width: video.width,
      height: video.height,
      duration: video.duration,
      thumbnail: video.image,
      video_files: video.video_files,
      video_pictures: video.video_pictures,
      user: {
        name: video.user.name,
        url: video.user.url,
      },
      url: video.url,
    }));

    console.log('[Pexels Videos] Successfully transformed', transformedVideos.length, 'videos');

    return NextResponse.json({
      videos: transformedVideos,
      total_results: data.total_results,
      page: data.page,
      per_page: data.per_page,
      next_page: data.next_page,
    });
  } catch (error) {
    console.error('[Pexels Videos] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos from Pexels', videos: [], total_results: 0 },
      { status: 500 }
    );
  }
}
