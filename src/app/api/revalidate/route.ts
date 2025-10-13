import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, paths, tags, secret } = body;

    console.log('🔄 Revalidation request:', { organizationId, paths, tags, hasSecret: !!secret });

    // Verify secret token to prevent abuse
    const expectedSecret = process.env.REVALIDATION_SECRET;
    
    if (expectedSecret && secret !== expectedSecret) {
      console.error('❌ Invalid revalidation secret');
      return NextResponse.json(
        { success: false, message: 'Invalid secret token' }, 
        { status: 401 }
      );
    }

    // Revalidate specific paths if provided
    if (paths && Array.isArray(paths)) {
      for (const path of paths) {
        try {
          revalidatePath(path);
          console.log(`Revalidated path: ${path}`);
        } catch (error) {
          console.warn(`Failed to revalidate path ${path}:`, error);
        }
      }
    }

    // Revalidate specific tags if provided
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        try {
          revalidateTag(tag);
          console.log(`Revalidated tag: ${tag}`);
        } catch (error) {
          console.warn(`Failed to revalidate tag ${tag}:`, error);
        }
      }
    }

    // Default revalidations for homepage
    if (organizationId) {
      try {
        revalidateTag(`hero-${organizationId}`);
        revalidateTag(`homepage-${organizationId}`);
        console.log(`Revalidated organization ${organizationId} tags`);
      } catch (error) {
        console.warn(`Failed to revalidate organization tags:`, error);
      }
    }

    // Revalidate all locale homepages
    const locales = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ar'];
    for (const locale of locales) {
      try {
        revalidatePath(`/${locale}`);
      } catch (error) {
        console.warn(`Failed to revalidate /${locale}:`, error);
      }
    }

    try {
      revalidatePath('/');
    } catch (error) {
      console.warn('Failed to revalidate root path:', error);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Revalidation completed',
      revalidated: {
        paths: paths || [],
        tags: tags || [],
        organizationId
      }
    });

  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Revalidation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
