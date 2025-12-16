import { supabase } from '@/lib/supabaseClient';

const supabaseServer = supabase;
import { getOrganizationId, getSettings } from '../getSettings';
import { getBreadcrumbStructuredData } from '../getBreadcrumbs';
import { SECTION_ROUTES } from '../postUtils';
import { seoCache, getCacheTTL } from '../seo/cache';

export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string | string[];
  canonicalUrl?: string;
  seo_og_image?: string | null | undefined;
  seo_og_url?: string;
  structuredData: Array<Record<string, any>>;
  faqs: Array<{ question: string; answer: string }>;
  // Article-specific metadata for blog posts
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleAuthor?: string;
}

interface Product {
  id: number | string;
  product_name: string;
  product_description?: string | null;
  metadescription_for_page?: string | null;
  links_to_image?: string | null;
  price_manual?: number | null;
  currency_manual?: string | null;
  organization_id: string;
  product_sub_type_id?: number | null;
}

interface FAQ {
  id: number;
  question: string | null;
  answer: string | null;
  product_sub_type_id?: number | null;
  organization_id: string;
}

interface Review {
  id: number;
  rating: number | null;
  comment: string | null;
  user_name: string | null;
  product_id: number | string;
}

interface Video {
  id: number;
  video_url: string | null;
  thumbnail_url?: string | null;
  title: string | null;
  description: string | null;
  product_id: number | string;
}

interface Course {
  id: number;
  title: string | null;
  description: string | null;
  provider_name: string | null;
  product_id: number | string;
}

interface Article {
  id: number;
  title: string | null;
  content: string | null;
  created_on: string | null;
  author_name: string | null;
  product_id: number | string;
}

interface Page {
  id: number;
  path: string;
  title: string | null;
  description: string | null;
  keywords: string | null;
  og_image: string | null;
  og_url: string | null;
  organization_id: string;
}

// Type guards
function isReviewArray(reviews: unknown): reviews is Review[] {
  return Array.isArray(reviews) && reviews.every((r) => typeof r === 'object' && r !== null && 'rating' in r && 'comment' in r && 'user_name' in r);
}

function isFAQArray(faqs: unknown): faqs is FAQ[] {
  return Array.isArray(faqs) && faqs.every((f) => typeof f === 'object' && f !== null && 'question' in f && 'answer' in f);
}

function isValidFAQ(faq: FAQ): faq is FAQ & { question: string; answer: string } {
  return typeof faq.question === 'string' && faq.question.trim() !== '' && typeof faq.answer === 'string' && faq.answer.trim() !== '';
}

function isVideoArray(videos: unknown): videos is Video[] {
  return Array.isArray(videos) && videos.every((v) => typeof v === 'object' && v !== null && 'video_url' in v && 'title' in v && 'description' in v);
}

function isValidVideo(video: Video): video is Video & { video_url: string; title: string; description: string } {
  return (
    typeof video.video_url === 'string' &&
    video.video_url.trim() !== '' &&
    typeof video.title === 'string' &&
    video.title.trim() !== '' &&
    typeof video.description === 'string' &&
    video.description.trim() !== ''
  );
}

function isValidCourse(course: unknown): course is Course & { title: string; description: string; provider_name: string } {
  return (
    typeof course === 'object' &&
    course !== null &&
    'title' in course &&
    typeof course.title === 'string' &&
    course.title.trim() !== '' &&
    'description' in course &&
    typeof course.description === 'string' &&
    course.description.trim() !== '' &&
    'provider_name' in course &&
    typeof course.provider_name === 'string' &&
    course.provider_name.trim() !== ''
  );
}

function isArticleArray(articles: unknown): articles is Article[] {
  return Array.isArray(articles) && articles.every((a) => typeof a === 'object' && a !== null && 'title' in a && 'content' in a && 'created_on' in a && 'author_name' in a);
}

function isValidArticle(article: Article): article is Article & { title: string; content: string; created_on: string; author_name: string } {
  return (
    typeof article.title === 'string' &&
    article.title.trim() !== '' &&
    typeof article.content === 'string' &&
    article.content.trim() !== '' &&
    typeof article.created_on === 'string' &&
    article.created_on.trim() !== '' &&
    typeof article.author_name === 'string' &&
    article.author_name.trim() !== ''
  );
}

