/**
 * Revalidation Helper
 * 
 * Utilities for triggering on-demand cache revalidation
 * when admin makes changes to content.
 */

interface RevalidationOptions {
  paths?: string[];
  tags?: string[];
  organizationId?: string;
}

interface RevalidationResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Trigger cache revalidation for specific paths or tags
 * 
 * Usage:
 * await revalidateCache({ paths: ['/'] });
 * await revalidateCache({ paths: ['/', '/about'] });
 * await revalidateCache({ organizationId: 'org_123' });
 */
export async function revalidateCache(options: RevalidationOptions): Promise<RevalidationResponse> {
  try {
    // Note: We don't send a secret from client-side for security reasons
    // The API route should validate the user's session instead
    const response = await fetch('/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Revalidation failed:', error);
      return {
        success: false,
        error: error.message || 'Revalidation failed'
      };
    }

    const data = await response.json();
    console.log('✅ Cache revalidated:', data);
    
    return {
      success: true,
      message: 'Cache revalidated successfully'
    };
  } catch (error) {
    console.error('❌ Error calling revalidation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Revalidate homepage
 * 
 * Call this after updating hero, header, footer, or homepage sections
 */
export async function revalidateHomepage(organizationId?: string): Promise<RevalidationResponse> {
  const locales = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ar'];
  const paths = locales.map(locale => `/${locale}`);
  
  return revalidateCache({ 
    paths: ['/', ...paths],
    organizationId 
  });
}

/**
 * Revalidate specific page
 * 
 * Call this after updating a specific page's content
 */
export async function revalidatePage(slug: string): Promise<RevalidationResponse> {
  const locales = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ar'];
  const paths = [
    `/${slug}`,
    ...locales.map(locale => `/${locale}/${slug}`)
  ];
  
  return revalidateCache({ paths });
}

/**
 * Revalidate all pages
 * 
 * Use sparingly - revalidates entire site
 */
export async function revalidateAll(): Promise<RevalidationResponse> {
  return revalidateCache({
    paths: ['/'],
    // This will trigger revalidation of homepage and all linked pages
  });
}
