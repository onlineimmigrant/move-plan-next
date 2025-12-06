'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

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

interface FooterEditContextType {
  isOpen: boolean;
  isLoading: boolean;
  isSaving: boolean;
  organizationId: string | null;
  footerStyle: string;
  footerStyleFull: any; // Full JSONB object
  menuItems: MenuItem[];
  openModal: (organizationId: string) => void;
  closeModal: () => void;
  fetchFooterData: (organizationId: string) => Promise<void>;
  saveFooterStyle: (organizationId: string, style: string) => Promise<void>;
  updateFooterStyleFull: (organizationId: string, styleObject: any) => Promise<void>;
  updateMenuItems: (items: MenuItem[]) => Promise<void>;
  updateMenuItem: (itemId: string, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (itemId: string) => Promise<void>;
}

const FooterEditContext = createContext<FooterEditContextType | undefined>(undefined);

export const useFooterEdit = () => {
  const context = useContext(FooterEditContext);
  if (!context) {
    // Return safe defaults when provider not loaded yet (during deferred initialization)
    return {
      isOpen: false,
      isLoading: false,
      isSaving: false,
      organizationId: null,
      footerType: 'default',
      footerStyle: 'default',
      footerStyleFull: null,
      menuItems: [],
      openModal: () => {},
      closeModal: () => {},
      fetchFooterData: async () => {},
      saveFooterStyle: async () => {},
      updateFooterStyleFull: async () => {},
      updateMenuItems: async () => {},
      addMenuItem: async () => {},
      updateMenuItem: async () => {},
      deleteMenuItem: async () => {},
    };
  }
  return context;
};

export const FooterEditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [footerStyle, setFooterStyle] = useState('default');
  const [footerStyleFull, setFooterStyleFull] = useState<any>(null); // Store full JSONB object
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
        console.error('[FooterEditContext] Error getting session:', error);
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