export async function fetchPageSEOData(pathname: string, baseUrl: string): Promise<SEOData> {
  // Check cache first
  const cachedData = seoCache.get(pathname, baseUrl);
  if (cachedData) {
    console.log('[fetchPageSEOData] Cache hit for:', pathname);
    return cachedData;
  }

  try {
    const organizationId = await getOrganizationId(baseUrl);
    if (!organizationId) {
      console.log('[fetchPageSEOData] No organizationId found');
      return fetchDefaultSEOData(baseUrl, pathname);
    }

    // Normalize pathname for query
    const normalizedPath = pathname.toLowerCase().replace(/\/$/, '') || '';
    const queryPaths = normalizedPath === '' ? ['/', '/home'] : [normalizedPath, `/${normalizedPath}`];
    // console.log('[fetchPageSEOData] Querying page for paths:', queryPaths);

    let page: Page | null = null;
    for (const queryPath of queryPaths) {
      const { data, error } = await supabaseServer
        .from('pages')
        .select('id, path, title, description, keywords, og_image, og_url, organization_id')
        .eq('path', queryPath)
        .eq('organization_id', organizationId)
        .single();

      if (!error && data) {
        page = data;
        console.log('[fetchPageSEOData] Found page for path:', queryPath, 'title:', data.title);
        break;
      } else {
        // console.log('[fetchPageSEOData] No page found for path:', queryPath, 'error:', error?.message || 'No data');
      }
    }

    // If no page found in database, check if this is home page first
    if (!page) {
      // Check if this is the home page (pathname can be '/', '/home', or empty string after normalization)
      const isHomePage = normalizedPath === '' || normalizedPath === '/' || normalizedPath === '/home';
      
      if (isHomePage) {
        // console.log('[fetchPageSEOData] No page found but this is home page, generating home page SEO');
        
        // Generate home page SEO data with products structured data
        const settings = await getSettings(baseUrl);
        const siteName = settings?.site || 'App';
        
        // Decode pathname for human-readable URLs in structured data
        let decodedPathname = pathname;
        try {
          decodedPathname = decodeURIComponent(pathname);
        } catch (error) {
          console.warn('[fetchPageSEOData] Failed to decode pathname:', pathname, error);
          decodedPathname = pathname;
        }
        
        const canonicalUrl = `${baseUrl.replace(/\/$/, '')}${pathname || '/'}`;
        const structuredDataUrl = `${baseUrl.replace(/\/$/, '')}${decodedPathname || '/'}`;
        
        const pageTitle = generatePageTitle('/');
        const pageDescription = generatePageDescription('/');
        
        const seoData: SEOData = {
          title: `${pageTitle} | ${siteName}`,
          description: pageDescription,
          keywords: generatePageKeywords('/'),
          canonicalUrl: canonicalUrl,
          seo_og_image: '',
          seo_og_url: canonicalUrl,
          structuredData: [
            {
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              name: `${pageTitle} | ${siteName}`,
              description: pageDescription,
              url: structuredDataUrl,
            },
            {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: getBreadcrumbStructuredData({
                pathname: pathname,
                domain: baseUrl,
                overrides: [{ segment: pathname, label: pageTitle }],
                extraCrumbs: [],
              }),
            }
          ],
          faqs: [],
        };

        // Add home page products structured data
        try {
          // console.log('[fetchPageSEOData] Detected home page (no DB entry), adding pricing modal products structured data');
          const homePageProductsData = await fetchHomePageProductsStructuredData(baseUrl, organizationId);
          if (homePageProductsData.length > 0) {
            seoData.structuredData.push(...homePageProductsData);
            // console.log('[fetchPageSEOData] Added', homePageProductsData.length, 'pricing modal product structured data items');
          }
        } catch (error) {
          console.error('[fetchPageSEOData] Error adding home page products structured data:', error);
        }

        // Add FAQ structured data for the home page
        const pageFAQs = await addFAQStructuredData(organizationId, seoData.structuredData, pathname, []);
        seoData.faqs = pageFAQs;

        // console.log('[fetchPageSEOData] Generated home page SEO (no DB entry) with', seoData.structuredData.length, 'structured data items');
        return seoData;
      }
      
      // console.log('[fetchPageSEOData] No page found, generating dynamic metadata for:', normalizedPath);
      return generateDynamicPageSEO(normalizedPath, baseUrl, organizationId);
    }

    // Decode pathname for human-readable URLs in structured data
    let decodedPathname = pathname;
    try {
      decodedPathname = decodeURIComponent(pathname);
    } catch (error) {
      console.warn('[fetchPageSEOData] Failed to decode pathname:', pathname, error);
      decodedPathname = pathname;
    }
    
    const canonicalUrl = `${baseUrl.replace(/\/$/, '')}${pathname || '/'}`;
    const structuredDataUrl = `${baseUrl.replace(/\/$/, '')}${decodedPathname || '/'}`;
    const seoData: SEOData = {
      title: page.title || generatePageTitle(normalizedPath),
      description: page.description || generatePageDescription(normalizedPath),
      keywords: page.keywords ? (Array.isArray(page.keywords) ? page.keywords : page.keywords.split(',').map(k => k.trim())) : generatePageKeywords(normalizedPath),
      canonicalUrl,
      seo_og_image: page.og_image ?? undefined,
      seo_og_url: page.og_url || canonicalUrl,
      structuredData: [],
      faqs: [],
    };

    // Fetch FAQs for homepage only
    const isHomePage = page.path === '/' || page.path === '/home';
    console.log('[fetchPageSEOData] Home page detection: page.path=', page.path, 'isHomePage=', isHomePage);
    if (isHomePage) {
      const { data: faqs, error: faqsError } = await supabaseServer
        .from('faq')
        .select('id, question, answer')
        .eq('organization_id', organizationId)
        .eq('display_home_page', true);
      if (!faqsError && isFAQArray(faqs)) {
        seoData.faqs = faqs.filter(isValidFAQ);
        if (seoData.faqs.length > 0) {
          seoData.structuredData.push({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: seoData.faqs.map(faq => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer.replace(/\n/g, ' ').trim(),
              },
            })),
          });
        }
        console.log('[fetchPageSEOData] FAQs fetched:', seoData.faqs.length);
      } else if (faqsError) {
        console.error('[fetchPageSEOData] Error fetching FAQs:', faqsError.message);
      }
    }

    // Add WebPage and BreadcrumbList structured data
    seoData.structuredData.push(
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: seoData.title,
        description: seoData.description,
        url: structuredDataUrl,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: getBreadcrumbStructuredData({
          pathname: page.path,
          domain: baseUrl,
          overrides: page.title ? [{ segment: page.path, label: page.title }] : [],
          extraCrumbs: [],
        }),
      }
    );

    // Add FAQ structured data for this page (skip if already added for homepage)
    if (!isHomePage) {
      const pageFAQs = await addFAQStructuredData(organizationId, seoData.structuredData, pathname, []);
      seoData.faqs = pageFAQs;
    }

    // Special handling for home page - add pricing modal products structured data
    if (isHomePage) {
      console.log('[fetchPageSEOData] Detected home page, adding pricing modal products structured data');
      try {
        const homePageProductsData = await fetchHomePageProductsStructuredData(baseUrl, organizationId);
        if (homePageProductsData.length > 0) {
          seoData.structuredData.push(...homePageProductsData);
          console.log('[fetchPageSEOData] Added', homePageProductsData.length, 'pricing modal product structured data items');
        }
      } catch (error) {
        console.error('[fetchPageSEOData] Error adding home page products structured data:', error);
      }
    }

    // Special handling for products listing page - add product structured data
    const localeStrippedPath = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/'); // Remove locale prefix like /en, /es, etc.
    if (localeStrippedPath === '/products' || pathname === '/products') {
      console.log('[fetchPageSEOData] Detected products listing page, adding product structured data');
      try {
        const productsListingData = await fetchProductsListingSEOData(baseUrl);
        // Only add product-specific structured data, avoid duplicating other schema types
        const productSchemas = productsListingData.structuredData.filter(item => 
          item['@type'] === 'Product' || item['@type'] === 'ItemList'
        );
        
        // Check if we already have product schemas to avoid duplication
        const existingProductIds = new Set(
          seoData.structuredData
            .filter(item => item['@type'] === 'Product' && item['@id'])
            .map(item => item['@id'])
        );
        
        const newProductSchemas = productSchemas.filter(item => 
          item['@type'] !== 'Product' || !existingProductIds.has(item['@id'])
        );
        
        if (newProductSchemas.length > 0) {
          seoData.structuredData.push(...newProductSchemas);
          console.log('[fetchPageSEOData] Added', newProductSchemas.length, 'new product structured data items');
        } else {
          console.log('[fetchPageSEOData] All product schemas already exist, skipping to prevent duplication');
        }
      } catch (error) {
        console.error('[fetchPageSEOData] Error adding product structured data:', error);
      }
    }

    console.log('[fetchPageSEOData] Page SEO data fetched:', seoData.title);
    
    // Cache the result before returning
    const ttl = getCacheTTL(pathname);
    seoCache.set(pathname, baseUrl, seoData, ttl);
    
    return seoData;
  } catch (error: any) {
    console.error('[fetchPageSEOData] Error:', error.message);
    return fetchDefaultSEOData(baseUrl, pathname);
  }
}

