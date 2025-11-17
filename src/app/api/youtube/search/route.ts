import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const maxResults = searchParams.get('maxResults') || '12';

  if (!query) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error('YouTube API key is not configured');
    return NextResponse.json({ error: 'YouTube API is not configured' }, { status: 500 });
  }

  try {
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${apiKey}`;
    
    const response = await fetch(youtubeUrl);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API error:', errorData);
      throw new Error(errorData.error?.message || 'YouTube API request failed');
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error searching YouTube:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search YouTube videos' },
      { status: 500 }
    );
  }
}
