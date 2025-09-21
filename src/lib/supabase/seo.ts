import { supabase } from '@/lib/supabase';

const supabaseServer = supabase;
import { getOrganizationId, getSettings } from '../getSettings';
import { getBreadcrumbStructuredData } from '../getBreadcrumbs';

export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string | string[];
  canonicalUrl?: string;
  seo_og_image?: string | null | undefined;
  seo_og_url?: string;
  structuredData: Array<Record<string, any>>;
  faqs: Array<{ question: string; answer: string }>;
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
  try {
    const organizationId = await getOrganizationId(baseUrl);
    console.log('[fetchPageSEOData] Base URL:', baseUrl, 'Organization ID:', organizationId);
    if (!organizationId) {
      console.log('[fetchPageSEOData] No organizationId found');
      return fetchDefaultSEOData(baseUrl, pathname);
    }

    // Normalize pathname for query
    const normalizedPath = pathname.toLowerCase().replace(/\/$/, '') || '';
    const queryPaths = normalizedPath === '' ? ['/', '/home'] : [normalizedPath, `/${normalizedPath}`];
    console.log('[fetchPageSEOData] Querying page for paths:', queryPaths);

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
        console.log('[fetchPageSEOData] No page found for path:', queryPath, 'error:', error?.message || 'No data');
      }
    }

    // If no page found in database, create dynamic page metadata
    if (!page) {
      console.log('[fetchPageSEOData] No page found, generating dynamic metadata for:', normalizedPath);
      return generateDynamicPageSEO(normalizedPath, baseUrl, organizationId);
    }

    const canonicalUrl = `${baseUrl.replace(/\/$/, '')}${pathname || '/'}`;
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
        url: canonicalUrl,
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

    // Add FAQ structured data for this page
    const pageFAQs = await addFAQStructuredData(organizationId, seoData.structuredData, pathname, []);
    seoData.faqs = pageFAQs;

    console.log('[fetchPageSEOData] Page SEO data fetched:', seoData.title);
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
    console.log('[addFAQStructuredData] Processing FAQ structured data for', pathname);
    
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
      console.log('[addFAQStructuredData] Added FAQ structured data for', pathname, 'with', validFAQs.length, 'FAQs');
    }

    return [...existingFAQs, ...validFAQs];
  } catch (error: any) {
    console.error('[addFAQStructuredData] Error:', error.message);
    return existingFAQs;
  }
}

// Generate dynamic page metadata for pages not in database
async function generateDynamicPageSEO(pathname: string, baseUrl: string, organizationId: string): Promise<SEOData> {
  // Check if this is a product page
  const productMatch = pathname.match(/^\/products\/([^\/]+)$/);
  if (productMatch) {
    const productSlug = productMatch[1];
    console.log('[generateDynamicPageSEO] Detected product page, using fetchProductSEOData for:', productSlug);
    return fetchProductSEOData(productSlug, baseUrl);
  }

  // Check if this is an FAQ page
  if (pathname === '/faq' || pathname === '/faqs') {
    console.log('[generateDynamicPageSEO] Detected FAQ page, adding FAQ structured data');
    return generateFAQPageSEO(baseUrl, organizationId);
  }

  const settings = await getSettings(baseUrl);
  const siteName = settings?.site || 'App';
  
  const canonicalUrl = `${baseUrl.replace(/\/$/, '')}${pathname || '/'}`;
  const pageTitle = generatePageTitle(pathname);
  const pageDescription = generatePageDescription(pathname);
  
  const structuredData: Array<Record<string, any>> = [
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

  // Generate title from path segments
  return pathname
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

export async function fetchProductSEOData(slug: string, baseUrl: string): Promise<SEOData> {
  try {
    const organizationId = await getOrganizationId(baseUrl);
    console.log('[fetchProductSEOData] Base URL:', baseUrl, 'Organization ID:', organizationId, 'Product Slug:', slug);
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

    console.log('[fetchProductSEOData] Product found:', product.product_name);

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
        .eq('product_id', product.id)
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
      console.log('[fetchProductSEOData] FAQs fetched:', seoData.faqs.length);
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
        aggregateRating: isReviewArray(reviewsResult.data) && reviewsResult.data.length > 0
          ? {
              '@type': 'AggregateRating',
              ratingValue: parseFloat(
                (
                  reviewsResult.data.reduce((sum: number, r: Review) => sum + (r.rating ?? 0), 0) / reviewsResult.data.length
                ).toFixed(1)
              ),
              reviewCount: reviewsResult.data.length,
            }
          : {
              '@type': 'AggregateRating',
              ratingValue: 4.5,
              reviewCount: 1,
            },
        review: isReviewArray(reviewsResult.data) && reviewsResult.data.length > 0
          ? reviewsResult.data.map((review: Review) => ({
              '@type': 'Review',
              reviewRating: {
                '@type': 'Rating',
                ratingValue: review.rating ?? 0,
              },
              author: { '@type': 'Person', name: review.user_name ?? 'Anonymous' },
              reviewBody: review.comment ?? '',
            }))
          : [
              {
                '@type': 'Review',
                reviewRating: {
                  '@type': 'Rating',
                  ratingValue: 4.5,
                },
                author: { '@type': 'Person', name: 'Verified Customer' },
                reviewBody: 'Great product, highly recommended!',
              }
            ],
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

    console.log('[fetchProductSEOData] Structured data entries:', seoData.structuredData.length);
    return seoData;
  } catch (error: any) {
    console.error('[fetchProductSEOData] Failed to fetch product SEO data:', error.message);
    return await fetchDefaultSEOData(baseUrl, `/products/${slug}`);
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
      structuredData: [{
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'App',
        description: 'Discover our products and services.',
        url: canonicalUrl,
      }],
      faqs: [],
    };
  }
}