// Helper function to fetch and add FAQ structured data for any page
async function addFAQStructuredData(
  organizationId: string, 
  structuredData: Array<Record<string, any>>, 
  pathname: string,
  existingFAQs: { question: string; answer: string }[] = []
): Promise<{ question: string; answer: string }[]> {
  try {
    // console.log('[addFAQStructuredData] Processing FAQ structured data for', pathname);
    
    // Don't duplicate FAQ data if it already exists
    const existingStructuredData = structuredData.filter(item => 
      item['@type'] === 'FAQPage' || item['@type'] === 'Question'
    );
    
    if (existingStructuredData.length > 0) {
      console.log('[addFAQStructuredData] FAQ structured data already exists for', pathname, '- skipping');
      return existingFAQs;
    }

    let faqQuery = supabaseServer
      .from('faq')
      .select('question, answer')
      .eq('organization_id', organizationId);

    // For home page, only get FAQs marked for home page display
    if (pathname === '' || pathname === '/' || pathname === '/home') {
      faqQuery = faqQuery.eq('display_home_page', true);
    }
    // For other pages, get all FAQs (you can add more specific logic here)
    // This ensures all pages can have relevant FAQ structured data

    const { data: faqs, error } = await faqQuery;

    if (error) {
      console.error('[addFAQStructuredData] Error fetching FAQs:', error.message);
      return existingFAQs;
    }

    const validFAQs = (faqs || []).filter(
      (faq): faq is { question: string; answer: string } =>
        typeof faq.question === 'string' &&
        faq.question.trim() !== '' &&
        typeof faq.answer === 'string' &&
        faq.answer.trim() !== ''
    );

    if (validFAQs.length > 0) {
      structuredData.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: validFAQs.map((faq: { question: string; answer: string }) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer.replace(/\n/g, ' ').trim(),
          },
        })),
      });
      // console.log('[addFAQStructuredData] Added FAQ structured data for', pathname, 'with', validFAQs.length, 'FAQs');
    }

    return [...existingFAQs, ...validFAQs];
  } catch (error: any) {
    console.error('[addFAQStructuredData] Error:', error.message);
    return existingFAQs;
  }
}

// Generate dynamic page metadata for pages not in database
async function generateDynamicPageSEO(pathname: string, baseUrl: string, organizationId: string): Promise<SEOData> {
  // console.log('[generateDynamicPageSEO] Called with pathname:', JSON.stringify(pathname), 'length:', pathname.length);
  
  // Note: Home page handling is done in fetchPageSEOData to avoid duplication

  // Check if this is a product page
  const productMatch = pathname.match(/^\/products\/([^\/]+)$/);
  if (productMatch) {
    const productSlug = productMatch[1];
    // console.log('[generateDynamicPageSEO] Detected product page, using fetchProductSEOData for:', productSlug);
    return fetchProductSEOData(productSlug, baseUrl);
  }

  // Check if this is the products listing page
  if (pathname === '/products') {
    // console.log('[generateDynamicPageSEO] Detected products listing page, using fetchProductsListingSEOData');
    return fetchProductsListingSEOData(baseUrl);
  }

  // Check if this is an FAQ page
  if (pathname === '/faq' || pathname === '/faqs') {
    console.log('[generateDynamicPageSEO] Detected FAQ page, adding FAQ structured data');
    return generateFAQPageSEO(baseUrl, organizationId);
  }

  // Check if this is a blog post (any path that could be a post slug)
  // Skip known static pages and only check potential blog posts
  const staticPages = ['/about', '/contact', '/products', '/services', '/privacy-policy', '/terms-of-service', '/cookie-policy', '/blog', '/investors'];
  const isStaticPage = staticPages.includes(pathname) || pathname.startsWith('/products/') || pathname.startsWith('/api/');
  
  // Check if this is a post-based route from postUtils
  const isPostBasedRoute = Object.values(SECTION_ROUTES).some(route => pathname.startsWith(route)) || 
                           (!isStaticPage && pathname !== '/' && pathname.length > 1);
  
  console.log('[generateDynamicPageSEO] Blog post detection debug:', {
    pathname,
    isStaticPage,
    isPostBasedRoute,
    pathnameLengthCheck: pathname.length > 1,
    pathIsNotRoot: pathname !== '/',
    shouldCheckBlogPost: isPostBasedRoute
  });
  
  if (isPostBasedRoute) {
    // console.log('[generateDynamicPageSEO] Potential blog post detected, checking for post:', pathname);
    
    try {
      // Extract slug from various route patterns
      let slug = pathname.replace(/^\//, ''); // Remove leading slash
      
      // Handle sectioned routes (e.g., /sqe-2/some-post -> some-post)
      for (const [sectionName, route] of Object.entries(SECTION_ROUTES)) {
        if (pathname.startsWith(route + '/')) {
          slug = pathname.replace(route + '/', '');
          console.log(`[generateDynamicPageSEO] Detected ${sectionName} section route, extracted slug: ${slug}`);
          break;
        }
      }
      
      console.log('[generateDynamicPageSEO] Searching for post with slug:', slug, 'organizationId:', organizationId);
      
      const { data: post, error: postError } = await supabaseServer
        .from('blog_post')
        .select('*')
        .eq('slug', slug)
        .eq('organization_id', organizationId)
        .single();
      
      if (post && !postError) {
        // Check display_config.display_this_post (JSONB field)
        const shouldDisplay = post.display_config?.display_this_post ?? post.display_this_post ?? true;
        if (shouldDisplay) {
          console.log('[generateDynamicPageSEO] Found blog post, generating Article structured data for:', post.title);
          return generateBlogPostSEO(post, baseUrl, organizationId, pathname);
        } else {
          console.log('[generateDynamicPageSEO] Blog post found but not set to display');
        }
      } else {
        console.log('[generateDynamicPageSEO] No blog post found for slug:', slug, 'error:', postError?.message || 'No data');
      }
    } catch (error) {
      console.error('[generateDynamicPageSEO] Error checking for blog post:', error);
    }
  }

  const settings = await getSettings(baseUrl);
  const siteName = settings?.site || 'App';
  
  // Decode pathname for human-readable content
  let decodedPathname = pathname;
  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch (error) {
    console.warn('[generateDynamicPageSEO] Failed to decode pathname:', pathname, error);
    decodedPathname = pathname;
  }
  
  // Create both URLs: encoded for web standards, decoded for structured data
  const canonicalUrl = `${baseUrl.replace(/\/$/, '')}${pathname || '/'}`;
  const structuredDataUrl = `${baseUrl.replace(/\/$/, '')}${decodedPathname || '/'}`;
  const pageTitle = generatePageTitle(pathname);
  const pageDescription = generatePageDescription(pathname);
  
  const structuredData: Array<Record<string, any>> = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: pageTitle,
      description: pageDescription,
      url: structuredDataUrl,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: getBreadcrumbStructuredData({
        pathname,
        domain: baseUrl,
        overrides: [{ segment: pathname, label: pageTitle }],
        extraCrumbs: [],
      }),
    }
  ];

  // Add FAQ structured data for this page
  const pageFAQs = await addFAQStructuredData(organizationId, structuredData, pathname, []);

  const seoData: SEOData = {
    title: `${pageTitle} | ${siteName}`,
    description: pageDescription,
    keywords: generatePageKeywords(pathname),
    canonicalUrl,
    seo_og_image: settings?.seo_og_image ?? undefined,
    seo_og_url: canonicalUrl,
    structuredData,
    faqs: pageFAQs,
  };

  console.log('[generateDynamicPageSEO] Generated dynamic SEO for:', pathname, 'title:', pageTitle);
  return seoData;
}

