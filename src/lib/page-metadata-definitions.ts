// Page-specific metadata definitions - saved for future use
// This file contains the page metadata structure that was removed from layout.tsx

export interface PageMetadata {
  title: string;
  description: string;
  keywords: string[];
  robots?: string;
  openGraph?: {
    title?: string;
    description?: string;
    type?: string;
    images?: Array<{
      url: string;
      width?: number;
      height?: number;
      alt?: string;
    }>;
  };
  twitter?: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
  };
}

export const pageMetadataDefinitions: Record<string, PageMetadata> = {
  '/': {
    title: 'Home',
    description: 'Welcome to our platform. Discover our products and services.',
    keywords: ['home', 'products', 'services']
  },
  '/investors': {
    title: 'Investors',
    description: 'Discover investment opportunities and learn about our growth potential and financial performance.',
    keywords: ['investors', 'investment', 'funding', 'growth', 'financial', 'opportunities']
  },
  '/about': {
    title: 'About Us',
    description: 'Learn more about our company, our mission, values, and the team behind our success.',
    keywords: ['about', 'company', 'team', 'mission', 'values', 'history']
  },
  '/contact': {
    title: 'Contact Us',
    description: 'Get in touch with us for any questions, support, or business inquiries.',
    keywords: ['contact', 'support', 'help', 'inquiries', 'get in touch', 'customer service']
  },
  '/services': {
    title: 'Our Services',
    description: 'Explore our comprehensive range of professional services and solutions.',
    keywords: ['services', 'professional', 'solutions', 'consulting', 'expertise']
  },
  '/products': {
    title: 'Products',
    description: 'Browse our complete product catalog and discover our latest offerings.',
    keywords: ['products', 'catalog', 'offerings', 'solutions', 'browse']
  },
  '/blog': {
    title: 'Blog',
    description: 'Read our latest insights, news, and industry updates on our blog.',
    keywords: ['blog', 'news', 'insights', 'articles', 'updates', 'industry']
  },
  '/privacy-policy': {
    title: 'Privacy Policy',
    description: 'Read our privacy policy to understand how we protect and handle your personal data.',
    keywords: ['privacy', 'policy', 'data protection', 'GDPR', 'personal data']
  },
  '/terms-of-service': {
    title: 'Terms of Service',
    description: 'Review our terms of service and user agreement for using our platform.',
    keywords: ['terms', 'service', 'agreement', 'legal', 'user agreement']
  },
  '/cookie-policy': {
    title: 'Cookie Policy',
    description: 'Learn about our cookie usage and privacy practices for our website.',
    keywords: ['cookies', 'policy', 'privacy', 'tracking', 'website']
  }
};

// Helper function for dynamic routes
export function generateDynamicPageMetadata(pathname: string, siteName: string): PageMetadata {
  // Handle dynamic routes (like /products/123)
  if (pathname.startsWith('/products/')) {
    const productId = pathname.split('/')[2];
    return {
      title: `Product ${productId}`,
      description: `Discover product details and features for ${productId}.`,
      keywords: ['product', productId, 'details', 'features', 'buy']
    };
  }

  // Fallback for unknown pages
  const pageName = pathname.split('/').filter(Boolean).pop() || 'page';
  const formattedName = pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/-/g, ' ');
  
  return {
    title: formattedName,
    description: `Learn more about ${formattedName.toLowerCase()}.`,
    keywords: [formattedName.toLowerCase(), 'information']
  };
}
