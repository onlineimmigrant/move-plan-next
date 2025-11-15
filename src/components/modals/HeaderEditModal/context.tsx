'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MenuItem {
  id: string;
  display_name: string;
  url_name: string;
  is_displayed: boolean;
  is_displayed_on_footer: boolean;
  menu_items_are_text: boolean;
  react_icon_id?: string;
  order: number;
  organization_id: string;
  description?: string;
  website_submenuitem?: SubMenuItem[];
  submenu_items?: SubMenuItem[];
  
  // Translation fields
  display_name_translation?: Record<string, string>;
  description_translation?: Record<string, string>;
}

interface SubMenuItem {
  id: string;
  name: string;
  name_translation?: Record<string, any>;
  url_name: string;
  order: number;
  menu_item_id: string;
  description?: string;
  description_translation?: Record<string, any>;
  is_displayed?: boolean;
  image?: string | null;
  organization_id?: string;
}

interface HeaderEditContextType {
  isOpen: boolean;
  isLoading: boolean;
  isSaving: boolean;
  organizationId: string | null;
  headerStyle: string;
  headerStyleFull: any; // Full JSONB object
  logoImageUrl: string | null; // Logo image URL from settings.image
  menuItems: MenuItem[];
  openModal: (organizationId: string) => void;
  closeModal: () => void;
  fetchHeaderData: (organizationId: string) => Promise<void>;
  saveHeaderStyle: (organizationId: string, style: string) => Promise<void>;
  updateHeaderStyleFull: (organizationId: string, styleObject: any) => Promise<void>;
  updateMenuItems: (items: MenuItem[]) => Promise<void>;
  updateMenuItem: (itemId: string, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (itemId: string) => Promise<void>;
}

const HeaderEditContext = createContext<HeaderEditContextType | undefined>(undefined);

export const useHeaderEdit = () => {
  const context = useContext(HeaderEditContext);
  if (!context) {
    throw new Error('useHeaderEdit must be used within a HeaderEditProvider');
  }
  return context;
};

export const HeaderEditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [headerStyle, setHeaderStyle] = useState('default');
  const [headerStyleFull, setHeaderStyleFull] = useState<any>(null); // Store full JSONB object
  const [logoImageUrl, setLogoImageUrl] = useState<string | null>(null); // Store logo image URL
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [session, setSession] = useState<any>(null);