// Helper functions for dynamic page content
function generatePageTitle(pathname: string): string {
  const pathMap: Record<string, string> = {
    '/investors': 'Investors',
    '/about': 'About Us',
    '/contact': 'Contact Us',
    '/services': 'Our Services',
    '/products': 'Products',
    '/blog': 'Blog',
    '/privacy-policy': 'Privacy Policy',
    '/terms-of-service': 'Terms of Service',
    '/cookie-policy': 'Cookie Policy',
  };

  if (pathMap[pathname]) {
    return pathMap[pathname];
  }

  // Decode URL-encoded characters (e.g., Cyrillic text)
  let decodedPathname = pathname;
  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch (error) {
    console.warn('[generatePageTitle] Failed to decode pathname:', pathname, error);
    // Use original pathname if decoding fails
    decodedPathname = pathname;
  }

  // Generate title from path segments
  return decodedPathname
    .split('/')
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '))
    .join(' - ') || 'Home';
}

function generatePageDescription(pathname: string): string {
  const descriptionMap: Record<string, string> = {
    '/investors': 'Discover investment opportunities and learn about our company\'s growth potential.',
    '/about': 'Learn more about our company, mission, and team.',
    '/contact': 'Get in touch with us for any questions or inquiries.',
    '/services': 'Explore our comprehensive range of professional services.',
    '/products': 'Browse our complete product catalog and offerings.',
    '/blog': 'Read our latest insights, news, and industry updates.',
    '/privacy-policy': 'Read our privacy policy to understand how we protect your data.',
    '/terms-of-service': 'Review our terms of service and user agreement.',
    '/cookie-policy': 'Learn about our cookie usage and privacy practices.',
  };

  if (descriptionMap[pathname]) {
    return descriptionMap[pathname];
  }

  return `Learn more about ${generatePageTitle(pathname).toLowerCase()} and discover what we offer.`;
}

function generatePageKeywords(pathname: string): string[] {
  const keywordMap: Record<string, string[]> = {
    '/investors': ['investors', 'investment', 'funding', 'growth', 'financial'],
    '/about': ['about', 'company', 'team', 'mission', 'values'],
    '/contact': ['contact', 'support', 'help', 'inquiries', 'get in touch'],
    '/services': ['services', 'professional', 'solutions', 'consulting'],
    '/products': ['products', 'catalog', 'offerings', 'solutions'],
    '/blog': ['blog', 'news', 'insights', 'articles', 'updates'],
    '/privacy-policy': ['privacy', 'policy', 'data protection', 'GDPR'],
    '/terms-of-service': ['terms', 'service', 'agreement', 'legal'],
    '/cookie-policy': ['cookies', 'policy', 'privacy', 'tracking'],
  };

  return keywordMap[pathname] || ['page', 'information', 'company'];
}

// Generate SEO data for FAQ pages with FAQ structured data
async function generateFAQPageSEO(baseUrl: string, organizationId: string): Promise<SEOData> {
  const settings = await getSettings(baseUrl);
  const siteName = settings?.site || 'App';
  
  const canonicalUrl = `${baseUrl.replace(/\/$/, '')}/faq`;
  const pageTitle = 'Frequently Asked Questions';
  const pageDescription = 'Find answers to common questions and learn more about our services and products.';
  
  // Fetch all FAQs for the organization
  const { data: faqs, error: faqsError } = await supabaseServer
    .from('faq')
    .select('id, question, answer')
    .eq('organization_id', organizationId)
    .order('order', { ascending: true });

  const validFAQs = isFAQArray(faqs) ? faqs.filter(isValidFAQ) : [];

  const seoData: SEOData = {
    title: `${pageTitle} | ${siteName}`,
    description: pageDescription,
    keywords: ['FAQ', 'questions', 'answers', 'help', 'support'],
    canonicalUrl,
    seo_og_image: settings?.seo_og_image ?? undefined,
    seo_og_url: canonicalUrl,
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: pageTitle,
        description: pageDescription,
        url: canonicalUrl,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: getBreadcrumbStructuredData({
          pathname: '/faq',
          domain: baseUrl,
          overrides: [{ segment: 'faq', label: 'FAQ' }],
          extraCrumbs: [],
        }),
      }
    ],
    faqs: validFAQs,
  };

  // Add FAQ structured data if we have FAQs
  if (validFAQs.length > 0) {
    seoData.structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: validFAQs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer.replace(/\n/g, ' ').replace(/<[^>]*>/g, '').trim(),
        },
      })),
    });
  }

  console.log('[generateFAQPageSEO] Generated FAQ page SEO with', validFAQs.length, 'FAQs');
  return seoData;
}

