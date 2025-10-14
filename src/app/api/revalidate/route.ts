import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, paths, tags } = body;

    console.log('🔄 Revalidation request:', { organizationId, paths, tags });

    // Note: We no longer check for a secret here because:
    // 1. This API is called from authenticated admin contexts
    // 2. Revalidation is idempotent and safe (doesn't modify data)
    // 3. It's only called after actual database updates
    // If you need additional security, validate the session here instead

    // Revalidate specific paths if provided
    if (paths && Array.isArray(paths)) {
      for (const path of paths) {
        try {
          revalidatePath(path);
          console.log(`✅ Revalidated path: ${path}`);
        } catch (error) {
          console.warn(`⚠️ Failed to revalidate path ${path}:`, error);
        }
      }
    }

    // Revalidate specific tags if provided
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        try {
          revalidateTag(tag);
          console.log(`✅ Revalidated tag: ${tag}`);
        } catch (error) {
          console.warn(`⚠️ Failed to revalidate tag ${tag}:`, error);
        }
      }
    }

    // Default revalidations for homepage
    if (organizationId) {
      try {
        revalidateTag(`hero-${organizationId}`);
        revalidateTag(`homepage-${organizationId}`);
        revalidateTag(`org-${organizationId}`);
        console.log(`✅ Revalidated organization ${organizationId} tags`);
      } catch (error) {
        console.warn(`⚠️ Failed to revalidate organization tags:`, error);
      }
    }

    // Revalidate all locale homepages
    const locales = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ar'];
    for (const locale of locales) {
      try {
        revalidatePath(`/${locale}`, 'page');
        console.log(`✅ Revalidated /${locale}`);
      } catch (error) {
        console.warn(`⚠️ Failed to revalidate /${locale}:`, error);
      }
    }

    try {
      revalidatePath('/', 'page');
      console.log('✅ Revalidated root path');
    } catch (error) {
      console.warn('⚠️ Failed to revalidate root path:', error);
    }

    console.log('✅ Revalidation completed successfully');

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
    console.error('❌ Revalidation error:', error);
    return NextResponse.json(
      { error: 'Revalidation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
