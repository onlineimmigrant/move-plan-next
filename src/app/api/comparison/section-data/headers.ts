// Cache control headers for comparison data API
export const getCacheHeaders = () => ({
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  'CDN-Cache-Control': 'public, s-maxage=300',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=300',
});