// Generate SEO data for blog posts with Article structured data
async function generateBlogPostSEO(post: any, baseUrl: string, organizationId: string, pathname: string): Promise<SEOData> {
  const settings = await getSettings(baseUrl);
  const siteName = settings?.site || 'App';
  const currentDomain = settings?.domain ? `https://${settings.domain}` : baseUrl;
  
  // Decode pathname for human-readable URLs in structured data
  let decodedPathname = pathname;
  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch (error) {
    console.warn('[generateBlogPostSEO] Failed to decode pathname:', pathname, error);
    decodedPathname = pathname;
  }
  
  const canonicalUrl = `${currentDomain}${pathname}`;
  const structuredDataUrl = `${currentDomain}${decodedPathname}`;
  const pageTitle = post.title || 'Blog Post';
  const pageDescription = post.description || `Learn about ${post.title.toLowerCase()}`;
  
  // Generate Article JSON-LD structured data
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": pageDescription,
    "url": structuredDataUrl,
    "datePublished": post.created_on,
    "dateModified": post.last_modified,
    "author": post.is_company_author ? {
      "@type": "Organization",
      "name": siteName,
      "url": currentDomain
    } : {
      "@type": "Person", 
      "name": post.author ? `${post.author.first_name} ${post.author.last_name}` : "Author",
      "url": `${currentDomain}/about-us`
    },
    "publisher": {
      "@type": "Organization",
      "name": siteName,
      "url": currentDomain,
      "logo": {
        "@type": "ImageObject",
        "url": settings?.image || `${currentDomain}/images/logo.svg`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": structuredDataUrl
    },
    "image": post.main_photo || post.additional_photo || `${currentDomain}/images/default-article.jpg`,
    "articleSection": post.section || "General",
    "keywords": post.keywords || post.title,
    "wordCount": post.content ? post.content.replace(/<[^>]*>/g, '').split(/\s+/).length : 0,
    "inLanguage": "en"
  };

  const seoData: SEOData = {
    title: `${pageTitle} | ${siteName}`,
    description: pageDescription,
    keywords: post.keywords ? [post.keywords] : [post.title],
    canonicalUrl,
    seo_og_image: post.main_photo || post.additional_photo || settings?.seo_og_image,
    seo_og_url: canonicalUrl,
    // Article-specific OpenGraph metadata
    articlePublishedTime: post.created_on,
    articleModifiedTime: post.last_modified,
    articleAuthor: post.is_company_author 
      ? siteName 
      : (post.author ? `${post.author.first_name} ${post.author.last_name}` : 'Author'),
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: pageTitle,
        description: pageDescription,
        url: structuredDataUrl,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: getBreadcrumbStructuredData({
          pathname,
          domain: baseUrl,
          overrides: [{ segment: pathname.replace(/^\//, ''), label: pageTitle }],
          extraCrumbs: [],
        }),
      },
      articleJsonLd // Add the Article structured data
    ],
    faqs: [],
  };

  // Add FAQ structured data for this blog post if available
  const pageFAQs = await addFAQStructuredData(organizationId, seoData.structuredData, pathname, []);
  seoData.faqs = pageFAQs;

  console.log('[generateBlogPostSEO] Generated blog post SEO with Article structured data for:', pageTitle);
  return seoData;
}

export async function fetchProductSEOData(slug: string, baseUrl: string): Promise<SEOData> {
  try {
    const organizationId = await getOrganizationId(baseUrl);
    // console.log('[fetchProductSEOData] Base URL:', baseUrl, 'Organization ID:', organizationId, 'Product Slug:', slug);
    if (!organizationId) {
      console.error('[fetchProductSEOData] Organization not found');
      return await fetchDefaultSEOData(baseUrl, `/products/${slug}`);
    }

    const [settings, { data: product, error: productError }] = await Promise.all([
      getSettings(baseUrl),
      supabaseServer
        .from('product')
        .select(`
          id,
          slug,
          product_name,
          product_description,
          metadescription_for_page,
          links_to_image,
          price_manual,
          currency_manual,
          product_sub_type_id,
          organization_id
        `)
        .eq('slug', slug)
        .eq('organization_id', organizationId)
        .single(),
    ]);

    if (productError || !product) {
      console.error('[fetchProductSEOData] Error fetching product:', productError?.message || 'No product found', 'slug:', slug, 'organization_id:', organizationId);
      return await fetchDefaultSEOData(baseUrl, `/products/${slug}`);
    }

    // console.log('[fetchProductSEOData] Product found:', product.product_name);

    const tenantKeywords = settings?.seo_keywords
      ? Array.isArray(settings.seo_keywords)
        ? settings.seo_keywords
        : settings.seo_keywords.split(',').map((k: string) => k.trim())
      : [];

    const canonicalUrl = `${baseUrl.replace(/\/$/, '')}/products/${product.slug || product.id}`;
    const description = product.metadescription_for_page
      ? product.metadescription_for_page.slice(0, 160)
      : product.product_description
      ? product.product_description.replace(/<[^>]+>/g, '').slice(0, 160)
      : `Explore ${product.product_name} at ${settings?.site || 'our site'}.`;

    const seoData: SEOData = {
      title: `${product.product_name} | ${settings?.site || 'App'}`,
      description,
      keywords: [...new Set([product.product_name, `buy ${product.product_name}`, ...tenantKeywords])],
      canonicalUrl,
      seo_og_image: product.links_to_image ?? settings?.seo_og_image ?? '/default-og-image.jpg',
      seo_og_url: canonicalUrl,
      structuredData: [],
      faqs: [],
    };

    // Batch fetch related data
    const [faqsResult, reviewsResult, videosResult, courseResult, articlesResult] = await Promise.all([
      supabaseServer
        .from('faq')
        .select('id, question, answer')
        .eq('product_sub_type_id', product.product_sub_type_id || 0)
        .eq('organization_id', organizationId),
      supabaseServer
        .from('feedback_feedbackproducts')
        .select('id, rating, comment, user_name')
        .or(`product_id.eq.${product.id},product_id.eq.0`)
        .eq('organization_id', organizationId),
      supabaseServer
        .from('product_media')
        .select('id, video_url, thumbnail_url, title:name, description')
        .eq('product_id', product.id)
        .eq('is_video', true)
        .eq('organization_id', organizationId),
      supabaseServer
        .from('edu_pro_course')
        .select('id, title, description, provider_name')
        .eq('product_id', product.id)
        .eq('organization_id', organizationId)
        .single(),
      supabaseServer
        .from('blog_post')
        .select('id, title, content, created_on, author_name')
        .eq('organization_id', organizationId)
        .eq('product_id', product.id),
    ]);

    // Process FAQs - store them for later use in centralized FAQ system
    if (!faqsResult.error && isFAQArray(faqsResult.data)) {
      // Set initial FAQ data for backward compatibility
      seoData.faqs = faqsResult.data.filter(isValidFAQ);
      // console.log('[fetchProductSEOData] FAQs fetched:', seoData.faqs.length);
    } else if (faqsResult.error) {
      console.error('[fetchProductSEOData] Error fetching FAQs:', faqsResult.error.message);
      seoData.faqs = [];
    } else {
      seoData.faqs = [];
    }

    // Process structured data - add BreadcrumbList first
    seoData.structuredData.push(
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: getBreadcrumbStructuredData({
          pathname: `/products/${product.slug || product.id}`,
          domain: baseUrl,
          overrides: [{ segment: (product.slug || product.id).toString(), label: product.product_name }],
          extraCrumbs: [],
        }),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.product_name,
        description: description,
        image: product.links_to_image || undefined,
        sku: product.id.toString(),
        offers: product.price_manual && product.currency_manual
          ? {
              '@type': 'Offer',
              price: product.price_manual,
              priceCurrency: product.currency_manual,
              availability: 'https://schema.org/InStock',
              priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Valid for 1 year
              hasMerchantReturnPolicy: {
                '@type': 'MerchantReturnPolicy',
                returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
                merchantReturnDays: 30,
                returnMethod: 'https://schema.org/ReturnByMail',
                returnFees: 'https://schema.org/FreeReturn',
                applicableCountry: ['US', 'GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'SE', 'DK', 'NO', 'FI']
              },
              shippingDetails: {
                '@type': 'OfferShippingDetails',
                shippingRate: {
                  '@type': 'MonetaryAmount',
                  value: '0',
                  currency: product.currency_manual
                },
                shippingDestination: {
                  '@type': 'DefinedRegion',
                  addressCountry: 'US'
                },
                deliveryTime: {
                  '@type': 'ShippingDeliveryTime',
                  handlingTime: {
                    '@type': 'QuantitativeValue',
                    minValue: 1,
                    maxValue: 3,
                    unitCode: 'DAY'
                  },
                  transitTime: {
                    '@type': 'QuantitativeValue',
                    minValue: 3,
                    maxValue: 7,
                    unitCode: 'DAY'
                  }
                }
              }
            }
          : undefined,
        ...(isReviewArray(reviewsResult.data) && reviewsResult.data.length > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: parseFloat(
                  (
                    reviewsResult.data.reduce((sum: number, r: Review) => sum + (r.rating ?? 0), 0) / reviewsResult.data.length
                  ).toFixed(1)
                ),
                reviewCount: reviewsResult.data.length,
              },
              review: reviewsResult.data.map((review: Review) => ({
                '@type': 'Review',
                reviewRating: {
                  '@type': 'Rating',
                  ratingValue: review.rating ?? 0,
                },
                author: { '@type': 'Person', name: review.user_name ?? 'Anonymous' },
                reviewBody: review.comment ?? '',
              }))
            }
          : {}), // No reviews: omit aggregateRating and review fields entirely
      }
    );

    // Convert FAQ data to the expected format and add using centralized function
    const productFAQs: { question: string; answer: string }[] = [];
    if (isFAQArray(faqsResult.data) && faqsResult.data.length > 0) {
      faqsResult.data
        .filter(isValidFAQ)
        .forEach((faq) => {
          if (faq.question && faq.answer) {
            productFAQs.push({
              question: faq.question,
              answer: faq.answer
            });
          }
        });
    }

    // Add FAQ structured data using centralized function to prevent duplication
    const finalFAQs = await addFAQStructuredData(
      product.organization_id, 
      seoData.structuredData, 
      `/products/${product.slug || product.id}`,
      productFAQs
    );

    // Update the final FAQ list in seoData
    seoData.faqs = finalFAQs;

    if (isVideoArray(videosResult.data) && videosResult.data.length > 0) {
      videosResult.data
        .filter(isValidVideo)
        .forEach((video) => {
          seoData.structuredData.push({
            '@context': 'https://schema.org',
            '@type': 'VideoObject',
            name: video.title,
            description: video.description,
            thumbnailUrl: video.thumbnail_url || undefined,
            contentUrl: video.video_url,
            uploadDate: new Date().toISOString(),
          });
        });
    }

    if (isValidCourse(courseResult.data)) {
      seoData.structuredData.push({
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: courseResult.data.title,
        description: courseResult.data.description,
        provider: {
          '@type': 'Organization',
          name: courseResult.data.provider_name,
        },
      });
    }

    if (isArticleArray(articlesResult.data) && articlesResult.data.length > 0) {
      articlesResult.data
        .filter(isValidArticle)
        .forEach((article) => {
          seoData.structuredData.push({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title,
            articleBody: article.content.replace(/<[^>]+>/g, '').slice(0, 200),
            datePublished: article.created_on,
            author: {
              '@type': 'Person',
              name: article.author_name,
            },
          });
        });
    }

    // Add final WebPage structured data
    seoData.structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: product.product_name,
      description: description,
      url: canonicalUrl,
    });

    // console.log('[fetchProductSEOData] Structured data entries:', seoData.structuredData.length);
    return seoData;
  } catch (error: any) {
    console.error('[fetchProductSEOData] Failed to fetch product SEO data:', error.message);
    return await fetchDefaultSEOData(baseUrl, `/products/${slug}`);
  }
}

