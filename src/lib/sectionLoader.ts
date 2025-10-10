// Helper functions for lazy-loading modal sections

export async function loadSection(
  section: string,
  orgId: string,
  sessionToken: string
): Promise<any> {
  console.log(`📥 Loading section: ${section} for org: ${orgId}`);

  const response = await fetch(`/api/organizations/${orgId}/sections/${section}`, {
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${section} data: ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`✅ Section ${section} loaded:`, Object.keys(data));

  return data;
}

export function mergeSectionIntoSettings(
  section: string,
  sectionData: any,
  currentSettings: any
): any {
  // Merge section data into settings based on section type
  switch (section) {
    case 'general':
      return {
        ...currentSettings,
        ...sectionData.settings
      };
    
    case 'hero':
      return {
        ...currentSettings,
        ...sectionData.website_hero
      };
    
    case 'products':
      return {
        ...currentSettings,
        products: sectionData.products || [],
        pricing_plans: sectionData.pricing_plans || []
      };
    
    case 'features':
      return {
        ...currentSettings,
        features: sectionData.features || []
      };
    
    case 'faqs':
      return {
        ...currentSettings,
        faqs: sectionData.faqs || []
      };
    
    case 'banners':
      return {
        ...currentSettings,
        banners: sectionData.banners || []
      };
    
    case 'menu':
      return {
        ...currentSettings,
        menu_items: sectionData.menu_items || [],
        submenu_items: sectionData.submenu_items || []
      };
    
    case 'blog':
      return {
        ...currentSettings,
        blog_posts: sectionData.blog_posts || []
      };
    
    case 'cookies':
      return {
        ...currentSettings,
        cookie_categories: sectionData.cookie_categories || [],
        cookie_services: sectionData.cookie_services || []
      };
    
    default:
      return currentSettings;
  }
}
