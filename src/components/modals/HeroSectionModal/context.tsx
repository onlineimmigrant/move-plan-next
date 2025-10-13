'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useToast } from '@/components/Shared/ToastContainer';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types
interface HeroSectionData {
  id?: string;
  organization_id?: string;
  name?: string;
  font_family?: string;
  h1_title?: string;
  h1_title_translation?: Record<string, string>;
  is_seo_title?: boolean;
  seo_title?: string;
  p_description?: string;
  p_description_translation?: Record<string, string>;
  h1_text_color?: string;
  h1_text_color_gradient_from?: string;
  h1_text_color_gradient_to?: string;
  h1_text_color_gradient_via?: string;
  is_h1_gradient_text?: boolean;
  h1_text_size?: string;
  h1_text_size_mobile?: string;
  image?: string | null;
  image_position?: 'left' | 'right' | 'top' | 'bottom' | 'full';
  title_alighnement?: string;
  title_block_width?: string;
  is_bg_gradient?: boolean;
  is_image_full_page?: boolean; // Deprecated
  title_block_columns?: number;
  image_first?: boolean; // Deprecated
  background_color?: string;
  background_color_gradient_from?: string;
  background_color_gradient_to?: string;
  background_color_gradient_via?: string;
  button_main_get_started?: string;
  button_explore?: string;
  button_url?: string;
  button_main_above_description?: boolean;
  button_main_is_for_video?: boolean;
  animation_element?: string;
  p_description_color?: string;
  p_description_size?: string;
  p_description_size_mobile?: string;
  p_description_weight?: string;
}

interface HeroSectionEditContextType {
  isOpen: boolean;
  editingSection: HeroSectionData | null;
  mode: 'create' | 'edit';
  organizationId: string | null;
  openModal: (organizationId: string, section?: HeroSectionData) => void;
  closeModal: () => void;
  updateSection: (data: Partial<HeroSectionData>) => Promise<void>;
  deleteSection: () => Promise<void>;
}

const HeroSectionEditContext = createContext<HeroSectionEditContextType | undefined>(undefined);

export function useHeroSectionEdit() {
  const context = useContext(HeroSectionEditContext);
  if (!context) {
    throw new Error('useHeroSectionEdit must be used within HeroSectionEditProvider');
  }
  return context;
}

