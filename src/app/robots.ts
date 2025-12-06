import { MetadataRoute } from 'next'
import { getDomain } from '@/lib/layout-utils'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const currentDomain = await getDomain()
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/account/', '/api/'],
    },
    sitemap: `${currentDomain}/sitemap.xml`,
  }
}
