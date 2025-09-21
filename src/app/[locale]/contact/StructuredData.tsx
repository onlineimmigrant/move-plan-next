import { headers } from 'next/headers';

export default function ContactStructuredData() {
  const headersList = headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;

  const webPageData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Contact Us - MetExam",
    "description": "Get in touch with us for any questions or inquiries about our services.",
    "url": `${baseUrl}/contact`,
    "inLanguage": "en-US",
    "isPartOf": {
      "@type": "WebSite",
      "name": "MetExam",
      "url": baseUrl
    }
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": `${baseUrl}/`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Contact Us"
      }
    ]
  };

  const contactPageData = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact MetExam",
    "description": "Get in touch with us for any questions or inquiries.",
    "url": `${baseUrl}/contact`,
    "mainEntity": {
      "@type": "Organization",
      "name": "MetExam",
      "url": baseUrl
    }
  };

  return (
    <>
      <script
        id="contact-webpage-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageData, null, 2)
        }}
      />
      
      <script
        id="contact-breadcrumb-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData, null, 2)
        }}
      />
      
      <script
        id="contact-page-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(contactPageData, null, 2)
        }}
      />
    </>
  );
}