  const fetchFooterData = useCallback(async (organizationId: string) => {
    setIsLoading(true);
    try {
      // Get fresh session each time to avoid stale session issues
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      
      if (!freshSession?.access_token) {
        throw new Error('No active session found. Please log in again.');
      }

      // Fetch organization data for footer style
      const orgResponse = await fetch(`/api/organizations/${organizationId}`, {
        headers: {
          'Authorization': `Bearer ${freshSession.access_token}`
        }
      });
      if (!orgResponse.ok) throw new Error('Failed to fetch organization');
      const orgData = await orgResponse.json();
      
      console.log('[FooterEditContext] Fetched data:', {
        hasSettings: !!orgData.settings,
        footerStyle: orgData.settings?.footer_style,
        footerStyleType: typeof orgData.settings?.footer_style
      });
      
      // Extract footer_style from settings (not organization)
      const footerStyleData = orgData.settings?.footer_style;
      
      if (typeof footerStyleData === 'object' && footerStyleData !== null) {
        // Store full object and extract type
        console.log('[FooterEditContext] Storing full footer style object:', footerStyleData);
        setFooterStyleFull(footerStyleData);
        setFooterStyle(footerStyleData.type || 'default');
      } else if (typeof footerStyleData === 'string') {
        // Legacy string format
        console.log('[FooterEditContext] Legacy string format:', footerStyleData);
        setFooterStyleFull(null);
        setFooterStyle(footerStyleData);
      } else {
        // No style data
        console.log('[FooterEditContext] No footer style data, using default');
        setFooterStyleFull(null);
        setFooterStyle('default');
      }

      // Fetch ALL menu items (both visible and hidden for footer)
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
      
      console.log('[FooterEditContext] Raw API response:', {
        count: menuData.menu_items?.length || 0,
        firstItem: menuData.menu_items?.[0],
        hasWebsiteSubmenuitem: !!menuData.menu_items?.[0]?.website_submenuitem
      });
      
      // Map website_submenuitem to submenu_items for consistency
      const mappedMenuItems = (menuData.menu_items || []).map((item: any) => ({
        ...item,
        submenu_items: item.website_submenuitem || []
      }));
      
      console.log('[FooterEditContext] Mapped menu items with submenus:', {
        count: mappedMenuItems.length,
        withSubmenus: mappedMenuItems.filter((item: any) => item.submenu_items?.length > 0).length,
        firstItemSubmenus: mappedMenuItems[0]?.submenu_items
      });
      
      setMenuItems(mappedMenuItems);
    } catch (error) {
      console.error('[FooterEditContext] Error fetching footer data:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []); // Remove session dependency

  // Fetch footer data when modal opens with an organizationId
  useEffect(() => {
    if (isOpen && organizationId) {
      fetchFooterData(organizationId).catch(error => {
        console.error('[FooterEditContext] Error fetching footer data:', error);
      });
    }
  }, [isOpen, organizationId, fetchFooterData]); // Remove session?.access_token dependency

  const saveFooterStyle = useCallback(async (organizationId: string, style: string) => {
    setIsSaving(true);
    try {
      if (!session?.access_token) {
        throw new Error('No active session found. Please log in again.');
      }

      console.log('[FooterEditContext] Starting save - current state:', {
        newType: style,
        currentFooterStyleFull: footerStyleFull,
        willUseSpread: !!footerStyleFull
      });

      // ALWAYS fetch the current database value before saving to ensure we have latest data
      const fetchResponse = await fetch(`/api/organizations/${organizationId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!fetchResponse.ok) {
        throw new Error('Failed to fetch current footer style');
      }
      
      const currentData = await fetchResponse.json();
      const currentFooterStyle = currentData.settings?.footer_style;
      
      console.log('[FooterEditContext] Fetched current footer_style from DB:', {
        value: currentFooterStyle,
        type: typeof currentFooterStyle,
        stringified: JSON.stringify(currentFooterStyle)
      });

      // Preserve existing footer_style values from DB, only update the type
      const footerStyleObject = (currentFooterStyle && typeof currentFooterStyle === 'object') ? {
        ...currentFooterStyle,
        type: style
      } : {
        type: style,
        background: 'gray-900',
        color: 'gray-400',
        color_hover: 'white',
        is_gradient: false,
        gradient: {
          from: 'gray-900',
          via: 'gray-800',
          to: 'gray-700'
        }
      };

      console.log('[FooterEditContext] Final footer style object to save:', footerStyleObject);

      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          settings: { 
            footer_style: footerStyleObject 
          }
        })
      });

      if (!response.ok) throw new Error('Failed to save footer style');
      setFooterStyle(style);
      setFooterStyleFull(footerStyleObject);

      // Revalidate cache
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: `org-${organizationId}` })
      });
    } catch (error) {
      console.error('[FooterEditContext] Error saving footer style:', error);
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

      // Update menu items with all fields including translations
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
            description: item.description,
            display_name_translation: item.display_name_translation || {},
            description_translation: item.description_translation || {},
            url_name: item.url_name,
            is_displayed: item.is_displayed,
            is_displayed_on_footer: item.is_displayed_on_footer,
            menu_items_are_text: item.menu_items_are_text,
            react_icon_id: item.react_icon_id,
          })
        })
      );

      await Promise.all(menuItemPromises);

      // Update submenu items with translations
      for (const item of items) {
        if (item.submenu_items && item.submenu_items.length > 0) {
          const submenuPromises = item.submenu_items.map((subItem) =>
            fetch(`/api/submenu-items/${subItem.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                name: subItem.name,
                description: subItem.description,
                name_translation: subItem.name_translation || {},
                description_translation: subItem.description_translation || {},
                url_name: subItem.url_name,
                order: subItem.order,
                is_displayed: subItem.is_displayed,
                image: subItem.image,
              })
            })
          );
          await Promise.all(submenuPromises);
        }
      }

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
      console.error('[FooterEditContext] Error updating menu items:', error);
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
      console.error('[FooterEditContext] Error updating menu item:', error);
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
      console.error('[FooterEditContext] Error deleting menu item:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [session, menuItems]);

  const updateFooterStyleFull = useCallback(async (organizationId: string, styleObject: any) => {
    setIsSaving(true);
    try {
      if (!session?.access_token) {
        throw new Error('No active session found. Please log in again.');
      }

      console.log('[FooterEditContext] Updating full footer style:', styleObject);

      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          settings: {
            footer_style: styleObject
          }
        })
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update footer style';
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
      setFooterStyleFull(styleObject);
      if (styleObject.type) {
        setFooterStyle(styleObject.type);
      }

      // Revalidate cache
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: `org-${organizationId}` })
      });

    } catch (error) {
      console.error('[FooterEditContext] Error updating footer style:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [session]);

  const value: FooterEditContextType = {
    isOpen,
    isLoading,
    isSaving,
    organizationId,
    footerStyle,
    footerStyleFull,
    menuItems,
    openModal,
    closeModal,
    fetchFooterData,
    saveFooterStyle,
    updateFooterStyleFull,
    updateMenuItems,
    updateMenuItem,
    deleteMenuItem
  };

  return (
    <FooterEditContext.Provider value={value}>
      {children}
    </FooterEditContext.Provider>
  );
};