export function HeroSectionEditProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<HeroSectionData | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const { showToast } = useToast();

  // Get session on mount - using useCallback to prevent re-renders
  useEffect(() => {
    let isMounted = true;
    
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted && session) {
          setSession(session);
        }
      } catch (error) {
        console.error('[HeroSectionEditContext] Error getting session:', error);
      }
    };
    
    getSession();
    
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once on mount

  const openModal = useCallback((orgId: string, section?: HeroSectionData) => {
    console.log('[HeroSectionEditContext] openModal called:', { orgId, section });
    setOrganizationId(orgId);
    if (section && section.id) {
      setMode('edit');
      setEditingSection(section);
      console.log('[HeroSectionEditContext] Opening in EDIT mode with section:', section);
    } else {
      setMode('create');
      // Set default values for new section
      setEditingSection({
        organization_id: orgId,
        h1_title: '',
        p_description: '',
        h1_text_color: 'gray-800',
        h1_text_color_gradient_from: 'gray-800',
        h1_text_color_gradient_to: 'blue-500',
        h1_text_size: 'text-4xl',
        h1_text_size_mobile: 'text-2xl',
        p_description_size: 'text-lg',
        p_description_size_mobile: 'text-base',
        p_description_color: 'gray-600',
        p_description_weight: 'font-normal',
        title_alighnement: 'center',
        title_block_width: 'full',
        is_h1_gradient_text: false,
        is_bg_gradient: false,
        is_image_full_page: false,
        is_seo_title: false,
        image_first: false,
        title_block_columns: 1,
        h1_title_translation: {},
        p_description_translation: {},
      });
      console.log('[HeroSectionEditContext] Opening in CREATE mode');
    }
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    console.log('[HeroSectionEditContext] closeModal called');
    setIsOpen(false);
    setEditingSection(null);
    setMode('create');
    setOrganizationId(null);
  }, []);

  const updateSection = useCallback(async (data: Partial<HeroSectionData>) => {
    if (!organizationId) {
      console.error('[HeroSectionEditContext] Cannot update: no organizationId');
      showToast('error', 'Error: No organization selected');
      return;
    }

    try {
      console.log('[HeroSectionEditContext] updateSection called:', { mode, data });
      
      if (mode === 'create') {
        // Create new hero section
        const newSection: HeroSectionData = {
          ...data,
          organization_id: organizationId,
        };

        console.log('[HeroSectionEditContext] Creating new section with data:', newSection);

        if (!session?.access_token) {
          throw new Error('No active session found. Please log in again.');
        }

        const response = await fetch(`/api/organizations/${organizationId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ 
            website_hero: newSection
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create hero section');
        }

        const result = await response.json();
        console.log('[HeroSectionEditContext] Create response:', result);
        
        showToast('success', 'Hero section created successfully!');
        
        // Update local state
        setEditingSection(result.website_hero);
        setMode('edit');
        
        // Trigger page reload to show new section
        window.location.reload();
      } else {
        // Update existing hero section
        console.log('[HeroSectionEditContext] Updating existing section');
        console.log('[HeroSectionEditContext] Data to update:', data);
        console.log('[HeroSectionEditContext] Current editingSection:', editingSection);

        if (!editingSection?.id) {
          throw new Error('No hero section ID found for update');
        }

        // Merge existing data with updates
        const mergedData = {
          ...editingSection,
          ...data,
        };

        console.log('[HeroSectionEditContext] Background color in data:', data.background_color);
        console.log('[HeroSectionEditContext] Background color in editingSection:', editingSection.background_color);
        console.log('[HeroSectionEditContext] Background color in mergedData:', mergedData.background_color);

        // Filter out undefined values and deprecated fields to prevent PGRST204 errors
        const updatePayload: any = {};
        Object.keys(mergedData).forEach(key => {
          const value = mergedData[key as keyof typeof mergedData];
          // Skip undefined values and deprecated/non-existent fields
          // Note: We allow null values to be sent (to clear fields)
          if (value !== undefined && 
              key !== 'h1_title_color_id' && 
              key !== 'h1_title_part_2' && 
              key !== 'h1_title_part_3' &&
              key !== 'h1_title_part_2_translation' &&
              key !== 'h1_title_part_3_translation') {
            updatePayload[key] = value;
          }
        });

        console.log('[HeroSectionEditContext] Background color in updatePayload:', updatePayload.background_color);
        
        console.log('[HeroSectionEditContext] Full payload being sent:', updatePayload);
        console.log('[HeroSectionEditContext] API endpoint:', `/api/hero-section/${editingSection.id}`);

        const response = await fetch(`/api/hero-section/${editingSection.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload),
        });

        console.log('[HeroSectionEditContext] Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('[HeroSectionEditContext] Error response:', errorData);
          throw new Error(errorData.error || 'Failed to update hero section');
        }

        const result = await response.json();
        console.log('[HeroSectionEditContext] Update response:', result);

        showToast('success', 'Hero section updated successfully!');
        
        // Update local state
        setEditingSection({ ...editingSection, ...data });
        
        // Dispatch custom event to notify Hero component of updates
        window.dispatchEvent(new CustomEvent('hero-section-updated', { 
          detail: { ...editingSection, ...data } 
        }));
      }
    } catch (error: any) {
      console.error('[HeroSectionEditContext] Error updating section:', error);
      showToast('error', error.message || 'Failed to save hero section');
      throw error;
    }
  }, [mode, organizationId, editingSection, showToast]);

  const deleteSection = useCallback(async () => {
    if (!editingSection?.id || !organizationId) {
      showToast('error', 'Error: No section to delete');
      return;
    }

    try {
      console.log('[HeroSectionEditContext] Deleting section:', editingSection.id);

      if (!session?.access_token) {
        throw new Error('No active session found. Please log in again.');
      }

      // Delete by setting all fields to null/empty
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          website_hero: {
            id: editingSection.id,
            organization_id: organizationId,
            h1_title: '',
            p_description: '',
            image: null,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete hero section');
      }

      showToast('success', 'Hero section deleted successfully!');
      closeModal();
      
      // Trigger page reload
      window.location.reload();
    } catch (error: any) {
      console.error('[HeroSectionEditContext] Error deleting section:', error);
      showToast('error', error.message || 'Failed to delete hero section');
      throw error;
    }
  }, [editingSection, organizationId, showToast, closeModal]);

  const value = {
    isOpen,
    editingSection,
    mode,
    organizationId,
    openModal,
    closeModal,
    updateSection,
    deleteSection,
  };

  return (
    <HeroSectionEditContext.Provider value={value}>
      {children}
    </HeroSectionEditContext.Provider>
  );
}