  // Get session on mount
  useEffect(() => {
    let isMounted = true;
    
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted && session) {
          setSession(session);
        }
      } catch (error) {
        console.error('[HeaderEditContext] Error getting session:', error);
      }
    };
    
    getSession();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const openModal = useCallback((orgId: string) => {
    setOrganizationId(orgId);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const fetchHeaderData = useCallback(async (organizationId: string) => {
    setIsLoading(true);
    try {
      // Get fresh session each time to avoid stale session issues
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      
      if (!freshSession?.access_token) {
        throw new Error('No active session found. Please log in again.');
      }

      // Fetch organization data for header style
      const orgResponse = await fetch(`/api/organizations/${organizationId}`, {
        headers: {
          'Authorization': `Bearer ${freshSession.access_token}`
        }
      });
      if (!orgResponse.ok) throw new Error('Failed to fetch organization');
      const orgData = await orgResponse.json();
      
      console.log('[HeaderEditContext] Fetched data:', {
        hasSettings: !!orgData.settings,
        headerStyle: orgData.settings?.header_style,
        headerStyleType: typeof orgData.settings?.header_style,
        logoImage: orgData.settings?.image
      });
      
      // Store logo image URL from settings
      setLogoImageUrl(orgData.settings?.image || null);
      
      // Extract header_style from settings (not organization)
      const headerStyleData = orgData.settings?.header_style;
      
      if (typeof headerStyleData === 'object' && headerStyleData !== null) {
        // Store full object and extract type
        console.log('[HeaderEditContext] Storing full header style object:', headerStyleData);
        setHeaderStyleFull(headerStyleData);
        setHeaderStyle(headerStyleData.type || 'default');
      } else if (typeof headerStyleData === 'string') {
        // Legacy string format
        console.log('[HeaderEditContext] Legacy string format:', headerStyleData);
        setHeaderStyleFull(null);
        setHeaderStyle(headerStyleData);
      } else {
        // No style data
        console.log('[HeaderEditContext] No header style data, using default');
        setHeaderStyleFull(null);
        setHeaderStyle('default');
      }

      // Fetch ALL menu items (both visible and hidden for header)
      const menuResponse = await fetch(
        `/api/menu-items?organization_id=${organizationId}`,
        {
          headers: {
            'Authorization': `Bearer ${freshSession.access_token}`
          }
        }
      );
      if (!menuResponse.ok) throw new Error('Failed to fetch menu items');
      const menuData = await menuResponse.json();
      
      console.log('[HeaderEditContext] Raw API response:', {
        count: menuData.menu_items?.length || 0,
        firstItem: menuData.menu_items?.[0],
        hasWebsiteSubmenuitem: !!menuData.menu_items?.[0]?.website_submenuitem
      });
      
      // Map website_submenuitem to submenu_items for consistency
      const mappedMenuItems = (menuData.menu_items || []).map((item: any) => ({
        ...item,
        submenu_items: item.website_submenuitem || []
      }));
      
      console.log('[HeaderEditContext] Mapped menu items with submenus:', {
        count: mappedMenuItems.length,
        withSubmenus: mappedMenuItems.filter((item: any) => item.submenu_items?.length > 0).length,
        firstItemSubmenus: mappedMenuItems[0]?.submenu_items
      });
      
      setMenuItems(mappedMenuItems);
    } catch (error) {
      console.error('[HeaderEditContext] Error fetching header data:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []); // Remove session dependency

  // Fetch header data when modal opens with an organizationId
  useEffect(() => {
    if (isOpen && organizationId) {
      fetchHeaderData(organizationId).catch(error => {
        console.error('[HeaderEditContext] Error fetching header data:', error);
      });
    }
  }, [isOpen, organizationId, fetchHeaderData]); // Remove session?.access_token dependency

  const saveHeaderStyle = useCallback(async (organizationId: string, style: string) => {
    setIsSaving(true);
    try {
      if (!session?.access_token) {
        throw new Error('No active session found. Please log in again.');
      }

      console.log('[HeaderEditContext] Starting save - current state:', {
        newType: style,
        currentHeaderStyleFull: headerStyleFull,
        willUseSpread: !!headerStyleFull
      });

      // ALWAYS fetch the current database value before saving to ensure we have latest data
      const fetchResponse = await fetch(`/api/organizations/${organizationId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!fetchResponse.ok) {
        throw new Error('Failed to fetch current header style');
      }
      
      const currentData = await fetchResponse.json();
      const currentHeaderStyle = currentData.settings?.header_style;
      
      console.log('[HeaderEditContext] Fetched current header_style from DB:', {
        value: currentHeaderStyle,
        type: typeof currentHeaderStyle,
        stringified: JSON.stringify(currentHeaderStyle)
      });

      // Preserve existing header_style values from DB, only update the type
      const headerStyleObject = (currentHeaderStyle && typeof currentHeaderStyle === 'object') ? {
        ...currentHeaderStyle,
        type: style
      } : {
        type: style,
        background: 'white',
        color: 'gray-700',
        color_hover: 'gray-900',
        menu_width: '7xl',
        menu_items_are_text: true,
        is_gradient: false,
        gradient: {
          from: 'gray-900',
          via: 'gray-800',
          to: 'gray-700'
        }
      };

      console.log('[HeaderEditContext] Final header style object to save:', headerStyleObject);

      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          settings: { 
            header_style: headerStyleObject 
          }
        })
      });

      if (!response.ok) throw new Error('Failed to save header style');
      setHeaderStyle(style);
      setHeaderStyleFull(headerStyleObject);

      // Revalidate cache
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: `org-${organizationId}` })
      });
    } catch (error) {
      console.error('[HeaderEditContext] Error saving header style:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [session]);

  const updateMenuItems = useCallback(async (items: MenuItem[]) => {
    setIsSaving(true);
    try {
      if (!session?.access_token) {
        throw new Error('No active session found. Please log in again.');
      }

      // Update all fields for menu items including translations
      const menuItemPromises = items.map((item, index) =>
        fetch(`/api/menu-items/${item.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            order: index * 10,
            display_name: item.display_name,
            display_name_translation: item.display_name_translation || {},
            description: item.description,
            description_translation: item.description_translation || {},
            url_name: item.url_name,
            is_displayed: item.is_displayed,
            is_displayed_on_footer: item.is_displayed_on_footer,
            menu_items_are_text: item.menu_items_are_text,
            react_icon_id: item.react_icon_id,
          })
        })
      );

      // Update submenu items with translations
      const submenuItemPromises = items.flatMap((item) =>
        (item.submenu_items || []).map((subItem) =>
          fetch(`/api/menu-items/${subItem.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              name: subItem.name,
              name_translation: subItem.name_translation || {},
              description: subItem.description,
              description_translation: subItem.description_translation || {},
              url_name: subItem.url_name,
              is_displayed: subItem.is_displayed,
              order: subItem.order,
              image: subItem.image,
            })
          })
        )
      );

      await Promise.all([...menuItemPromises, ...submenuItemPromises]);
      setMenuItems(items);

      // Revalidate cache
      if (items.length > 0) {
        await fetch('/api/revalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tag: `org-${items[0].organization_id}` })
        });
      }
    } catch (error) {
      console.error('[HeaderEditContext] Error updating menu items:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [session]);

  const updateMenuItem = useCallback(async (itemId: string, updates: Partial<MenuItem>) => {
    setIsSaving(true);
    try {
      if (!session?.access_token) {
        throw new Error('No active session found. Please log in again.');
      }

      const response = await fetch(`/api/menu-items/${itemId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to update menu item');
      const data = await response.json();

      // Update local state
      setMenuItems(prev =>
        prev.map(item => (item.id === itemId ? { ...item, ...data.menu_item } : item))
      );

      // Revalidate cache
      const item = menuItems.find(m => m.id === itemId);
      if (item) {
        await fetch('/api/revalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tag: `org-${item.organization_id}` })
        });
      }
    } catch (error) {
      console.error('[HeaderEditContext] Error updating menu item:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [session, menuItems]);

  const deleteMenuItem = useCallback(async (itemId: string) => {
    setIsSaving(true);
    try {
      if (!session?.access_token) {
        throw new Error('No active session found. Please log in again.');
      }

      const response = await fetch(`/api/menu-items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete menu item');

      // Update local state
      const item = menuItems.find(m => m.id === itemId);
      setMenuItems(prev => prev.filter(item => item.id !== itemId));

      // Revalidate cache
      if (item) {
        await fetch('/api/revalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tag: `org-${item.organization_id}` })
        });
      }
    } catch (error) {
      console.error('[HeaderEditContext] Error deleting menu item:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [session, menuItems]);

  const updateHeaderStyleFull = useCallback(async (organizationId: string, styleObject: any) => {
    setIsSaving(true);
    try {
      if (!session?.access_token) {
        throw new Error('No active session found. Please log in again.');
      }

      console.log('[HeaderEditContext] Updating full header style:', styleObject);

      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          settings: {
            header_style: styleObject
          }
        })
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update header style';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch (e) {
          // Response body is empty or not JSON
          errorMessage = `${errorMessage} (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }

      // Update local state
      setHeaderStyleFull(styleObject);
      if (styleObject.type) {
        setHeaderStyle(styleObject.type);
      }

      // Revalidate cache
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: `org-${organizationId}` })
      });

    } catch (error) {
      console.error('[HeaderEditContext] Error updating header style:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [session]);

  const value: HeaderEditContextType = {
    isOpen,
    isLoading,
    isSaving,
    organizationId,
    headerStyle,
    headerStyleFull,
    logoImageUrl,
    menuItems,
    openModal,
    closeModal,
    fetchHeaderData,
    saveHeaderStyle,
    updateHeaderStyleFull,
    updateMenuItems,
    updateMenuItem,
    deleteMenuItem
  };

  return (
    <HeaderEditContext.Provider value={value}>
      {children}
    </HeaderEditContext.Provider>
  );
};