export async function fetchProductsListingSEOData(baseUrl: string, categoryId?: string): Promise<SEOData> {
  try {
    // console.log('🚀 [fetchProductsListingSEOData] Starting function execution');
    const organizationId = await getOrganizationId(baseUrl);
    // console.log('[fetchProductsListingSEOData] Base URL:', baseUrl, 'Organization ID:', organizationId, 'Category ID:', categoryId);

    if (!organizationId) {
      console.error('[fetchProductsListingSEOData] Organization not found');
      return await fetchDefaultSEOData(baseUrl, '/products');
    }

    // Fetch products with reviews
    let productsQuery = supabase
      .from('product')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_displayed', true);

    // Filter by category if provided
    if (categoryId) {
      productsQuery = productsQuery.or(`product_sub_type_id.eq.${categoryId},product_sub_type_additional_id.eq.${categoryId}`);
    }

    const { data: products, error: productsError } = await productsQuery
      .order('order', { ascending: true })
      .limit(50); // Limit to reasonable number for structured data

    if (productsError) {
      console.error('[fetchProductsListingSEOData] Error fetching products:', productsError.message);
      return await fetchDefaultSEOData(baseUrl, '/products');
    }

    // Fetch reviews for all products including global reviews (product_id = 0)
    const productIds = products?.map(p => p.id) || [];
    const allProductIds = [...productIds, 0]; // Include 0 for global reviews
    const { data: reviews } = await supabase
      .from('feedback_feedbackproducts')
      .select('*')
      .in('product_id', allProductIds);

    // Group reviews by product, and add global reviews to each product
    const globalReviews = reviews?.filter(r => r.product_id === 0) || [];
    const reviewsByProduct = reviews?.reduce((acc: any, review: any) => {
      if (review.product_id === 0) return acc; // Handle global reviews separately
      if (!acc[review.product_id]) acc[review.product_id] = [];
      acc[review.product_id].push(review);
      return acc;
    }, {}) || {};

    // Add global reviews to each product
    productIds.forEach(productId => {
      if (!reviewsByProduct[productId]) reviewsByProduct[productId] = [];
      reviewsByProduct[productId].push(...globalReviews);
    });

    // Generate SEO data
    const canonicalUrl = `${baseUrl.replace(/\/$/, '')}/products${categoryId ? `?category=${categoryId}` : ''}`;
    const pageTitle = categoryId ? `Product Category - ${categoryId}` : 'All Products';
    const pageDescription = `Browse our ${categoryId ? 'category-specific' : 'complete'} product catalog with ${products?.length || 0} available products.`;

    const seoData: SEOData = {
      title: pageTitle,
      description: pageDescription,
      keywords: ['products', 'catalog', 'shop', 'browse', 'collection'],
      canonicalUrl,
      seo_og_image: products?.find(p => p.links_to_image)?.links_to_image || undefined,
      seo_og_url: canonicalUrl,
      structuredData: [],
      faqs: [],
    };

    // Add structured data for each product
    let validProducts: any[] = [];
    let allValidProducts: any[] = [];
    if (products && products.length > 0) {
      // console.log(`[fetchProductsListingSEOData] Processing ${products.length} total products`);

      // Filter products to only include those suitable for JSON-LD
      validProducts = products.filter((product: any) => {
        // Check if product has minimum required data for Google-compliant JSON-LD
        const hasBasicInfo = product.product_name && product.product_name.trim() !== '';
        const hasValidPrice = product.price_manual && product.currency_manual;
        const productReviews = reviewsByProduct[product.id] || [];
        const hasValidReviews = productReviews.some((review: any) => 
          review && typeof review.rating === 'number' && review.rating > 0 && review.rating <= 5
        );
        
        // Include product if it has either valid pricing OR valid reviews
        const isValid = hasBasicInfo && (hasValidPrice || hasValidReviews);
        
        if (!isValid) {
          console.log(`[fetchProductsListingSEOData] Excluding product "${product.product_name}" from JSON-LD: hasBasicInfo=${hasBasicInfo}, hasValidPrice=${hasValidPrice}, hasValidReviews=${hasValidReviews}`);
        }
        
        return isValid;
      });

      // Include all valid products in JSON-LD
      allValidProducts = validProducts;
      
      // console.log(`[fetchProductsListingSEOData] Including ${allValidProducts.length} valid products out of ${products.length} total products in JSON-LD`);

      allValidProducts.forEach((product: any) => {
        const productReviews = reviewsByProduct[product.id] || [];
        
        // Filter to get only valid reviews with proper ratings
        const validReviews = productReviews.filter((review: any) => 
          review && typeof review.rating === 'number' && review.rating > 0 && review.rating <= 5
        );
        
        // Only use actual reviews if available
        const hasValidReviews = validReviews.length > 0;
        let avgRating: number | undefined;
        let reviewCount: number | undefined;
        let reviewsToDisplay: any[] = [];
        
        if (hasValidReviews) {
          // Calculate rating from actual valid reviews
          avgRating = parseFloat((validReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / validReviews.length).toFixed(1));
          reviewCount = validReviews.length;
          reviewsToDisplay = validReviews;
          // console.log(`[fetchProductsListingSEOData] Product "${product.product_name}" has ${reviewCount} valid reviews, avg rating: ${avgRating}`);
        } else {
          console.log(`[fetchProductsListingSEOData] Product "${product.product_name}" has no reviews, omitting rating data`);
        }

        const productUrl = `${baseUrl.replace(/\/$/, '')}/products/${product.slug || product.id}`;
        
        const productStructuredData: any = {
          '@context': 'https://schema.org',
          '@type': 'Product',
          '@id': `${productUrl}#product`,
          name: product.product_name || 'Product',
          description: `High-quality ${product.product_name || 'product'} available in our catalog.`,
          sku: product.id.toString(),
          url: productUrl,
          ...(hasValidReviews && avgRating && reviewCount ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: Number(avgRating),
              reviewCount: Number(reviewCount),
            },
            review: reviewsToDisplay.map((review: any) => ({
              '@type': 'Review',
              reviewRating: {
                '@type': 'Rating',
                ratingValue: review.rating,
              },
              author: { '@type': 'Person', name: review.user_name || 'Anonymous' },
              reviewBody: review.comment || '',
            }))
          } : {}), // No reviews: omit aggregateRating and review fields
        };

        // Add image if available
        if (product.links_to_image) {
          productStructuredData.image = product.links_to_image;
        }

        // Add offers only if we have valid pricing data
        if (product.price_manual && product.currency_manual) {
          productStructuredData.offers = {
            '@type': 'Offer',
            price: product.price_manual,
            priceCurrency: product.currency_manual,
            availability: 'https://schema.org/InStock',
            priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            hasMerchantReturnPolicy: {
              '@type': 'MerchantReturnPolicy',
              returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
              merchantReturnDays: 30,
              returnMethod: 'https://schema.org/ReturnByMail',
              returnFees: 'https://schema.org/FreeReturn',
              applicableCountry: ['US', 'GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'SE', 'DK', 'NO', 'FI']
            },
            shippingDetails: {
              '@type': 'OfferShippingDetails',
              shippingRate: {
                '@type': 'MonetaryAmount',
                value: '0',
                currency: product.currency_manual
              },
              shippingDestination: {
                '@type': 'DefinedRegion',
                addressCountry: 'US'
              },
              deliveryTime: {
                '@type': 'ShippingDeliveryTime',
                handlingTime: {
                  '@type': 'QuantitativeValue',
                  minValue: 1,
                  maxValue: 3,
                  unitCode: 'DAY'
                },
                transitTime: {
                  '@type': 'QuantitativeValue',
                  minValue: 3,
                  maxValue: 7,
                  unitCode: 'DAY'
                }
              }
            }
          };
        }

        seoData.structuredData.push(productStructuredData);
      });

      // Add ItemList structured data for valid products only
      if (validProducts.length > 0) {
        seoData.structuredData.push({
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          '@id': `${baseUrl.replace(/\/$/, '')}/products#itemlist`,
          numberOfItems: allValidProducts.length,
          itemListElement: allValidProducts.map((product: any, index: number) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'Product',
              name: product.product_name || 'Product',
              url: `${baseUrl.replace(/\/$/, '')}/products/${product.slug || product.id}`,
              image: product.links_to_image || undefined,
            }
          }))
        });
      }
    }

    // Add breadcrumb structured data
    seoData.structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Products',
          item: canonicalUrl
        }
      ]
    });

    // console.log(`🎯 [fetchProductsListingSEOData] Generated SEO data with ${allValidProducts?.length || 0} products in JSON-LD`);
    // console.log(`📊 [fetchProductsListingSEOData] Final structured data count: ${seoData.structuredData.length}`);
    return seoData;
  } catch (error: any) {
    console.error('[fetchProductsListingSEOData] Failed to fetch products listing SEO data:', error.message);
    return await fetchDefaultSEOData(baseUrl, '/products');
  }
}

