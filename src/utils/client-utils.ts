/**
 * Client-side utility functions that can be used in Client Components
 */

/**
 * Get the full URL for a favicon
 * Client-side version that doesn't require server-side headers
 */
export function getFaviconUrl(favicon?: string): string {
  if (!favicon) return '/images/favicon.ico';
  if (favicon.startsWith('http')) return favicon;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/favicons/${favicon}`;
}

/**
 * Get the full URL for an image upload
 */
export function getImageUrl(image?: string): string {
  if (!image) return '';
  if (image.startsWith('http')) return image;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${image}`;
}
