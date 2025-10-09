// components/SiteManagement/GlobalSettingsModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useGlobalSettingsModal } from '@/context/GlobalSettingsModalContext';
import SettingsFormFields from './SettingsFormFields';
import { createClient } from '@supabase/supabase-js';
import { getOrganizationId } from '@/lib/supabase';
import { Organization, Settings } from './types';

export default function GlobalSettingsModal() {
  const { isOpen, initialSection, closeModal } = useGlobalSettingsModal();
  const [organization, setOrganization] = useState<any>(null); // Use any to hold full API response with cookies, etc.
  const [settings, setSettings] = useState<Settings>({} as Settings);
  const [originalSettings, setOriginalSettings] = useState<Settings>({} as Settings);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (isOpen) {
      loadOrganizationAndSettings();
    }
  }, [isOpen]);

  // Track changes
  useEffect(() => {
    if (!isLoading && Object.keys(originalSettings).length > 0) {
      const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
      setHasChanges(changed);
    }
  }, [settings, originalSettings, isLoading]);

  const loadOrganizationAndSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get session
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (!session?.access_token) {
        throw new Error('No active session found');
      }

      // Get current organization ID
      const baseUrl = window.location.origin;
      const orgId = await getOrganizationId(baseUrl);

      if (!orgId) {
        throw new Error('Organization not found for current domain');
      }

      // Fetch complete organization data including all related tables via API
      // This matches what EditModal does to get cookies, banners, etc.
      const response = await fetch(`/api/organizations/${orgId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch organization data: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[GlobalSettingsModal] Fetched complete organization data:', data);
      console.log('[GlobalSettingsModal] Cookie categories:', data.cookie_categories);
      console.log('[GlobalSettingsModal] Cookie services:', data.cookie_services);
      console.log('[GlobalSettingsModal] Banners:', data.banners);

      // The API returns an object with separate properties:
      // { organization: {...}, settings: {...}, cookie_categories: [...], cookie_services: [...], etc. }
      // We need to store them separately for proper usage
      
      // Set organization (just the organization object, not the whole response)
      const organizationWithExtras = {
        ...data.organization,
        // Include all the related data at the top level for cookieData prop
        cookie_categories: data.cookie_categories || [],
        cookie_services: data.cookie_services || [],
        cookie_consent_records: data.cookie_consent_records || [],
        website_hero: data.website_hero,
        menu_items: data.menu_items || [],
        submenu_items: data.submenu_items || [],
        blog_posts: data.blog_posts || [],
        products: data.products || [],
        pricing_plans: data.pricing_plans || [],
        features: data.features || [],
        faqs: data.faqs || [],
        banners: data.banners || [],
        settings: data.settings
      };
      
      console.log('[GlobalSettingsModal] organizationWithExtras:', organizationWithExtras);
      console.log('[GlobalSettingsModal] organizationWithExtras.cookie_categories:', organizationWithExtras.cookie_categories);
      console.log('[GlobalSettingsModal] website_hero data:', data.website_hero);
      
      setOrganization(organizationWithExtras);

      // Extract settings from the organization data
      // IMPORTANT: Merge hero fields from website_hero table into settings
      const loadedSettings = {
        ...data.settings,
        // Include organization-level fields in settings
        name: data.organization.name,
        base_url: data.organization.base_url || '',
        base_url_local: data.organization.base_url_local || '',
        type: data.organization.type,
        // Ensure supported_locales is always an array
        supported_locales: Array.isArray(data.settings?.supported_locales) 
          ? data.settings.supported_locales 
          : data.settings?.supported_locales 
            ? [data.settings.supported_locales] 
            : ['en'],
        // Ensure language has a default
        language: data.settings?.language || 'en',
        
        // Hero Section Fields (merged from website_hero table)
        hero_image: data.website_hero?.image || null,
        hero_name: data.website_hero?.name || data.settings?.site || '',
        hero_font_family: data.website_hero?.font_family || '',
        h1_title: data.website_hero?.h1_title || '',
        h1_title_translation: data.website_hero?.h1_title_translation || {},
        is_seo_title: data.website_hero?.is_seo_title || false,
        p_description: data.website_hero?.p_description || '',
        p_description_translation: data.website_hero?.p_description_translation || {},
        h1_text_color: data.website_hero?.h1_text_color || 'gray-800',
        h1_text_color_gradient_from: data.website_hero?.h1_text_color_gradient_from || 'gray-800',
        h1_text_color_gradient_to: data.website_hero?.h1_text_color_gradient_to || 'blue-500',
        h1_text_color_gradient_via: data.website_hero?.h1_text_color_gradient_via || '',
        is_h1_gradient_text: data.website_hero?.is_h1_gradient_text || false,
        h1_text_size: data.website_hero?.h1_text_size || 'text-xl',
        h1_text_size_mobile: data.website_hero?.h1_text_size_mobile || 'text-lg',
        title_alighnement: data.website_hero?.title_alighnement || 'center',
        title_block_width: data.website_hero?.title_block_width || 'full',
        is_bg_gradient: data.website_hero?.is_bg_gradient || false,
        is_image_full_page: data.website_hero?.is_image_full_page || false,
        title_block_columns: data.website_hero?.title_block_columns || 1,
        image_first: data.website_hero?.image_first || false,
        background_color: data.website_hero?.background_color || 'white',
        background_color_gradient_from: data.website_hero?.background_color_gradient_from || 'white',
        background_color_gradient_to: data.website_hero?.background_color_gradient_to || 'gray-100',
        background_color_gradient_via: data.website_hero?.background_color_gradient_via || '',
        button_main_get_started: data.website_hero?.button_main_get_started || 'Get Started',
        button_explore: data.website_hero?.button_explore || 'Explore',
        animation_element: data.website_hero?.animation_element || '',
        
        // Features, FAQs, Banners, Products, Menu Items, Pricing Plans arrays (from their respective tables)
        features: data.features || [],
        faqs: data.faqs || [],
        banners: data.banners || [],
        products: data.products || [],
        pricing_plans: data.pricing_plans || [],
        menu_items: data.menu_items || [],
        submenu_items: data.submenu_items || [],
      };

      console.log('[GlobalSettingsModal] loadedSettings with hero fields:', loadedSettings);
      console.log('[GlobalSettingsModal] Features array:', data.features);
      console.log('[GlobalSettingsModal] FAQs array:', data.faqs);
      console.log('[GlobalSettingsModal] Banners array:', data.banners);
      console.log('[GlobalSettingsModal] Products array:', data.products);
      console.log('[GlobalSettingsModal] Pricing Plans array:', data.pricing_plans);
      console.log('[GlobalSettingsModal] Menu Items array:', data.menu_items);
      console.log('[GlobalSettingsModal] Submenu Items array:', data.submenu_items);

      setSettings(loadedSettings);
      setOriginalSettings(loadedSettings);
    } catch (err) {
      console.error('Error loading organization and settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (field: keyof Settings, value: any) => {
    console.log('[GlobalSettingsModal] handleSettingChange called:', { field, value, valueType: Array.isArray(value) ? 'array' : typeof value, length: Array.isArray(value) ? value.length : undefined });
    
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (field: 'image' | 'favicon' | 'hero_image') => {
    // Image upload logic would go here
    console.log('Image upload for field:', field);
  };

  const handleSave = async () => {
    if (!organization) return;

    try {
      setIsSaving(true);
      setError(null);

      // Get the current session token
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        throw new Error('No active session');
      }

      // Cast settings to any to access hero fields that are dynamically added
      const settingsAny = settings as any;

      // Prepare the data structure expected by the API
      // Separate hero fields from settings fields
      const heroFields = {
        hero_image: settingsAny.hero_image,
        hero_name: settingsAny.hero_name,
        hero_font_family: settingsAny.hero_font_family,
        h1_title: settingsAny.h1_title,
        h1_title_translation: settingsAny.h1_title_translation,
        is_seo_title: settingsAny.is_seo_title,
        p_description: settingsAny.p_description,
        p_description_translation: settingsAny.p_description_translation,
        h1_text_color: settingsAny.h1_text_color,
        h1_text_color_gradient_from: settingsAny.h1_text_color_gradient_from,
        h1_text_color_gradient_to: settingsAny.h1_text_color_gradient_to,
        h1_size: settingsAny.h1_size,
        h1_size_mobile: settingsAny.h1_size_mobile,
        h1_weight: settingsAny.h1_weight,
        h1_alignment: settingsAny.h1_alignment,
        p_description_size: settingsAny.p_description_size,
        p_description_size_mobile: settingsAny.p_description_size_mobile,
        p_description_weight: settingsAny.p_description_weight,
        p_description_color: settingsAny.p_description_color,
        button_main_get_started: settingsAny.button_main_get_started,
        button_main_get_started_translation: settingsAny.button_main_get_started_translation,
        button_main_url: settingsAny.button_main_url,
        button_secondary_text: settingsAny.button_secondary_text,
        button_secondary_text_translation: settingsAny.button_secondary_text_translation,
        button_secondary_url: settingsAny.button_secondary_url,
        buttons_alignment: settingsAny.buttons_alignment,
        background_video: settingsAny.background_video,
        background_animation: settingsAny.background_animation,
        block_width: settingsAny.block_width,
        columns: settingsAny.columns,
      };

      // Create clean settings object without hero, features, faqs, banners, products, pricing_plans, menu_items, submenu_items fields
      const cleanSettings = { ...settings };
      const fieldsToRemove = [
        ...Object.keys(heroFields),
        'features', 'faqs', 'banners', 'products', 'pricing_plans', 'menu_items', 'submenu_items'
      ];
      
      fieldsToRemove.forEach(key => {
        delete (cleanSettings as any)[key];
      });

      // Save settings via API using PUT method
      console.log('[GlobalSettingsModal] Saving settings:', {
        features: settingsAny.features?.length || 0,
        faqs: settingsAny.faqs?.length || 0,
        banners: settingsAny.banners?.length || 0,
        products: settingsAny.products?.length || 0,
        pricing_plans: settingsAny.pricing_plans?.length || 0,
        menu_items: settingsAny.menu_items?.length || 0,
        submenu_items: settingsAny.submenu_items?.length || 0,
      });
      
      console.log('[GlobalSettingsModal] Pricing plans data:', JSON.stringify(settingsAny.pricing_plans, null, 2));
      
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession.access_token}`,
        },
        body: JSON.stringify({
          settingsData: cleanSettings,
          heroData: heroFields,
          // Send arrays at top level (not inside settingsData)
          features: settingsAny.features,
          faqs: settingsAny.faqs,
          banners: settingsAny.banners,
          products: settingsAny.products,
          pricing_plans: settingsAny.pricing_plans,
          menu_items: settingsAny.menu_items,
          submenu_items: settingsAny.submenu_items,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      // Get the updated data from the response
      const responseData = await response.json();
      console.log('📥 Server response:', responseData);

      // Update settings with the server response (includes new IDs for created items)
      if (responseData.pricing_plans) {
        console.log('✅ Updating pricing_plans in state:', responseData.pricing_plans.length);
        setSettings({
          ...settings,
          pricing_plans: responseData.pricing_plans,
          products: responseData.products || settingsAny.products,
          features: responseData.features || settingsAny.features,
          faqs: responseData.faqs || settingsAny.faqs,
          banners: responseData.banners || settingsAny.banners,
          menu_items: responseData.menu_items || settingsAny.menu_items,
          submenu_items: responseData.submenu_items || settingsAny.submenu_items,
        });
      }

      setOriginalSettings({ ...settings });
      setHasChanges(false);

      // Show success message (you could add a toast here)
      console.log('Settings saved successfully');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        closeModal();
      }
    } else {
      closeModal();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Global Settings</h2>
              <p className="text-sm text-gray-600 mt-1">
                {organization?.name || 'Loading...'}
              </p>
              {hasChanges && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-full mt-2">
                  Unsaved changes
                </span>
              )}
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading settings...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-600 text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={loadOrganizationAndSettings}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : organization ? (
              <SettingsFormFields
                settings={settings}
                onChange={handleSettingChange}
                onImageUpload={handleImageUpload}
                uploadingImages={uploadingImages}
                isNarrow={false}
                cookieData={organization}
                session={session}
                organizationId={organization.id}
                readOnly={false}
                initialSection={initialSection}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">Organization not found</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              {hasChanges ? 'You have unsaved changes' : 'All changes saved'}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSaving}
              >
                {hasChanges ? 'Cancel' : 'Close'}
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