export async function fetchDefaultSEOData(baseUrl: string, pathname: string): Promise<SEOData> {
  try {
    const [settings, organizationId] = await Promise.all([
      getSettings(baseUrl),
      getOrganizationId(baseUrl),
    ]);

    const canonicalUrl = `${baseUrl.replace(/\/$/, '')}${pathname || '/'}`;
    const structuredData: Array<Record<string, any>> = [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: settings?.site || 'App',
        description: settings?.seo_description || 'Discover our products and services.',
        url: canonicalUrl,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: getBreadcrumbStructuredData({
          pathname,
          domain: baseUrl,
          overrides: [],
          extraCrumbs: [],
        }),
      }
    ];

    // Add FAQ structured data using the centralized function
    let siteFaqs: { question: string; answer: string }[] = [];
    if (organizationId) {
      siteFaqs = await addFAQStructuredData(organizationId, structuredData, pathname, []);
    }

    const seoData: SEOData = {
      title: settings?.seo_title || settings?.site || 'App',
      description: settings?.seo_description || 'Discover our products and services.',
      keywords: settings?.seo_keywords
        ? Array.isArray(settings.seo_keywords)
          ? settings.seo_keywords
          : settings.seo_keywords.split(',').map((k: string) => k.trim())
        : ['app', 'products', 'services'],
      canonicalUrl,
      seo_og_image: settings?.seo_og_image ?? '/default-og-image.jpg',
      seo_og_url: canonicalUrl,
      structuredData,
      faqs: siteFaqs,
    };

    console.log('[fetchDefaultSEOData] Default SEO data fetched:', seoData.title);
    return seoData;
  } catch (error: any) {
    console.error('[fetchDefaultSEOData] Failed to fetch default SEO data:', error.message);
    const canonicalUrl = `${baseUrl.replace(/\/$/, '')}${pathname || '/'}`;
    return {
      title: 'App',
      description: 'Discover our products and services.',
      keywords: ['app', 'products', 'services'],
      canonicalUrl,
      seo_og_image: '/default-og-image.jpg',
      seo_og_url: canonicalUrl,
      structuredData: [],
      faqs: [],
    };
  }
}

