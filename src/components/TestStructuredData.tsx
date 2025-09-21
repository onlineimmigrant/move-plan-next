// Simple test structured data to verify the rendering system works
export default function TestStructuredData() {
  const testBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "http://localhost:3000/"
      },
      {
        "@type": "ListItem", 
        "position": 2,
        "name": "Test Page"
      }
    ]
  };

  const testWebPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Test Page",
    "description": "This is a test page for structured data validation",
    "url": "http://localhost:3000/test"
  };

  console.log('🧪 [TestStructuredData] Rendering test structured data');

  return (
    <>
      <script
        id="test-breadcrumb-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(testBreadcrumb, null, 2)
        }}
      />
      
      <script
        id="test-webpage-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(testWebPage, null, 2)
        }}
      />
    </>
  );
}
