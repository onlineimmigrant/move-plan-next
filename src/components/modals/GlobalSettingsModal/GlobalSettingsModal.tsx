// components/SiteManagement/GlobalSettingsModal.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useGlobalSettingsModal } from './context';
import SettingsFormFields from '@/components/SiteManagement/SettingsFormFields';
import { createClient } from '@supabase/supabase-js';
import { BaseModal } from '@/components/modals/_shared/BaseModal';
import { getOrganizationId } from '@/lib/supabase';
import { Organization, Settings } from '@/components/SiteManagement/types';
import { loadSection, mergeSectionIntoSettings } from '@/lib/sectionLoader';

export default function GlobalSettingsModal() {
  const { isOpen, initialSection, closeModal } = useGlobalSettingsModal();
  const [organization, setOrganization] = useState<any>(null);
  const [settings, setSettings] = useState<Settings>({} as Settings);
  const [originalSettings, setOriginalSettings] = useState<Settings>({} as Settings);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0); // Trigger to retry loading when session is ready
  const sessionReadyRef = useRef(false); // Track if we've already triggered retry for session ready
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Active section state
  const [activeSection, setActiveSection] = useState<string>(initialSection || 'general');
  
  // Section caching state
  const [loadedSections, setLoadedSections] = useState<Set<string>>(new Set());
  const [loadingSections, setLoadingSections] = useState<Set<string>>(new Set());
  const [sectionCache, setSectionCache] = useState<Record<string, any>>({});

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Define sections with their parent relationships and metadata
  const sections = [
    { id: 'general', label: 'General', title: 'General Settings', subtitle: 'Basic organization configuration' },
    { id: 'hero', label: 'Hero Section', title: 'Hero Section', subtitle: 'Homepage hero banner configuration' },
    { id: 'products', label: 'Products', title: 'Products', subtitle: 'Manage your products and services', parent: 'content' },
    { id: 'features', label: 'Features', title: 'Features', subtitle: 'Manage feature highlights', parent: 'content' },
    { id: 'faqs', label: 'FAQs', title: 'FAQs', subtitle: 'Frequently asked questions', parent: 'content' },
    { id: 'banners', label: 'Banners', title: 'Banners', subtitle: 'Promotional banners and alerts', parent: 'content' },
    { id: 'menu', label: 'Menu', title: 'Menu', subtitle: 'Navigation menu configuration', parent: 'layout' },
    { id: 'blog', label: 'Blog', title: 'Blog Settings', subtitle: 'Blog posts and categories', parent: 'content' },
    { id: 'cookies', label: 'Cookies', title: 'Cookie Consent', subtitle: 'Cookie consent and privacy settings', parent: 'consent' },
    { id: 'meeting-types', label: 'Meeting Types', title: 'Meeting Types', subtitle: 'Manage meeting types for booking system', parent: 'meetings' },
  ];

  // Get current section metadata
  const getCurrentSection = () => {
    return sections.find(s => s.id === activeSection) || sections[0];
  };

  const currentSectionMeta = getCurrentSection();

  // Update active section when initialSection changes
  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  useEffect(() => {
    if (isOpen) {
      loadOrganizationAndSettings();
    } else {
      // Reset states when modal closes
      setRetryTrigger(0);
      sessionReadyRef.current = false;
    }
  }, [isOpen]);

  // Load section data when switching tabs (DISABLED - we load all data upfront now)
  useEffect(() => {
    // DISABLED: No lazy loading anymore
    return;
    
    const loadSectionData = async () => {
      // Don't load if modal isn't open or section already loaded
      if (!isOpen || !activeSection || loadedSections.has(activeSection) || loadingSections.has(activeSection)) {
        console.log(`⏭️ Skipping load for ${activeSection}:`, { isOpen, has: loadedSections.has(activeSection), loading: loadingSections.has(activeSection) });
        return;
      }

      // 'general' section is loaded by default, skip it
      if (activeSection === 'general') {
        console.log(`⏭️ Skipping 'general' - already loaded initially`);
        return;
      }

      // Need session and organization to be ready
      if (!session?.access_token || !organization?.id) {
        console.log(`⏳ Waiting for session and organization to load before fetching ${activeSection}`, { 
          hasSession: !!session?.access_token, 
          hasOrg: !!organization?.id 
        });
        return;
      }

      try {
        setLoadingSections(prev => new Set(prev).add(activeSection));
        console.log(`🔄 Lazy loading section: ${activeSection}`);

        // Load section data
        const sectionData = await loadSection(activeSection, organization.id, session.access_token);
        console.log(`📦 Received data for ${activeSection}:`, sectionData);

        // Cache the section data
        setSectionCache(prev => ({
          ...prev,
          [activeSection]: sectionData
        }));

        // Merge into settings - use callback to get latest settings
        let mergedSettings: any;
        setSettings((currentSettings: any) => {
          mergedSettings = mergeSectionIntoSettings(activeSection, sectionData, currentSettings);
          console.log(`🔀 Merged ${activeSection} data into settings:`, {
            section: activeSection,
            dataKeys: Object.keys(sectionData),
            currentProducts: currentSettings.products?.length,
            mergedProducts: mergedSettings.products?.length,
            currentBanners: currentSettings.banners?.length,
            mergedBanners: mergedSettings.banners?.length,
            currentFeatures: currentSettings.features?.length,
            mergedFeatures: mergedSettings.features?.length
          });
          return mergedSettings;
        });
        
        // Update original settings with a DEEP CLONE to avoid reference sharing
        // This ensures changes to arrays in settings don't affect originalSettings
        // Use structuredClone for safer deep cloning (handles undefined, Date, etc.)
        setOriginalSettings(structuredClone(mergedSettings));

        // Also update organization object for components that expect it there
        setOrganization((prev: any) => {
          const updated = {
            ...prev,
            ...sectionData
          };
          console.log(`🏢 Updated organization for ${activeSection}:`, {
            hasBanners: !!updated.banners,
            bannersLength: updated.banners?.length
          });
          return updated;
        });

        // Mark as loaded
        setLoadedSections(prev => new Set(prev).add(activeSection));
        console.log(`✅ Section ${activeSection} loaded and cached`);

      } catch (err) {
        console.error(`❌ Error loading section ${activeSection}:`, err);
        // Don't show error to user, just log it
      } finally {
        setLoadingSections(prev => {
          const newSet = new Set(prev);
          newSet.delete(activeSection);
          return newSet;
        });
      }
    };

    loadSectionData();
    // Only depend on activeSection, isOpen, and retryTrigger changes
    // session and organization are checked inside but not dependencies to avoid loops
  }, [activeSection, isOpen, retryTrigger]);

  // When session and organization become ready, OR when switching sections (DISABLED - no lazy loading)
  useEffect(() => {
    // DISABLED: No lazy loading anymore
    return;
    console.log(`🔍 Retry effect checking:`, {
      activeSection,
      isOpen,
      hasSession: !!session?.access_token,
      hasOrg: !!organization?.id,
      sessionReady: sessionReadyRef.current,
      loadedSections: Array.from(loadedSections),
      loadingSections: Array.from(loadingSections),
      isAlreadyLoaded: loadedSections.has(activeSection),
      isCurrentlyLoading: loadingSections.has(activeSection)
    });
    
    // Check if session is ready and we have an active section that needs loading
    if (isOpen && session?.access_token && organization?.id && activeSection && activeSection !== 'general') {
      // Check if current active section needs to be loaded
      if (!loadedSections.has(activeSection) && !loadingSections.has(activeSection)) {
        // Only log "session ready" on the first trigger
        if (!sessionReadyRef.current) {
          console.log(`✨ Session ready, triggering load of active section: ${activeSection}`);
          sessionReadyRef.current = true;
        } else {
          console.log(`🔄 Section changed to ${activeSection}, checking if load needed`);
        }
        setRetryTrigger(prev => {
          console.log(`📈 Incrementing retryTrigger from ${prev} to ${prev + 1}`);
          return prev + 1;
        });
      } else {
        console.log(`✓ Section ${activeSection} already loaded or loading, skipping`);
      }
    }
  }, [session?.access_token, organization?.id, isOpen, activeSection, loadedSections, loadingSections]); // Added loadedSections and loadingSections

  // Track changes
  useEffect(() => {
    if (!isLoading && originalSettings && Object.keys(originalSettings).length > 0) {
      const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
      console.log('[GlobalSettingsModal] 🔍 Checking for changes:', {
        changed,
        settingsKeys: Object.keys(settings),
        originalKeys: Object.keys(originalSettings),
        hasProducts: 'products' in settings,
        hasBanners: 'banners' in settings,
        productsLength: settings.products?.length,
        bannersLength: settings.banners?.length
      });
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

      // REVERT TO ORIGINAL: Load ALL data upfront (no lazy-loading)
      console.log('📥 Loading complete organization data...');
      
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

      // Set organization with ALL related data
      const organizationWithExtras = {
        ...data.organization,
        settings: data.settings,
        website_hero: data.website_hero,
        menu_items: data.menu_items || [],
        submenu_items: data.submenu_items || [],
        blog_posts: data.blog_posts || [],
        products: data.products || [],
        pricing_plans: data.pricing_plans || [],
        features: data.features || [],
        faqs: data.faqs || [],
        banners: data.banners || [],
        cookie_categories: data.cookie_categories || [],
        cookie_services: data.cookie_services || [],
        cookie_consent_records: data.cookie_consent_records || []
      };
      
      console.log('[GlobalSettingsModal] organizationWithExtras:', organizationWithExtras);
      
      setOrganization(organizationWithExtras);

      // Extract settings from the organization data including ALL arrays
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
        
        // Hero Section Fields
        hero_image: data.website_hero?.hero_image || null,
        hero_name: data.website_hero?.hero_name || data.settings?.site || '',
        hero_font_family: data.website_hero?.hero_font_family || '',
        h1_title: data.website_hero?.h1_title || '',
        h1_title_translation: data.website_hero?.h1_title_translation || {},
        is_seo_title: data.website_hero?.is_seo_title || false,
        p_description: data.website_hero?.p_description || '',
        p_description_translation: data.website_hero?.p_description_translation || {},
        h1_text_color: data.website_hero?.h1_text_color || 'gray-800',
        h1_text_color_gradient_from: data.website_hero?.h1_text_color_gradient_from || 'gray-800',
        h1_text_color_gradient_to: data.website_hero?.h1_text_color_gradient_to || 'blue-500',
        h1_size: data.website_hero?.h1_size || 'text-4xl',
        h1_size_mobile: data.website_hero?.h1_size_mobile || 'text-2xl',
        h1_weight: data.website_hero?.h1_weight || 'font-bold',
        h1_alignment: data.website_hero?.h1_alignment || 'center',
        p_description_size: data.website_hero?.p_description_size || 'text-lg',
        p_description_size_mobile: data.website_hero?.p_description_size_mobile || 'text-base',
        p_description_weight: data.website_hero?.p_description_weight || 'font-normal',
        p_description_color: data.website_hero?.p_description_color || 'gray-600',
        button_main_get_started: data.website_hero?.button_main_get_started || 'Get Started',
        button_main_get_started_translation: data.website_hero?.button_main_get_started_translation || {},
        button_main_url: data.website_hero?.button_main_url || '',
        button_secondary_text: data.website_hero?.button_secondary_text || '',
        button_secondary_text_translation: data.website_hero?.button_secondary_text_translation || {},
        button_secondary_url: data.website_hero?.button_secondary_url || '',
        buttons_alignment: data.website_hero?.buttons_alignment || 'center',
        background_video: data.website_hero?.background_video || '',
        background_animation: data.website_hero?.background_animation || '',
        block_width: data.website_hero?.block_width || 'max-w-7xl',
        columns: data.website_hero?.columns || 1,
        
        // All entity arrays - LOAD UPFRONT
        features: data.features || [],
        faqs: data.faqs || [],
        banners: data.banners || [],
        blog_posts: data.blog_posts || [],
        products: data.products || [],
        pricing_plans: data.pricing_plans || [],
        menu_items: data.menu_items || [],
        submenu_items: data.submenu_items || []
      };

      console.log('[GlobalSettingsModal] loadedSettings with all data:', loadedSettings);

      setSettings(loadedSettings);
      // Deep clone to avoid reference sharing between settings and originalSettings
      // Use structuredClone for safer deep cloning (handles undefined, Date, etc.)
      setOriginalSettings(structuredClone(loadedSettings));
      
      // Mark ALL sections as loaded since we fetched everything
      setLoadedSections(new Set(['general', 'hero', 'products', 'features', 'faqs', 'banners', 'menu', 'blog', 'cookies']));
      console.log('✅ All data loaded upfront');
      
    } catch (err) {
      console.error('Error loading organization and settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (field: keyof Settings, value: any) => {
    console.log('[GlobalSettingsModal] 🔧 handleSettingChange called:', { 
      field, 
      valueType: Array.isArray(value) ? 'array' : typeof value, 
      arrayLength: Array.isArray(value) ? value.length : undefined,
      value: Array.isArray(value) ? value : (typeof value === 'object' ? 'object' : value)
    });
    
    // Special logging for footer_style
    if (field === 'footer_style') {
      console.log('[GlobalSettingsModal] 🎨 FOOTER_STYLE CHANGE:', {
        field,
        value,
        valueType: typeof value,
        isObject: typeof value === 'object',
        stringified: JSON.stringify(value)
      });
    }
    
    setSettings(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      console.log('[GlobalSettingsModal] 📝 Settings updated, new keys:', Object.keys(updated));
      
      // Special logging for footer_style
      if (field === 'footer_style') {
        console.log('[GlobalSettingsModal] 🎨 Settings state after update:', {
          footer_style: updated.footer_style,
          footer_style_type: typeof updated.footer_style,
          footer_style_json: JSON.stringify(updated.footer_style)
        });
      }
      
      return updated;
    });
  };

  const handleImageUpload = async (field: 'image' | 'favicon' | 'hero_image') => {
    // Image upload logic would go here
    console.log('Image upload for field:', field);
  };

  const handleSave = async () => {
    console.log('🚀🚀🚀 HANDLE SAVE CALLED');
    console.log('Organization:', organization);
    console.log('Settings:', settings);
    
    if (!organization) {
      console.log('❌ No organization, returning');
      return;
    }

    try {
      console.log('✅ Starting save process');
      setIsSaving(true);
      setError(null);

      // Get the current session token
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      console.log('Session retrieved:', !!currentSession);
      
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

      // Create clean settings object without hero, features, faqs, banners, blog_posts, products, pricing_plans, menu_items, submenu_items fields
      const cleanSettings = { ...settings };
      const fieldsToRemove = [
        ...Object.keys(heroFields),
        'features', 'faqs', 'banners', 'blog_posts', 'products', 'pricing_plans', 'menu_items', 'submenu_items'
      ];
      
      fieldsToRemove.forEach(key => {
        delete (cleanSettings as any)[key];
      });

      // Save settings via API using PUT method
      console.log('[GlobalSettingsModal] 💾💾💾 FULL SETTINGS OBJECT:', settingsAny);
      console.log('[GlobalSettingsModal] Saving settings counts:', {
        features: settingsAny.features?.length || 0,
        faqs: settingsAny.faqs?.length || 0,
        banners: settingsAny.banners?.length || 0,
        blog_posts: settingsAny.blog_posts?.length || 0,
        products: settingsAny.products?.length || 0,
        pricing_plans: settingsAny.pricing_plans?.length || 0,
        menu_items: settingsAny.menu_items?.length || 0,
        submenu_items: settingsAny.submenu_items?.length || 0,
      });
      console.log('[GlobalSettingsModal] Settings keys:', Object.keys(settingsAny));
      console.log('[GlobalSettingsModal] Has banners?', 'banners' in settingsAny, 'Value:', settingsAny.banners);
      console.log('[GlobalSettingsModal] Has blog_posts?', 'blog_posts' in settingsAny, 'Value:', settingsAny.blog_posts);
      console.log('[GlobalSettingsModal] Has products?', 'products' in settingsAny, 'Value:', settingsAny.products);
      console.log('[GlobalSettingsModal] Has features?', 'features' in settingsAny, 'Value:', settingsAny.features);
      
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
          blog_posts: settingsAny.blog_posts,
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

      // Clear section cache since data has been updated
      setLoadedSections(new Set());
      setSectionCache({});
      setLoadingSections(new Set());
      
      // Reload general section data from server
      await loadOrganizationAndSettings();
      
      // If we're viewing a non-general section, reload it
      if (activeSection !== 'general') {
        try {
          console.log(`🔄 Reloading current section: ${activeSection}`);
          const sectionData = await loadSection(activeSection, organization.id, currentSession.access_token);
          
          // Cache it
          setSectionCache({ [activeSection]: sectionData });
          
          // Merge into settings
          const updatedSettings = mergeSectionIntoSettings(activeSection, sectionData, settings);
          setSettings(updatedSettings);
          // Deep clone to prevent reference sharing
          setOriginalSettings(structuredClone(updatedSettings));
          
          // Update organization
          setOrganization((prev: any) => ({
            ...prev,
            ...sectionData
          }));
          
          // Mark as loaded
          setLoadedSections(new Set(['general', activeSection]));
          console.log(`✅ Section ${activeSection} reloaded after save`);
        } catch (err) {
          console.error(`Error reloading section ${activeSection}:`, err);
        }
      }

      setHasChanges(false);

      // Show success message (you could add a toast here)
      console.log('✅ Settings saved and reloaded successfully');
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
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={currentSectionMeta.title}
      subtitle={currentSectionMeta.subtitle}
      showCloseButton
      showFullscreenButton
      size="xl"
      draggable={!isFullscreen}
      resizable={!isFullscreen}
      fullscreen={isFullscreen}
      onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      noPadding
      showFooter={false}
    >
      <div className="flex flex-col h-full">
        {/* Unsaved changes indicator - Fixed at top */}
        {hasChanges && (
          <div className="flex-shrink-0 px-6 pt-6 pb-2">
            <span className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Unsaved changes
            </span>
          </div>
        )}

        {/* Section Navigation - Fixed panel under header */}
        <div className="flex-shrink-0 border-b border-sky-100 bg-gradient-to-r from-sky-50 via-white to-sky-50 px-6 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-sky-200 scrollbar-track-transparent pb-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                  activeSection === section.id
                    ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-sky-50 hover:text-sky-700 border border-gray-200 hover:border-sky-300'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content - Scrollable with full width for child disclosures */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="relative mx-auto mb-6 h-16 w-16">
                    <div className="absolute inset-0 rounded-full border-4 border-sky-100"></div>
                    <div className="absolute inset-0 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
                  </div>
                  <p className="text-sm font-medium text-gray-700">Loading settings...</p>
                  <p className="text-xs text-gray-500 mt-1">Please wait</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center mb-6 shadow-lg shadow-red-500/20">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load</h3>
                <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
                <button
                  onClick={loadOrganizationAndSettings}
                  className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-sky-600 text-white text-sm font-medium rounded-lg hover:from-sky-600 hover:to-sky-700 transition-all shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40 hover:scale-105"
                >
                  Retry
                </button>
              </div>
            ) : organization ? (
              <SettingsFormFields
                key={`section-${activeSection}-loaded-${loadedSections.has(activeSection)}`}
                settings={settings}
                onChange={handleSettingChange}
                onImageUpload={handleImageUpload}
                uploadingImages={uploadingImages}
                isNarrow={false}
                cookieData={organization}
                session={session}
                organizationId={organization.id}
                readOnly={false}
                initialSection={activeSection}
              />
            ) : (
              <div className="text-center py-16">
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mb-6 shadow-lg">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600">Organization not found</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-sky-500 to-sky-600 rounded-lg hover:from-sky-600 hover:to-sky-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
