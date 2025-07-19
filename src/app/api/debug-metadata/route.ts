import { NextRequest, NextResponse } from 'next/server';
import { createPageMetadata } from '@/lib/metadata-utils';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pathname = searchParams.get('path') || '/';
  
  try {
    const metadata = await createPageMetadata(pathname);
    
    return NextResponse.json({
      success: true,
      pathname,
      metadata: {
        title: metadata.title,
        description: metadata.description,
        keywords: metadata.keywords,
        openGraph: metadata.openGraph,
        twitter: metadata.twitter,
        robots: metadata.robots,
        alternates: metadata.alternates,
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      pathname
    });
  }
}
