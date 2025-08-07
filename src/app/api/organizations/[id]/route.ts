import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidateTag } from 'next/cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch organization details with settings
export async function GET(
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
    const orgId = id;

    console.log('Fetching organization details for:', orgId, 'by user:', userId);

    // Get user's profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id, is_site_creator')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if user's organization is 'general' type
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

    console.log('User organization type:', currentOrg.type, 'Requested org ID:', orgId, 'User org ID:', profile.organization_id);

    // Fetch the target organization first
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    if (orgError) {
      console.error('Error fetching organization:', orgError);
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (currentOrg.type === 'general') {
      // GENERAL ORGANIZATION LOGIC (existing logic)
      // Only admins can edit organizations
      if (profile.role !== 'admin') {
        return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
      }

      // Check if this organization was created by someone from the current general organization
      const { data: generalOrgUsers, error: usersError } = await supabase
        .from('profiles')
        .select('email')
        .eq('organization_id', profile.organization_id)
        .or('role.eq.admin,is_site_creator.eq.true');

      if (usersError) {
        return NextResponse.json({ error: 'Error verifying permissions' }, { status: 500 });
      }

      const creatorEmails = generalOrgUsers?.map((user: any) => user.email) || [];
      if (!creatorEmails.includes(organization.created_by_email)) {
        return NextResponse.json({ error: 'Access denied. You can only edit organizations created by your team.' }, { status: 403 });
      }
    } else {
      // NON-GENERAL ORGANIZATION LOGIC (new)
      // Users can only access their own organization
      if (orgId !== profile.organization_id) {
        return NextResponse.json({ error: 'Access denied. You can only access your own organization.' }, { status: 403 });
      }

      // Check if user has appropriate role (admin or member with edit permissions)
      if (profile.role !== 'admin' && profile.role !== 'member') {
        return NextResponse.json({ error: 'Access denied. Insufficient permissions.' }, { status: 403 });
      }
    }

    // Fetch the organization's settings
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('organization_id', orgId)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching settings:', settingsError);
      return NextResponse.json({ error: 'Error fetching settings' }, { status: 500 });
    }

    // Fetch the organization's hero data
    const { data: website_hero, error: heroError } = await supabase
      .from('website_hero')
      .select('*')
      .eq('organization_id', orgId)
      .single();

    if (heroError && heroError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching hero data:', heroError);
      return NextResponse.json({ error: 'Error fetching hero data' }, { status: 500 });
    }

    // Fetch the organization's menu items
    const { data: menu_items, error: menuError } = await supabase
      .from('website_menuitem')
      .select(`
        id,
        display_name,
        display_name_translation,
        url_name,
        is_displayed,
        is_displayed_on_footer,
        order,
        react_icon_id,
        organization_id,
        description_translation
      `)
      .eq('organization_id', orgId)
      .order('order', { ascending: true });

    if (menuError) {
      console.error('Error fetching menu items:', menuError);
      return NextResponse.json({ error: 'Error fetching menu items' }, { status: 500 });
    }

    // Fetch the organization's submenu items
    const { data: submenu_items, error: submenuError } = await supabase
      .from('website_submenuitem')
      .select(`
        id,
        menu_item_id,
        name,
        url_name,
        order,
        organization_id
      `)
      .eq('organization_id', orgId)
      .order('order', { ascending: true });

    if (submenuError) {
      console.error('Error fetching submenu items:', submenuError);
      return NextResponse.json({ error: 'Error fetching submenu items' }, { status: 500 });
    }

    // Structure menu items with nested submenu items and map field names for admin interface
    let structuredMenuItems = menu_items;
    let mappedSubmenuItems = submenu_items;
    
    if (menu_items && submenu_items && Array.isArray(menu_items) && Array.isArray(submenu_items)) {
      // Map submenu field names for admin interface compatibility
      mappedSubmenuItems = submenu_items.map((submenu: any) => ({
        ...submenu,
        website_menuitem_id: submenu.menu_item_id, // Map for admin interface
        url: submenu.url_name, // Map for admin interface
        is_visible: true, // Default since field doesn't exist in database
        is_new_window: false // Default since field doesn't exist in database
      }));
      
      // Structure menu items with nested submenu items
      structuredMenuItems = menu_items.map((menuItem: any) => ({
        ...menuItem,
        submenu_items: mappedSubmenuItems.filter((submenu: any) => submenu.menu_item_id === menuItem.id)
      }));
    }

    return NextResponse.json({
      organization,
      settings: settings || null,
      website_hero: website_hero || null,
      menu_items: structuredMenuItems || [],
      submenu_items: mappedSubmenuItems || []
    });

  } catch (error) {
    console.error('Error fetching organization details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update organization and settings
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('PUT /api/organizations/[id] - Starting request');
  
  try {
    // Await params before accessing properties
    const { id } = await params;
    console.log('PUT - Organization ID:', id);
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('PUT - No authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the user's session
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user.user) {
      console.log('PUT - Invalid token:', userError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = user.user.id;
    const orgId = id;
    const body = await request.json();

    console.log('PUT - Updating organization:', orgId, 'with data:', body);
    console.log('PUT - User ID:', userId);

    const { organization: orgData, settings: settingsData, website_hero: heroData, menu_items: menuItems, submenu_items: submenuItems } = body;

    // Get user's profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id, is_site_creator')
      .eq('id', userId)
      .single();

    console.log('PUT - Profile fetch result:', { profile, profileError });

    if (profileError || !profile) {
      console.log('PUT - Profile not found:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check permissions (same as GET)
    if (!profile.organization_id) {
      console.log('PUT - User has no organization_id');
      return NextResponse.json({ error: 'User must belong to an organization' }, { status: 403 });
    }

    const { data: currentOrg, error: currentOrgError } = await supabase
      .from('organizations')
      .select('type')
      .eq('id', profile.organization_id)
      .single();

    console.log('PUT - Current org fetch result:', { currentOrg, currentOrgError });

    if (currentOrgError || !currentOrg) {
      console.log('PUT - Current organization not found:', currentOrgError);
      return NextResponse.json({ error: 'Current organization not found' }, { status: 404 });
    }

    console.log('PUT - Access control check:', {
      currentOrgType: currentOrg.type,
      userRole: profile.role,
      userOrgId: profile.organization_id,
      targetOrgId: orgId
    });

    // Access control based on organization type
    if (currentOrg.type === 'general') {
      // General organizations: check admin role
      console.log('PUT - General org access control');
      if (profile.role !== 'admin') {
        console.log('PUT - Access denied: not admin');
        return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
      }
    } else {
      // Non-general organizations: check if editing their own organization
      console.log('PUT - Non-general org access control');
      if (profile.organization_id !== orgId) {
        console.log('PUT - Access denied: not own organization');
        return NextResponse.json({ error: 'Access denied. You can only edit your own organization.' }, { status: 403 });
      }
      // For non-general orgs, any member can edit their own org
    }

    // Verify user can edit this organization
    const { data: targetOrg, error: targetOrgError } = await supabase
      .from('organizations')
      .select('created_by_email')
      .eq('id', orgId)
      .single();

    if (targetOrgError) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Additional permission check only for general organizations
    if (currentOrg.type === 'general') {
      const { data: generalOrgUsers, error: usersError } = await supabase
        .from('profiles')
        .select('email')
        .eq('organization_id', profile.organization_id)
        .or('role.eq.admin,is_site_creator.eq.true');

      if (usersError) {
        return NextResponse.json({ error: 'Error verifying permissions' }, { status: 500 });
      }

      const creatorEmails = generalOrgUsers?.map(user => user.email) || [];
      if (!creatorEmails.includes(targetOrg.created_by_email)) {
        return NextResponse.json({ error: 'Access denied. You can only edit organizations created by your team.' }, { status: 403 });
      }
    }
    // For non-general organizations, no additional check needed since they can only edit their own org

    let updatedOrg = null;
    let updatedSettings = null;
    let updatedHero = null;
    let updatedMenuItems = null;
    let updatedSubmenuItems = null;

    // Update organization if data provided
    if (orgData) {
      const { data: org, error: orgUpdateError } = await supabase
        .from('organizations')
        .update(orgData)
        .eq('id', orgId)
        .select()
        .single();

      if (orgUpdateError) {
        console.error('Error updating organization:', orgUpdateError);
        return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
      }

      updatedOrg = org;
    }

    // Update or create settings if data provided
    if (settingsData) {
      // Check if settings record exists
      const { data: existingSettings, error: existingError } = await supabase
        .from('settings')
        .select('id')
        .eq('organization_id', orgId)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        console.error('Error checking existing settings:', existingError);
        return NextResponse.json({ error: 'Error checking settings' }, { status: 500 });
      }

      if (existingSettings) {
        // Update existing settings
        const { data: settings, error: settingsUpdateError } = await supabase
          .from('settings')
          .update(settingsData)
          .eq('organization_id', orgId)
          .select()
          .single();

        if (settingsUpdateError) {
          console.error('Error updating settings:', settingsUpdateError);
          return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
        }

        updatedSettings = settings;
      } else {
        // Create new settings record
        const { data: settings, error: settingsCreateError } = await supabase
          .from('settings')
          .insert({
            organization_id: orgId,
            ...settingsData
          })
          .select()
          .single();

        if (settingsCreateError) {
          console.error('Error creating settings:', settingsCreateError);
          return NextResponse.json({ error: 'Failed to create settings' }, { status: 500 });
        }

        updatedSettings = settings;
      }
    }

    // Update or create website_hero if data provided
    if (heroData) {
      // Check if hero record exists
      const { data: existingHero, error: existingHeroError } = await supabase
        .from('website_hero')
        .select('id')
        .eq('organization_id', orgId)
        .single();

      if (existingHeroError && existingHeroError.code !== 'PGRST116') {
        console.error('Error checking existing hero:', existingHeroError);
        return NextResponse.json({ error: 'Error checking hero data' }, { status: 500 });
      }

      if (existingHero) {
        // Update existing hero
        const { data: hero, error: heroUpdateError } = await supabase
          .from('website_hero')
          .update(heroData)
          .eq('organization_id', orgId)
          .select()
          .single();

        if (heroUpdateError) {
          console.error('Error updating hero:', heroUpdateError);
          return NextResponse.json({ error: 'Failed to update hero data' }, { status: 500 });
        }

        updatedHero = hero;
      } else {
        // Create new hero record
        const { data: hero, error: heroCreateError } = await supabase
          .from('website_hero')
          .insert({
            organization_id: orgId,
            ...heroData
          })
          .select()
          .single();

        if (heroCreateError) {
          console.error('Error creating hero:', heroCreateError);
          return NextResponse.json({ error: 'Failed to create hero data' }, { status: 500 });
        }

        updatedHero = hero;
      }
    }

    // Update menu items if data provided
    if (menuItems && Array.isArray(menuItems)) {
      // First, delete all existing menu items for this organization
      const { error: deleteError } = await supabase
        .from('website_menuitem')
        .delete()
        .eq('organization_id', orgId);

      if (deleteError) {
        console.error('Error deleting existing menu items:', deleteError);
        return NextResponse.json({ error: 'Failed to delete existing menu items' }, { status: 500 });
      }

      // Insert new menu items if any provided
      if (menuItems.length > 0) {
        const menuItemsWithOrgId = menuItems.map((item, index) => {
          // Only include fields that exist in the database schema
          return {
            display_name: item.display_name,
            display_name_translation: item.display_name_translation,
            url_name: item.url_name,
            is_displayed: item.is_displayed !== false,
            is_displayed_on_footer: item.is_displayed_on_footer || false,
            order: item.order || index + 1,
            organization_id: orgId
          };
        });

        const { data: insertedMenuItems, error: menuItemsError } = await supabase
          .from('website_menuitem')
          .insert(menuItemsWithOrgId)
          .select();

        if (menuItemsError) {
          console.error('Error creating menu items:', menuItemsError);
          return NextResponse.json({ error: 'Failed to create menu items' }, { status: 500 });
        }

        updatedMenuItems = insertedMenuItems;
      } else {
        updatedMenuItems = [];
      }
    }

    // Update submenu items if data provided
    if (submenuItems && Array.isArray(submenuItems)) {
      // First, delete all existing submenu items for this organization
      const { error: deleteSubmenuError } = await supabase
        .from('website_submenuitem')
        .delete()
        .eq('organization_id', orgId);

      if (deleteSubmenuError) {
        console.error('Error deleting existing submenu items:', deleteSubmenuError);
        return NextResponse.json({ error: 'Failed to delete existing submenu items' }, { status: 500 });
      }

      // Insert new submenu items if any provided
      if (submenuItems.length > 0) {
        // Create a mapping from old menu item IDs to new ones based on order/position
        const menuItemIdMapping: { [key: string]: number } = {};
        
        if (updatedMenuItems && Array.isArray(updatedMenuItems)) {
          // Map old menu items to new ones by order position
          const originalMenuItems = menuItems || [];
          updatedMenuItems.forEach((newMenuItem: any) => {
            const originalMenuItem = originalMenuItems.find((orig: any) => 
              orig.order === newMenuItem.order || orig.display_name === newMenuItem.display_name
            );
            if (originalMenuItem) {
              menuItemIdMapping[originalMenuItem.id] = newMenuItem.id;
            }
          });
        }

        const submenuItemsWithOrgId = submenuItems.map((item, index) => {
          // Use the new menu item ID from the mapping, or try to find it by other means
          const newMenuItemId = menuItemIdMapping[item.menu_item_id || item.website_menuitem_id] 
            || item.menu_item_id 
            || item.website_menuitem_id;
            
          return {
            name: item.name,
            url_name: item.url_name || item.url,
            order: item.order || index + 1,
            menu_item_id: newMenuItemId,
            organization_id: orgId
          };
        });

        const { data: insertedSubmenuItems, error: submenuItemsError } = await supabase
          .from('website_submenuitem')
          .insert(submenuItemsWithOrgId)
          .select();

        if (submenuItemsError) {
          console.error('Error creating submenu items:', submenuItemsError);
          return NextResponse.json({ error: 'Failed to create submenu items' }, { status: 500 });
        }

        updatedSubmenuItems = insertedSubmenuItems;
      } else {
        updatedSubmenuItems = [];
      }
    }

    // Revalidate cached pages that might use this organization's data
    try {
      console.log('Revalidating cached data for organization:', orgId);
      
      // Revalidate by organization-specific tags
      revalidateTag(`hero-${orgId}`);
      revalidateTag(`homepage-${orgId}`);
      revalidateTag('homepage');
      
      console.log(`Revalidated tags: hero-${orgId}, homepage-${orgId}, homepage`);
    } catch (revalidateError) {
      console.error('Error during cache revalidation:', revalidateError);
      // Don't fail the whole request if revalidation fails
    }

    // Structure menu items with nested submenu items for the admin interface
    let structuredMenuItems = updatedMenuItems;
    if (updatedMenuItems && updatedSubmenuItems && Array.isArray(updatedMenuItems) && Array.isArray(updatedSubmenuItems)) {
      structuredMenuItems = updatedMenuItems.map((menuItem: any) => ({
        ...menuItem,
        submenu_items: updatedSubmenuItems
          .filter((submenu: any) => submenu.menu_item_id === menuItem.id)
          .map((submenu: any) => ({
            ...submenu,
            // Map the field name to what the admin interface expects
            website_menuitem_id: submenu.menu_item_id,
            url: submenu.url_name, // Map url_name to url for admin interface
            is_visible: true, // Default since this field doesn't exist in database
            is_new_window: false // Default since this field doesn't exist in database
          }))
      }));
    }

    return NextResponse.json({
      success: true,
      organization: updatedOrg,
      settings: updatedSettings,
      website_hero: updatedHero,
      menu_items: structuredMenuItems,
      submenu_items: updatedSubmenuItems?.map((submenu: any) => ({
        ...submenu,
        // Map field names for admin interface compatibility
        website_menuitem_id: submenu.menu_item_id,
        url: submenu.url_name,
        is_visible: true,
        is_new_window: false
      })) || []
    });

  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