// Function to fetch pricing modal products structured data for home page
async function fetchHomePageProductsStructuredData(baseUrl: string, organizationId: string): Promise<any[]> {
  try {
    // console.log(`[fetchHomePageProductsStructuredData] Fetching pricing modal products for organization: ${organizationId}`);
    
    // Fetch pricing modal products (products that are displayed in pricing comparison)
    const { data: products, error } = await supabaseServer
      .from('product')
      .select(`
        id,
        product_name,
        product_description,
        price_manual,
        currency_manual,
        currency_manual_symbol,
        background_color,
        slug,
        organization_id,
        is_displayed,
        is_in_pricingplan_comparison
      `)
      .eq('organization_id', organizationId)
      .eq('is_displayed', true)
      .eq('is_in_pricingplan_comparison', true)
      .order('id', { ascending: true });

    if (error) {
      console.error('[fetchHomePageProductsStructuredData] Error fetching products:', error);
      return [];
    }

    if (!products || products.length === 0) {
      // console.log('[fetchHomePageProductsStructuredData] No pricing modal products found');
      return [];
    }

    // console.log(`[fetchHomePageProductsStructuredData] Found ${products.length} pricing modal products`);

    const structuredData = [];
    const canonicalBaseUrl = baseUrl.replace(/\/$/, '');

    // Get settings for site information
    const settings = await getSettings(baseUrl);

    // Create structured data for each product
    for (const product of products) {
      try {
        // Generate actual product URL using slug
        const productPricingUrl = `${canonicalBaseUrl}/products/${product.slug || product.id}`;
        
        // Basic product structured data with pricing modal URL
        const productSchema: any = {
          '@context': 'https://schema.org',
          '@type': 'Product',
          '@id': `${canonicalBaseUrl}/products/${product.id}#product`,
          name: product.product_name || 'Product',
          url: productPricingUrl, // Point to pricing modal instead of product page
        };

        // Add description if available
        if (product.product_description) {
          productSchema.description = product.product_description;
        }

        // Add critical image field for Merchant Listings
        productSchema.image = settings?.seo_og_image || `${canonicalBaseUrl}/images/logo.svg`;

        // Note: aggregateRating and review are omitted for pricing modal products
        // These should only be added if real customer reviews exist
        // TODO: Fetch actual reviews from database if needed for homepage products

        // Add pricing information if available
        if (product.price_manual && product.price_manual > 0) {
          const currency = product.currency_manual || 'USD';
          
          productSchema.offers = {
            '@type': 'Offer',
            price: Number(product.price_manual).toFixed(2), // Convert to number first, then format
            priceCurrency: currency,
            availability: 'https://schema.org/InStock',
            url: productPricingUrl, // Use the same pricing modal URL
            priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Valid for 1 year
            hasMerchantReturnPolicy: {
              '@type': 'MerchantReturnPolicy',
              returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
              merchantReturnDays: 30,
              returnMethod: 'https://schema.org/ReturnByMail',
              returnFees: 'https://schema.org/FreeReturn',
              applicableCountry: ['US', 'GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'SE', 'DK', 'NO', 'FI']
            },
            shippingDetails: {
              '@type': 'OfferShippingDetails',
              shippingRate: {
                '@type': 'MonetaryAmount',
                value: '0',
                currency: currency
              },
              shippingDestination: [
                {
                  '@type': 'DefinedRegion',
                  addressCountry: 'US'
                },
                {
                  '@type': 'DefinedRegion',
                  addressCountry: 'GB'
                },
                {
                  '@type': 'DefinedRegion',
                  addressCountry: 'DE'
                }
              ],
              deliveryTime: {
                '@type': 'ShippingDeliveryTime',
                handlingTime: {
                  '@type': 'QuantitativeValue',
                  minValue: 1,
                  maxValue: 3,
                  unitCode: 'DAY'
                },
                transitTime: {
                  '@type': 'QuantitativeValue',
                  minValue: 3,
                  maxValue: 7,
                  unitCode: 'DAY'
                }
              }
            }
          };
        }

        // Add brand information only if not already present (avoid duplicate)
        if (settings?.site && !productSchema.brand) {
          productSchema.brand = {
            '@type': 'Brand',
            name: settings.site,
          };
        }

        structuredData.push(productSchema);
        
        // console.log(`[fetchHomePageProductsStructuredData] Added structured data for product: ${product.product_name}`);
      } catch (productError) {
        console.error(`[fetchHomePageProductsStructuredData] Error processing product ${product.id}:`, productError);
        // Continue processing other products
      }
    }

    // Add ItemList for all pricing modal products
    if (structuredData.length > 0) {
      // Use consistent image across all items for carousel (Google requirement)
      const consistentImage = settings?.seo_og_image || `${canonicalBaseUrl}/images/logo.svg`;
      
      const itemListSchema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        '@id': `${canonicalBaseUrl}/#pricing-products`,
        name: 'Pricing Plans',
        description: 'Available pricing plans and products',
        numberOfItems: structuredData.length,
        itemListElement: structuredData.map((product: any, index: number) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Product',
            '@id': product['@id'],
            name: product.name,
            url: product.url, // This will be the pricing modal URL
            image: consistentImage, // Same image for all carousel items (Google requirement)
            // Include offers to make valid Product snippet
            offers: product.offers,
          },
        })),
      };

      structuredData.push(itemListSchema);
      // console.log(`[fetchHomePageProductsStructuredData] Added ItemList for ${structuredData.length - 1} pricing modal products`);
    }

    // console.log(`�� [fetchHomePageProductsStructuredData] Generated ${structuredData.length} structured data items for home page pricing products`);
    return structuredData;
  } catch (error: any) {
    console.error('[fetchHomePageProductsStructuredData] Failed to fetch home page products structured data:', error.message);
    return [];
  }
}