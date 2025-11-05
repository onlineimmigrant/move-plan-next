import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logActivity } from '@/lib/activityLogger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Clone organization
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params before accessing properties
    const { id } = await params;
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the user's session
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = user.user.id;
    const sourceOrgId = id;

    console.log('Clone organization request for:', sourceOrgId, 'by user:', userId);

    // Get user's profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id, is_site_creator, email')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if user has site creation permissions
    if (!profile.is_site_creator) {
      return NextResponse.json({ error: 'User does not have site creation permissions' }, { status: 403 });
    }

    // Check if user's organization is 'platform' type
    if (!profile.organization_id) {
      return NextResponse.json({ error: 'User must belong to an organization' }, { status: 403 });
    }

    const { data: currentOrg, error: currentOrgError } = await supabase
      .from('organizations')
      .select('type')
      .eq('id', profile.organization_id)
      .single();

    if (currentOrgError || !currentOrg) {
      return NextResponse.json({ error: 'Could not verify organization' }, { status: 500 });
    }

    // Only platform/general organization users can clone
    if (currentOrg.type !== 'platform' && currentOrg.type !== 'general') {
      return NextResponse.json({ error: 'Only platform users can clone organizations' }, { status: 403 });
    }

    // Get the source organization to clone
    const { data: sourceOrg, error: sourceOrgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', sourceOrgId)
      .single();

    if (sourceOrgError || !sourceOrg) {
      return NextResponse.json({ error: 'Source organization not found' }, { status: 404 });
    }

    // Prevent cloning platform organizations
    if (sourceOrg.type === 'platform' || sourceOrg.type === 'general') {
      return NextResponse.json({ error: 'Cannot clone platform organizations' }, { status: 403 });
    }

    // Get the custom name from request body
    const body = await request.json().catch(() => ({}));
    const customName = body.customName;

    if (!customName || !customName.trim()) {
      return NextResponse.json({ error: 'Custom organization name is required' }, { status: 400 });
    }

    if (customName.length < 2 || customName.length > 50) {
      return NextResponse.json({ error: 'Organization name must be between 2 and 50 characters' }, { status: 400 });
    }

    // Use custom name instead of auto-generated name
    const cloneName = customName.trim();
    const timestamp = new Date().toISOString();

    // Find the next available port for local URL
    const { data: allOrgs, error: portError } = await supabase
      .from('organizations')
      .select('base_url_local')
      .order('created_at', { ascending: true });

    if (portError) {
      return NextResponse.json({ error: 'Error checking existing organizations' }, { status: 500 });
    }

    let nextPort = 3100;
    if (allOrgs && allOrgs.length > 0) {
      const usedPorts = allOrgs
        .map(org => {
          const match = org.base_url_local?.match(/:(\d+)/);
          return match ? parseInt(match[1]) : null;
        })
        .filter(port => port !== null)
        .sort((a, b) => a! - b!);

      if (usedPorts.length > 0) {
        nextPort = Math.max(...usedPorts as number[]) + 1;
      }
    }

    const baseUrlLocal = `http://localhost:${nextPort}`;

    // Create the cloned organization
    const { data: clonedOrg, error: cloneError } = await supabase
      .from('organizations')
      .insert([{
        name: cloneName,
        type: sourceOrg.type,
        created_by_email: profile.email,
        base_url: null, // Will be set when deployed
        base_url_local: baseUrlLocal,
        created_at: timestamp,
        is_sample: false, // Always set to false when cloning, even from sample organizations
        // Don't copy deployment-specific fields
        vercel_project_id: null,
        vercel_deployment_id: null,
        deployment_status: 'not_deployed'
      }])
      .select()
      .single();

    if (cloneError || !clonedOrg) {
      console.error('Error creating cloned organization:', cloneError);
      return NextResponse.json({ error: 'Failed to create cloned organization' }, { status: 500 });
    }

    console.log('Cloned organization created:', clonedOrg.id);

    // Clone related data comprehensively
    const cloneResults = {
      settings: false,
      hero: false,
      menuItems: false,
      banners: false,
      blogPosts: false,
      productSubTypes: false,
      products: false,
      features: false,
      faqs: false,
      websiteMenuItems: false,
      websiteSubmenuItems: false,
      templateSections: false,
      templateHeadingSections: false,
      pages: false,
      websiteBrands: false,
      pricingPlans: false,
      pricingPlanFeatures: false,
      inventory: false,
      pricingComparison: false,
      websiteMetrics: false,
      templateSectionMetrics: false
    };

    // Initialize ID mappings for cross-table relationships
    const productSubTypeIdMapping: { [key: number]: number } = {};
    const productIdMapping: { [key: number]: number } = {};
    const featureIdMapping: { [key: number]: number } = {};
    const menuItemIdMapping: { [key: string]: number } = {};
    const templateSectionIdMapping: { [key: number]: number } = {};
    const websiteMetricIdMapping: { [key: number]: number } = {};
    const pricingPlanIdMapping: { [key: number]: number } = {};

    try {
      // 1. Clone settings
      console.log('Cloning settings for source org:', sourceOrgId);
      const { data: sourceSettings, error: settingsError } = await supabase
        .from('settings')
        .select('*')
        .eq('organization_id', sourceOrgId)
        .single();

      console.log('Source settings found:', !!sourceSettings, 'Error:', settingsError?.message);
      
      if (sourceSettings && !settingsError) {
        console.log('Inserting cloned settings for new org:', clonedOrg.id);
        const { id, ...settingsWithoutId } = sourceSettings;
        const { error: cloneSettingsError } = await supabase
          .from('settings')
          .insert([{
            ...settingsWithoutId,
            organization_id: clonedOrg.id,
            site: cloneName,
            domain: null, // Clear domain for new site
            seo_title: `${sourceSettings.seo_title}` || cloneName,
          }]);

        cloneResults.settings = !cloneSettingsError;
        console.log('Settings clone result:', !cloneSettingsError, 'Error:', cloneSettingsError?.message);
      } else {
        console.log('No source settings found or error occurred');
      }

      // 2. Clone website hero
      console.log('Cloning website hero for source org:', sourceOrgId);
      const { data: sourceHero, error: heroError } = await supabase
        .from('website_hero')
        .select('*')
        .eq('organization_id', sourceOrgId)
        .single();

      console.log('Source hero found:', !!sourceHero, 'Error:', heroError?.message);

      if (sourceHero && !heroError) {
        console.log('Inserting cloned hero for new org:', clonedOrg.id);
        const { id, ...heroWithoutId } = sourceHero;
        const { error: cloneHeroError } = await supabase
          .from('website_hero')
          .insert([{
            ...heroWithoutId,
            organization_id: clonedOrg.id,
            name: cloneName,
            seo_title: sourceHero.seo_title || cloneName,
          }]);

        cloneResults.hero = !cloneHeroError;
        console.log('Hero clone result:', !cloneHeroError, 'Error:', cloneHeroError?.message);
      } else {
        console.log('No source hero found or error occurred');
      }

      // 3. Clone menu items
      console.log('Cloning menu items for source org:', sourceOrgId);
      const { data: sourceMenuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('organization_id', sourceOrgId);

      console.log('Source menu items found:', sourceMenuItems?.length || 0, 'Error:', menuError?.message);

      if (sourceMenuItems && sourceMenuItems.length > 0 && !menuError) {
        const menuItemsToInsert = sourceMenuItems.map(item => {
          const { id, ...itemWithoutId } = item;
          return {
            ...itemWithoutId,
            organization_id: clonedOrg.id,
          };
        });

        const { error: cloneMenuError } = await supabase
          .from('menu_items')
          .insert(menuItemsToInsert);

        cloneResults.menuItems = !cloneMenuError;
        console.log('Menu items clone result:', !cloneMenuError, 'Error:', cloneMenuError?.message);
        if (cloneMenuError) console.warn('Failed to clone menu items:', cloneMenuError);
      } else {
        console.log('No source menu items found or error occurred');
      }

      // 4. Clone banners
      console.log('Cloning banners for source org:', sourceOrgId);
      const { data: sourceBanners, error: bannersError } = await supabase
        .from('banners')
        .select('*')
        .eq('organization_id', sourceOrgId);

      console.log('Source banners found:', sourceBanners?.length || 0, 'Error:', bannersError?.message);

      if (sourceBanners && sourceBanners.length > 0 && !bannersError) {
        const bannersToInsert = sourceBanners.map(banner => {
          const { id, ...bannerWithoutId } = banner;
          return {
            ...bannerWithoutId,
            organization_id: clonedOrg.id,
          };
        });

        const { error: cloneBannersError } = await supabase
          .from('banners')
          .insert(bannersToInsert);

        cloneResults.banners = !cloneBannersError;
        console.log('Banners clone result:', !cloneBannersError, 'Error:', cloneBannersError?.message);
        if (cloneBannersError) console.warn('Failed to clone banners:', cloneBannersError);
      } else {
        console.log('No source banners found or error occurred');
      }

      // 5. Clone blog posts
      console.log('Cloning blog posts for source org:', sourceOrgId);
      const { data: sourceBlogPosts, error: blogError } = await supabase
        .from('blog_post')
        .select('*')
        .eq('organization_id', sourceOrgId);

      console.log('Source blog posts found:', sourceBlogPosts?.length || 0, 'Error:', blogError?.message);

      if (sourceBlogPosts && sourceBlogPosts.length > 0 && !blogError) {
        const blogPostsToInsert = sourceBlogPosts.map(post => {
          const { id, ...postWithoutId } = post;
          return {
            ...postWithoutId,
            organization_id: clonedOrg.id,
          };
        });

        const { error: cloneBlogError } = await supabase
          .from('blog_post')
          .insert(blogPostsToInsert);

        cloneResults.blogPosts = !cloneBlogError;
        console.log('Blog posts clone result:', !cloneBlogError, 'Error:', cloneBlogError?.message);
        if (cloneBlogError) console.warn('Failed to clone blog posts:', cloneBlogError);
      } else {
        console.log('No source blog posts found or error occurred');
      }

      // 6. Clone product sub-types (required dependency for products)
      console.log('Cloning product sub-types for source org:', sourceOrgId);
      const { data: sourceProductSubTypes, error: productSubTypesError } = await supabase
        .from('product_sub_type')
        .select('*')
        .eq('organization_id', sourceOrgId);

      console.log('Source product sub-types found:', sourceProductSubTypes?.length || 0, 'Error:', productSubTypesError?.message);

      if (sourceProductSubTypes && sourceProductSubTypes.length > 0 && !productSubTypesError) {
        const productSubTypesToInsert = sourceProductSubTypes.map(subType => {
          const { id, ...subTypeWithoutId } = subType;
          return {
            ...subTypeWithoutId,
            organization_id: clonedOrg.id,
            // Keep original name and slug since constraints are now organization-scoped
          };
        });

        const { data: clonedProductSubTypes, error: cloneProductSubTypesError } = await supabase
          .from('product_sub_type')
          .insert(productSubTypesToInsert)
          .select('id');

        if (!cloneProductSubTypesError && clonedProductSubTypes) {
          // Create mapping from old product sub-type IDs to new ones
          sourceProductSubTypes.forEach((originalSubType, index) => {
            productSubTypeIdMapping[originalSubType.id] = clonedProductSubTypes[index].id;
          });
          console.log('Product sub-type ID mapping created:', productSubTypeIdMapping);
        }

        cloneResults.productSubTypes = !cloneProductSubTypesError;
        console.log('Product sub-types clone result:', !cloneProductSubTypesError, 'Error:', cloneProductSubTypesError?.message);
        if (cloneProductSubTypesError) console.warn('Failed to clone product sub-types:', cloneProductSubTypesError);
      } else {
        console.log('No source product sub-types found or error occurred');
      }

      // 7. Clone products with foreign key handling and create ID mapping
      console.log('Cloning products for source org:', sourceOrgId);
      const { data: sourceProducts, error: productsError } = await supabase
        .from('product')
        .select('*')
        .eq('organization_id', sourceOrgId);

      console.log('Source products found:', sourceProducts?.length || 0, 'Error:', productsError?.message);

      if (sourceProducts && sourceProducts.length > 0 && !productsError) {
        const productsToInsert = [];

        for (const product of sourceProducts) {
          const { id, stripe_product_id, ...productWithoutId } = product;
          
          // Handle foreign key constraints
          const productData = {
            ...productWithoutId,
            organization_id: clonedOrg.id,
            stripe_product_id: null, // Clear Stripe ID for new organization
            // Update product_sub_type_id to reference the new cloned product sub-type
            product_sub_type_id: productSubTypeIdMapping[product.product_sub_type_id] || product.product_sub_type_id,
          };

          // Check if course_connected_id is valid, if not set to null
          if (product.course_connected_id) {
            const { data: courseExists } = await supabase
              .from('course')
              .select('id')
              .eq('id', product.course_connected_id)
              .eq('organization_id', sourceOrgId)
              .single();
            
            if (!courseExists) {
              console.warn(`Product "${product.product_name}" references non-existent course ${product.course_connected_id}, setting to null`);
              productData.course_connected_id = null;
            }
          }

          // Check if quiz_id is valid, if not set to null
          if (product.quiz_id) {
            const { data: quizExists } = await supabase
              .from('quiz')
              .select('id')
              .eq('id', product.quiz_id)
              .eq('organization_id', sourceOrgId)
              .single();
            
            if (!quizExists) {
              console.warn(`Product "${product.product_name}" references non-existent quiz ${product.quiz_id}, setting to null`);
              productData.quiz_id = null;
            }
          }

          productsToInsert.push(productData);
        }

        // Insert all products at once and get their new IDs
        const { data: clonedProducts, error: cloneProductsError } = await supabase
          .from('product')
          .insert(productsToInsert)
          .select('id');

        if (!cloneProductsError && clonedProducts) {
          // Create mapping from old product IDs to new ones
          sourceProducts.forEach((originalProduct, index) => {
            productIdMapping[originalProduct.id] = clonedProducts[index].id;
          });
          console.log('Product ID mapping created:', Object.keys(productIdMapping).length, 'products mapped');
          
          cloneResults.products = true;
          console.log(`Products clone result: ${clonedProducts.length}/${sourceProducts.length} successful`);
        } else {
          console.error('Failed to clone products:', cloneProductsError?.message);
          cloneResults.products = false;
        }
      } else {
        console.log('No source products found or error occurred');
      }

      // 7. Clone features and create ID mapping
      console.log('Cloning features for source org:', sourceOrgId);
      const { data: sourceFeatures, error: featuresError } = await supabase
        .from('feature')
        .select('*')
        .eq('organization_id', sourceOrgId);

      console.log('Source features found:', sourceFeatures?.length || 0, 'Error:', featuresError?.message);

      if (sourceFeatures && sourceFeatures.length > 0 && !featuresError) {
        const featuresToInsert = sourceFeatures.map(feature => {
          const { id, ...featureWithoutId } = feature;
          return {
            ...featureWithoutId,
            organization_id: clonedOrg.id,
          };
        });

        const { data: clonedFeatures, error: cloneFeaturesError } = await supabase
          .from('feature')
          .insert(featuresToInsert)
          .select('id');

        if (!cloneFeaturesError && clonedFeatures) {
          // Create mapping from old feature IDs to new ones
          sourceFeatures.forEach((originalFeature, index) => {
            featureIdMapping[originalFeature.id] = clonedFeatures[index].id;
          });
          console.log('Feature ID mapping created:', Object.keys(featureIdMapping).length, 'features mapped');
          
          cloneResults.features = true;
          console.log(`Features clone result: ${clonedFeatures.length}/${sourceFeatures.length} successful`);
        } else {
          console.error('Failed to clone features:', cloneFeaturesError?.message);
          cloneResults.features = false;
        }
      } else {
        console.log('No source features found or error occurred');
      }

      // 8. Clone FAQs
      console.log('Cloning FAQs for source org:', sourceOrgId);
      const { data: sourceFaqs, error: faqsError } = await supabase
        .from('faq')
        .select('*')
        .eq('organization_id', sourceOrgId);

      console.log('Source FAQs found:', sourceFaqs?.length || 0, 'Error:', faqsError?.message);

      if (sourceFaqs && sourceFaqs.length > 0 && !faqsError) {
        const faqsToInsert = sourceFaqs.map(faq => {
          const { id, ...faqWithoutId } = faq;
          return {
            ...faqWithoutId,
            organization_id: clonedOrg.id,
          };
        });

        const { error: cloneFaqsError } = await supabase
          .from('faq')
          .insert(faqsToInsert);

        cloneResults.faqs = !cloneFaqsError;
        console.log('FAQs clone result:', !cloneFaqsError, 'Error:', cloneFaqsError?.message);
        if (cloneFaqsError) console.warn('Failed to clone FAQs:', cloneFaqsError);
      } else {
        console.log('No source FAQs found or error occurred');
      }

      // 9. Clone website menu items (navigation) and create ID mapping
      console.log('Cloning website menu items for source org:', sourceOrgId);
      const { data: sourceWebsiteMenuItems, error: websiteMenuError } = await supabase
        .from('website_menuitem')
        .select('*')
        .eq('organization_id', sourceOrgId);

      console.log('Source website menu items found:', sourceWebsiteMenuItems?.length || 0, 'Error:', websiteMenuError?.message);

      if (sourceWebsiteMenuItems && sourceWebsiteMenuItems.length > 0 && !websiteMenuError) {
        const websiteMenuItemsToInsert = sourceWebsiteMenuItems.map(item => {
          const { id, ...itemWithoutId } = item;
          return {
            ...itemWithoutId,
            organization_id: clonedOrg.id,
          };
        });

        const { data: clonedWebsiteMenuItems, error: cloneWebsiteMenuError } = await supabase
          .from('website_menuitem')
          .insert(websiteMenuItemsToInsert)
          .select('id');

        if (!cloneWebsiteMenuError && clonedWebsiteMenuItems) {
          // Create mapping from old menu item IDs to new ones
          sourceWebsiteMenuItems.forEach((originalItem, index) => {
            menuItemIdMapping[originalItem.id] = clonedWebsiteMenuItems[index].id;
          });
          console.log('Menu item ID mapping created:', menuItemIdMapping);
        }

        cloneResults.websiteMenuItems = !cloneWebsiteMenuError;
        console.log('Website menu items clone result:', !cloneWebsiteMenuError, 'Error:', cloneWebsiteMenuError?.message);
        if (cloneWebsiteMenuError) console.warn('Failed to clone website menu items:', cloneWebsiteMenuError);
      }

      // 10. Clone website submenu items with updated menu_item_id references
      console.log('Cloning website submenu items for source org:', sourceOrgId);
      const { data: sourceWebsiteSubmenuItems, error: websiteSubmenuError } = await supabase
        .from('website_submenuitem')
        .select('*')
        .eq('organization_id', sourceOrgId);

      console.log('Source website submenu items found:', sourceWebsiteSubmenuItems?.length || 0, 'Error:', websiteSubmenuError?.message);

      if (sourceWebsiteSubmenuItems && sourceWebsiteSubmenuItems.length > 0 && !websiteSubmenuError) {
        const websiteSubmenuItemsToInsert = sourceWebsiteSubmenuItems.map(item => {
          const { id, ...itemWithoutId } = item;
          return {
            ...itemWithoutId,
            organization_id: clonedOrg.id,
            // Update menu_item_id to reference the new cloned menu item
            menu_item_id: menuItemIdMapping[item.menu_item_id] || item.menu_item_id,
          };
        });

        const { error: cloneWebsiteSubmenuError } = await supabase
          .from('website_submenuitem')
          .insert(websiteSubmenuItemsToInsert);

        cloneResults.websiteSubmenuItems = !cloneWebsiteSubmenuError;
        console.log('Website submenu items clone result:', !cloneWebsiteSubmenuError, 'Error:', cloneWebsiteSubmenuError?.message);
        if (cloneWebsiteSubmenuError) console.warn('Failed to clone website submenu items:', cloneWebsiteSubmenuError);
      } else {
        console.log('No source website submenu items found or error occurred');
      }

      // 11. Clone template sections (content) and create ID mapping
      console.log('Cloning template sections for source org:', sourceOrgId);
      const { data: sourceTemplateSections, error: templateSectionsError } = await supabase
        .from('website_templatesection')
        .select('*')
        .eq('organization_id', sourceOrgId);

      console.log('Source template sections found:', sourceTemplateSections?.length || 0, 'Error:', templateSectionsError?.message);

      if (sourceTemplateSections && sourceTemplateSections.length > 0 && !templateSectionsError) {
        const templateSectionsToInsert = sourceTemplateSections.map(section => {
          const { id, ...sectionWithoutId } = section;
          return {
            ...sectionWithoutId,
            organization_id: clonedOrg.id,
          };
        });

        const { data: clonedTemplateSections, error: cloneTemplateSectionsError } = await supabase
          .from('website_templatesection')
          .insert(templateSectionsToInsert)
          .select('id');

        if (!cloneTemplateSectionsError && clonedTemplateSections) {
          // Create mapping from old template section IDs to new ones
          sourceTemplateSections.forEach((originalSection, index) => {
            templateSectionIdMapping[originalSection.id] = clonedTemplateSections[index].id;
          });
          console.log('Template section ID mapping created:', templateSectionIdMapping);
        }

        cloneResults.templateSections = !cloneTemplateSectionsError;
        if (cloneTemplateSectionsError) console.warn('Failed to clone template sections:', cloneTemplateSectionsError);
      }

      // 12. Clone template heading sections
      console.log('Cloning template heading sections for source org:', sourceOrgId);
      const { data: sourceTemplateHeadingSections, error: templateHeadingSectionsError } = await supabase
        .from('website_templatesectionheading')
        .select('*')
        .eq('organization_id', sourceOrgId);

      console.log('Source template heading sections found:', sourceTemplateHeadingSections?.length || 0, 'Error:', templateHeadingSectionsError?.message);

      if (sourceTemplateHeadingSections && sourceTemplateHeadingSections.length > 0 && !templateHeadingSectionsError) {
        const templateHeadingSectionsToInsert = sourceTemplateHeadingSections.map(section => {
          const { id, ...sectionWithoutId } = section;
          return {
            ...sectionWithoutId,
            organization_id: clonedOrg.id,
          };
        });

        const { error: cloneTemplateHeadingSectionsError } = await supabase
          .from('website_templatesectionheading')
          .insert(templateHeadingSectionsToInsert);

        cloneResults.templateHeadingSections = !cloneTemplateHeadingSectionsError;
        if (cloneTemplateHeadingSectionsError) console.warn('Failed to clone template heading sections:', cloneTemplateHeadingSectionsError);
      }

      // 13. Clone pages
      console.log('Cloning pages for source org:', sourceOrgId);
      const { data: sourcePages, error: pagesError } = await supabase
        .from('pages')
        .select('*')
        .eq('organization_id', sourceOrgId);

      console.log('Source pages found:', sourcePages?.length || 0, 'Error:', pagesError?.message);

      if (sourcePages && sourcePages.length > 0 && !pagesError) {
        const pagesToInsert = sourcePages.map(page => {
          const { id, ...pageWithoutId } = page;
          return {
            ...pageWithoutId,
            organization_id: clonedOrg.id,
          };
        });

        const { error: clonePagesError } = await supabase
          .from('pages')
          .insert(pagesToInsert);

        cloneResults.pages = !clonePagesError;
        if (clonePagesError) console.warn('Failed to clone pages:', clonePagesError);
      }

      // 14. Clone website brands (if they exist)
      console.log('Cloning website brands for source org:', sourceOrgId);
      const { data: sourceWebsiteBrands, error: websiteBrandsError } = await supabase
        .from('website_brand')
        .select('*')
        .eq('organization_id', sourceOrgId);

      console.log('Source website brands found:', sourceWebsiteBrands?.length || 0, 'Error:', websiteBrandsError?.message);

      if (sourceWebsiteBrands && sourceWebsiteBrands.length > 0 && !websiteBrandsError) {
        const websiteBrandsToInsert = sourceWebsiteBrands.map(brand => {
          const { id, ...brandWithoutId } = brand;
          return {
            ...brandWithoutId,
            organization_id: clonedOrg.id,
          };
        });

        const { error: cloneWebsiteBrandsError } = await supabase
          .from('website_brand')
          .insert(websiteBrandsToInsert);

        cloneResults.websiteBrands = !cloneWebsiteBrandsError;
        if (cloneWebsiteBrandsError) console.warn('Failed to clone website brands:', cloneWebsiteBrandsError);
      }

      // 15. Clone pricing plans with updated product_id references
      console.log('Cloning pricing plans for source org:', sourceOrgId);
      const { data: sourcePricingPlans, error: pricingPlansError } = await supabase
        .from('pricingplan')
        .select('*')
        .eq('organization_id', sourceOrgId);

      console.log('Source pricing plans found:', sourcePricingPlans?.length || 0, 'Error:', pricingPlansError?.message);

      const pricingPlanIdMapping: { [key: string]: string } = {};

      if (sourcePricingPlans && sourcePricingPlans.length > 0 && !pricingPlansError) {
        const pricingPlansToInsert = sourcePricingPlans.map(plan => {
          const { id, stripe_price_id, ...planWithoutId } = plan;
          return {
            ...planWithoutId,
            organization_id: clonedOrg.id,
            stripe_price_id: null, // Clear Stripe price ID for new organization
            // Update product_id to reference the new cloned product
            product_id: productIdMapping[plan.product_id] || plan.product_id,
          };
        });

        // Log product ID mappings being applied
        console.log(`Applying product ID mappings to ${sourcePricingPlans.length} pricing plans:`);
        let updatedProductIds = 0;
        sourcePricingPlans.forEach(plan => {
          const newProductId = productIdMapping[plan.product_id];
          if (newProductId && newProductId !== plan.product_id) {
            updatedProductIds++;
          }
        });
        console.log(`Updated ${updatedProductIds} pricing plan product_id references`);

        const { data: clonedPricingPlans, error: clonePricingPlansError } = await supabase
          .from('pricingplan')
          .insert(pricingPlansToInsert)
          .select();

        cloneResults.pricingPlans = !clonePricingPlansError;
        if (clonePricingPlansError) {
          console.warn('Failed to clone pricing plans:', clonePricingPlansError);
        } else if (clonedPricingPlans) {
          // Create mapping of old IDs to new IDs for pricing plan features
          sourcePricingPlans.forEach((originalPlan, index) => {
            if (clonedPricingPlans[index]) {
              pricingPlanIdMapping[originalPlan.id] = clonedPricingPlans[index].id;
            }
          });
          console.log(`Pricing plan ID mapping created: ${Object.keys(pricingPlanIdMapping).length} plans mapped`);
          console.log(`Successfully cloned ${clonedPricingPlans.length} pricing plans with updated product references`);
        }
      }

      // 16. Clone pricing plan features with updated feature_id and pricingplan_id references
      console.log('Cloning pricing plan features for source org:', sourceOrgId);
      console.log('Available ID mappings - Features:', Object.keys(featureIdMapping).length, 'PricingPlans:', Object.keys(pricingPlanIdMapping).length);
      // First get pricing plan IDs from the source organization
      const { data: sourcePricingPlanIds, error: sourcePlanIdsError } = await supabase
        .from('pricingplan')
        .select('id')
        .eq('organization_id', sourceOrgId);

      console.log('Source pricing plan IDs found:', sourcePricingPlanIds?.length || 0, 'Error:', sourcePlanIdsError?.message);

      if (!sourcePricingPlanIds || sourcePricingPlanIds.length === 0 || sourcePlanIdsError) {
        console.log('No source pricing plans found, skipping pricing plan features');
        cloneResults.pricingPlanFeatures = true; // Mark as successful but empty
      } else {
        // Get pricing plan features for these pricing plans
        const { data: sourcePricingPlanFeatures, error: pricingPlanFeaturesError } = await supabase
          .from('pricingplan_features')
          .select('*')
          .in('pricingplan_id', sourcePricingPlanIds.map(p => p.id));

      console.log('Source pricing plan features found:', sourcePricingPlanFeatures?.length || 0, 'Error:', pricingPlanFeaturesError?.message);

      if (sourcePricingPlanFeatures && sourcePricingPlanFeatures.length > 0 && !pricingPlanFeaturesError) {
        // Log ID mappings being applied
        console.log(`Applying ID mappings to ${sourcePricingPlanFeatures.length} pricing plan features:`);
        let updatedPricingPlanIds = 0;
        let updatedFeatureIds = 0;
        
        const pricingPlanFeaturesToInsert = sourcePricingPlanFeatures.map(feature => {
          const { id, feature: featureData, ...featureWithoutId } = feature;
          
          const newPricingPlanId = pricingPlanIdMapping[feature.pricingplan_id];
          const newFeatureId = featureIdMapping[feature.feature_id];
          
          // Debug logging for each feature
          console.log(`Processing feature - Original PricingPlan ID: ${feature.pricingplan_id}, New: ${newPricingPlanId}, Original Feature ID: ${feature.feature_id}, New: ${newFeatureId}`);
          
          if (newPricingPlanId && newPricingPlanId !== feature.pricingplan_id) {
            updatedPricingPlanIds++;
          }
          if (newFeatureId && newFeatureId !== feature.feature_id) {
            updatedFeatureIds++;
          }
          
          return {
            ...featureWithoutId,
            pricingplan_id: newPricingPlanId || feature.pricingplan_id,
            feature_id: newFeatureId || feature.feature_id,
          };
        });

        console.log(`Updated ${updatedPricingPlanIds} pricingplan_id references`);
        console.log(`Updated ${updatedFeatureIds} feature_id references`);

        const { error: clonePricingPlanFeaturesError } = await supabase
          .from('pricingplan_features')
          .insert(pricingPlanFeaturesToInsert);

        cloneResults.pricingPlanFeatures = !clonePricingPlanFeaturesError;
        if (clonePricingPlanFeaturesError) {
          console.warn('Failed to clone pricing plan features:', clonePricingPlanFeaturesError);
        } else {
          console.log(`Successfully cloned ${sourcePricingPlanFeatures.length} pricing plan features with updated references`);
        }
        } else {
          console.log('No source pricing plan features found or error occurred');
        }
      }

      // 17. Clone inventory items with quantity set to 100 and updated pricing_plan_id references
      console.log('Cloning inventory items for source org:', sourceOrgId);
      
      // Get pricing plan IDs from source organization for inventory lookup
      const { data: sourcePricingPlanIdsForInventory, error: sourcePlanIdsForInventoryError } = await supabase
        .from('pricingplan')
        .select('id')
        .eq('organization_id', sourceOrgId);

      console.log('Source pricing plan IDs for inventory found:', sourcePricingPlanIdsForInventory?.length || 0, 'Error:', sourcePlanIdsForInventoryError?.message);

      if (sourcePricingPlanIdsForInventory && sourcePricingPlanIdsForInventory.length > 0 && !sourcePlanIdsForInventoryError) {
        // Get inventory items for these pricing plans
        const { data: sourceInventory, error: inventoryError } = await supabase
          .from('inventory')
          .select('*')
          .in('pricing_plan_id', sourcePricingPlanIdsForInventory.map(p => p.id));

        console.log('Source inventory items found:', sourceInventory?.length || 0, 'Error:', inventoryError?.message);

        if (sourceInventory && sourceInventory.length > 0 && !inventoryError) {
          console.log(`Cloning ${sourceInventory.length} inventory items with quantity set to 100`);
          
          const inventoryItemsToInsert = sourceInventory.map(item => {
            const { id, ...itemWithoutId } = item;
            
            // Get the new pricing plan ID from our mapping
            const newPricingPlanId = pricingPlanIdMapping[item.pricing_plan_id];
            
            if (!newPricingPlanId) {
              console.warn(`No pricing plan mapping found for inventory item ${item.id} with pricing_plan_id ${item.pricing_plan_id}`);
            }
            
            return {
              ...itemWithoutId,
              pricing_plan_id: newPricingPlanId || item.pricing_plan_id,
              quantity: 100, // Set all quantities to 100 as requested
            };
          });

          console.log(`Inventory items prepared for insertion with ${inventoryItemsToInsert.filter(item => item.quantity === 100).length} items set to quantity 100`);

          const { error: cloneInventoryError } = await supabase
            .from('inventory')
            .insert(inventoryItemsToInsert);

          cloneResults.inventory = !cloneInventoryError;
          if (cloneInventoryError) {
            console.warn('Failed to clone inventory items:', cloneInventoryError);
          } else {
            console.log(`Successfully cloned ${sourceInventory.length} inventory items with quantity set to 100 and updated pricing plan references`);
          }
        } else {
          console.log('No source inventory items found or error occurred');
          cloneResults.inventory = true; // Mark as successful but empty
        }
      } else {
        console.log('No source pricing plans found for inventory lookup, skipping inventory cloning');
        cloneResults.inventory = true; // Mark as successful but empty
      }

      // 18. Clone pricing plan comparison data
      console.log('Cloning pricing plan comparison for source org:', sourceOrgId);
      const { data: sourcePricingComparison, error: pricingComparisonError } = await supabase
        .from('pricingplan_comparison')
        .select('*')
        .eq('organization_id', sourceOrgId);

      console.log('Source pricing comparison found:', sourcePricingComparison?.length || 0, 'Error:', pricingComparisonError?.message);

      if (sourcePricingComparison && sourcePricingComparison.length > 0 && !pricingComparisonError) {
        const pricingComparisonToInsert = sourcePricingComparison.map(comparison => {
          const { id, ...comparisonWithoutId } = comparison;
          return {
            ...comparisonWithoutId,
            organization_id: clonedOrg.id,
          };
        });

        const { error: clonePricingComparisonError } = await supabase
          .from('pricingplan_comparison')
          .insert(pricingComparisonToInsert);

        cloneResults.pricingComparison = !clonePricingComparisonError;
        if (clonePricingComparisonError) console.warn('Failed to clone pricing comparison:', clonePricingComparisonError);
      }

      // 18. Clone website metrics first (required for template section metrics)
      console.log('Cloning website metrics for source org:', sourceOrgId);
      const { data: sourceWebsiteMetrics, error: websiteMetricsError } = await supabase
        .from('website_metric')
        .select('*')
        .eq('organization_id', sourceOrgId);

      console.log('Source website metrics found:', sourceWebsiteMetrics?.length || 0, 'Error:', websiteMetricsError?.message);

      if (sourceWebsiteMetrics && sourceWebsiteMetrics.length > 0 && !websiteMetricsError) {
        const websiteMetricsToInsert = sourceWebsiteMetrics.map(metric => {
          const { id, ...metricWithoutId } = metric;
          return {
            ...metricWithoutId,
            organization_id: clonedOrg.id,
          };
        });

        const { data: clonedWebsiteMetrics, error: cloneWebsiteMetricsError } = await supabase
          .from('website_metric')
          .insert(websiteMetricsToInsert)
          .select('id');

        if (!cloneWebsiteMetricsError && clonedWebsiteMetrics) {
          // Create mapping from old metric IDs to new ones
          sourceWebsiteMetrics.forEach((originalMetric, index) => {
            websiteMetricIdMapping[originalMetric.id] = clonedWebsiteMetrics[index].id;
          });
          console.log('Website metric ID mapping created:', websiteMetricIdMapping);
        }

        cloneResults.websiteMetrics = !cloneWebsiteMetricsError;
        console.log('Website metrics clone result:', !cloneWebsiteMetricsError, 'Error:', cloneWebsiteMetricsError?.message);
        if (cloneWebsiteMetricsError) console.warn('Failed to clone website metrics:', cloneWebsiteMetricsError);
      } else {
        console.log('No source website metrics found or error occurred');
      }

      // 19. Clone website template section metrics with proper foreign key handling
      console.log('Cloning website template section metrics for source org:', sourceOrgId);
      
      // First, get all website_templatesection_metrics that belong to template sections of our organization
      const { data: sourceTemplateSectionMetrics, error: templateSectionMetricsError } = await supabase
        .from('website_templatesection_metrics')
        .select(`
          *,
          website_templatesection:templatesection_id (organization_id),
          website_metric:metric_id (organization_id)
        `);

      console.log('All template section metrics found:', sourceTemplateSectionMetrics?.length || 0, 'Error:', templateSectionMetricsError?.message);

      // Filter to only those belonging to our source organization
      const orgTemplateSectionMetrics = sourceTemplateSectionMetrics?.filter(metric => 
        metric.website_templatesection?.organization_id === sourceOrgId ||
        metric.website_metric?.organization_id === sourceOrgId
      ) || [];

      console.log('Org-specific template section metrics found:', orgTemplateSectionMetrics.length);

      if (orgTemplateSectionMetrics.length > 0) {
        let successfulMetrics = 0;
        let failedMetrics = 0;

        for (const metric of orgTemplateSectionMetrics) {
          try {
            const { id, website_templatesection, website_metric, ...metricWithoutId } = metric;

            // Update both foreign key references to new cloned IDs
            const metricData = {
              ...metricWithoutId,
              templatesection_id: templateSectionIdMapping[metric.templatesection_id] || metric.templatesection_id,
              metric_id: websiteMetricIdMapping[metric.metric_id] || metric.metric_id,
            };

            const { error: cloneMetricError } = await supabase
              .from('website_templatesection_metrics')
              .insert([metricData]);

            if (cloneMetricError) {
              console.warn(`Failed to clone template section metric ${metric.id}:`, cloneMetricError.message);
              failedMetrics++;
            } else {
              successfulMetrics++;
            }

          } catch (metricError) {
            console.error(`Error processing template section metric ${metric.id}:`, metricError);
            failedMetrics++;
          }
        }

        cloneResults.templateSectionMetrics = successfulMetrics > 0;
        console.log(`Template section metrics clone result: ${successfulMetrics}/${orgTemplateSectionMetrics.length} successful`);
        if (failedMetrics > 0) {
          console.warn(`Template section metrics cloning had ${failedMetrics} failures out of ${orgTemplateSectionMetrics.length} total`);
        }
      } else {
        console.log('No source template section metrics found for organization');
      }

      console.log('Final clone results:', cloneResults);
      console.log('Clone summary - Settings:', cloneResults.settings, 'Hero:', cloneResults.hero, 'MenuItems:', cloneResults.menuItems, 'Banners:', cloneResults.banners);

    } catch (cloneDataError) {
      console.error('Error during data cloning process:', cloneDataError);
      // Don't fail the entire request if related data fails
    }

    // Create Vercel project and deploy (same as create organization)
    let deploymentResult = null;
    let deploymentError = null;
    const projectName = `${cloneName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${clonedOrg.id.slice(0, 8)}`;
    const baseUrl = `https://${projectName}.vercel.app`;

    // Only attempt Vercel deployment if token is available
    if (!process.env.VERCEL_TOKEN) {
      console.warn('VERCEL_TOKEN not available - skipping automatic Vercel deployment');
      deploymentError = 'VERCEL_TOKEN environment variable not configured';
    } else {
      try {
        console.log('Attempting automatic Vercel deployment for cloned organization...');
        
        // Import deployment logic (same as create organization)
        const { createVercelClient, generateSiteEnvironmentVariables } = await import('@/lib/vercel');
        
        // Initialize Vercel client with correct team ID
        const vercelClient = createVercelClient(
          process.env.VERCEL_TOKEN,
          'team_O74MS093TrJebFniPVoMmj3F'
        );
        
        console.log('Creating Vercel project for clone:', projectName);
        
        // Create Vercel project
        const vercelProject = await vercelClient.createProject(projectName, 'nextjs');
        console.log('Vercel project created for clone:', vercelProject.id);
        
        // Connect GitHub repository
        const gitRepository = 'https://github.com/onlineimmigrant/move-plan-next';
        console.log('Connecting GitHub repository to cloned project:', gitRepository);
        
        try {
          await vercelClient.connectGitRepository(vercelProject.id, gitRepository);
          console.log('GitHub repository connected successfully for clone');
          
          // Wait for connection to propagate
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Attempt to trigger deployment
          console.log('Attempting to trigger initial deployment for clone...');
          try {
            const deployment = await vercelClient.deployProject(vercelProject.id, projectName);
            console.log('Initial deployment triggered successfully for clone:', deployment.uid);
            
            // Update deployment status and ID
            await supabase
              .from('organizations')
              .update({
                vercel_deployment_id: deployment.uid,
                deployment_status: 'building'
              })
              .eq('id', clonedOrg.id);
              
          } catch (deployError) {
            console.warn('Initial deployment failed for clone (this is common for new repo connections):', deployError);
            // Continue without failing - user can deploy manually
          }
          
        } catch (gitError) {
          console.warn('GitHub repository connection failed for clone:', gitError);
          console.log('Project created but Git connection failed - user will need to connect manually');
        }
        
        // Generate environment variables
        const envVars = generateSiteEnvironmentVariables(clonedOrg.id, cloneName, baseUrl);
        
        // Set environment variables
        try {
          await vercelClient.setEnvironmentVariables(vercelProject.id, envVars);
          console.log('Environment variables set for cloned project');
        } catch (envError) {
          console.warn('Environment variables setup failed during clone deployment:', envError);
        }
        
        // Update organization with Vercel project info
        await supabase
          .from('organizations')
          .update({
            base_url: baseUrl,
            vercel_project_id: vercelProject.id,
            deployment_status: 'created', // Project created, ready for manual deployment
            updated_at: new Date().toISOString()
          })
          .eq('id', clonedOrg.id);
        
        deploymentResult = {
          vercelProjectId: vercelProject.id,
          projectName: projectName,
          baseUrl: baseUrl,
          status: 'created',
          dashboardUrl: `https://vercel.com/dashboard/projects/${vercelProject.id}`,
          githubRepository: gitRepository,
          message: 'Vercel project created successfully for cloned organization.'
        };
        
        console.log('Automatic Vercel project creation completed successfully for clone');
        
      } catch (autoDeployError: any) {
        console.error('❌ Automatic Vercel deployment failed for clone:', autoDeployError);
        
        if (autoDeployError.message.includes('403') || autoDeployError.message.includes('Not authorized')) {
          deploymentError = 'VERCEL_TOKEN permission denied - check token scope and team access';
        } else {
          deploymentError = autoDeployError.message;
        }
        
        // Don't fail the clone - just log the deployment failure
        console.log('Organization cloned successfully, but automatic Vercel deployment failed');
      }
    }

    // Log the activity
    try {
      await logActivity({
        organizationId: clonedOrg.id,
        action: 'created',
        details: `Organization "${cloneName}" was cloned from "${sourceOrg.name}"`,
        userEmail: profile.email
      });
    } catch (logError) {
      console.warn('Failed to log clone activity:', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'Organization cloned and deployment initiated successfully',
      organization: {
        id: clonedOrg.id,
        name: cloneName,
        type: clonedOrg.type,
        base_url: deploymentResult?.baseUrl || baseUrl,
        base_url_local: clonedOrg.base_url_local,
        deployment_status: deploymentResult?.status || 'not_deployed',
        vercel_project_id: deploymentResult?.vercelProjectId || null,
        created_at: clonedOrg.created_at,
        created_by_email: clonedOrg.created_by_email
      },
      sourceOrganization: {
        id: sourceOrg.id,
        name: sourceOrg.name
      },
      cloneResults: cloneResults,
      deployment: deploymentResult,
      deploymentError: deploymentError
    });

  } catch (error) {
    console.error('Error cloning organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
