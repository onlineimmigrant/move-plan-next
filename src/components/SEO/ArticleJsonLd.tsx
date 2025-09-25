import Script from 'next/script';

interface ArticleJsonLdProps {
  post: {
    id: string;
    slug: string;
    title: string;
    description: string;
    created_on: string;
    last_modified: string;
    is_company_author: boolean;
    author?: { first_name: string; last_name: string };
    main_photo?: string;
    additional_photo?: string;
    section?: string;
    keywords?: string;
    content: string;
  };
  currentDomain: string;
  siteName: string;
  siteImage?: string;
  locale?: string;
}

export default function ArticleJsonLd({ 
  post, 
  currentDomain, 
  siteName, 
  siteImage,
  locale = 'en' 
}: ArticleJsonLdProps) {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.description || `Learn about ${post.title.toLowerCase()}`,
    "url": `${currentDomain}/${post.slug}`,
    "datePublished": post.created_on,
    "dateModified": post.last_modified,
    "author": post.is_company_author ? {
      "@type": "Organization",
      "name": siteName,
      "url": currentDomain
    } : {
      "@type": "Person", 
      "name": post.author ? `${post.author.first_name} ${post.author.last_name}` : "Author"
    },
    "publisher": {
      "@type": "Organization",
      "name": siteName,
      "url": currentDomain,
      "logo": {
        "@type": "ImageObject",
        "url": siteImage || `${currentDomain}/images/logo.svg`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${currentDomain}/${post.slug}`
    },
    "image": post.main_photo || post.additional_photo || `${currentDomain}/images/default-article.jpg`,
    "articleSection": post.section || "General",
    "keywords": post.keywords || post.title,
    "wordCount": post.content ? post.content.replace(/<[^>]*>/g, '').split(/\s+/).length : 0,
    "inLanguage": locale
  };

  return (
    <Script
      id={`article-jsonld-${post.id}`}
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(articleJsonLd, null, 0)
      }}
    />
  );
}
