import React, { useState, useEffect, useRef } from 'react';
import { Settings } from './types';
import { DisclosureSection } from './DisclosureSection';
import { SubsectionDisclosure } from './SubsectionDisclosure';
import { sectionsConfig, renderField } from './fieldConfig';
import { TranslationsField } from './TranslationsField';

interface SettingsFormFieldsProps {
  settings: Settings;
  onChange: (field: keyof Settings, value: any) => void;
  onImageUpload: (field: 'image' | 'favicon' | 'hero_image') => void;
  uploadingImages: Set<string>;
  isNarrow?: boolean;
  cookieData?: {
    cookie_categories?: any[];
    cookie_services?: any[];
    cookie_consent_records?: any[];
  };
  session?: any;
  organizationId?: string;
  resetKey?: number; // Add reset key to force re-initialization
  readOnly?: boolean; // Add read-only mode
  initialSection?: string; // Section key to open initially (e.g., 'hero', 'branding')
}

const SettingsFormFields: React.FC<SettingsFormFieldsProps> = ({ 
  settings, 
  onChange, 
  onImageUpload, 
  uploadingImages,
  isNarrow = false,
  cookieData,
  readOnly = false,
  session,
  organizationId,
  resetKey = 0,
  initialSection
}) => {
  const [sectionStates, setSectionStates] = useState<Record<string, boolean>>({});
  const [lastActiveSections, setLastActiveSections] = useState<Set<string>>(new Set());
  const lastInitialSection = useRef<string | undefined>(undefined); // Track last initial section

  // Debug: Track changes to cookie_services
  useEffect(() => {
    console.log('🍪 [SettingsFormFields] settings.cookie_services changed:', settings.cookie_services);
    console.log('🍪 [SettingsFormFields] new count:', Array.isArray(settings.cookie_services) ? settings.cookie_services.length : 0);
  }, [settings.cookie_services]);

  // Initialize section states - reset when resetKey changes
  useEffect(() => {
    console.log('[SettingsFormFields] Initializing section states, resetKey:', resetKey);
    
    const storedStates = sessionStorage.getItem('siteManagement_sectionStates');
    if (storedStates && resetKey === 0) {
      try {
        const parsed = JSON.parse(storedStates);
        // Validate that stored states match current sections
        const validatedStates: Record<string, boolean> = {};
        sectionsConfig.forEach(section => {
          validatedStates[section.key] = parsed[section.key] || false;
        });
        // All sections start closed - no need to default any section to open
        setSectionStates(validatedStates);
        console.log('[SettingsFormFields] Loaded states from sessionStorage:', validatedStates);
      } catch {
        // Fallback to default if parsing fails
        const initialStates: Record<string, boolean> = {};
        sectionsConfig.forEach(section => {
          initialStates[section.key] = false; // All sections start closed
        });
        setSectionStates(initialStates);
        console.log('[SettingsFormFields] Fallback to default closed states');
      }
    } else {
      const initialStates: Record<string, boolean> = {};
      sectionsConfig.forEach(section => {
        // All sections start closed by default
        initialStates[section.key] = false;
      });
      setSectionStates(initialStates);
      console.log('[SettingsFormFields] Set all sections to closed, resetKey:', resetKey);
    }
  }, [resetKey]);

  // Open initial section if specified
  useEffect(() => {
    if (initialSection && initialSection !== lastInitialSection.current) {
      console.log('[SettingsFormFields] Opening initial section:', initialSection);
      
      // Mapping from modal tabs to section keys for opening
      const sectionKeyMapping: Record<string, string> = {
        'general': 'general',
        'hero': 'hero',
        'products': 'content',
        'features': 'content',
        'faqs': 'content',
        'banners': 'content',
        'menu': 'layout',
        'blog': 'content',
        'cookies': 'consent',
      };
      
      const sectionKeyToOpen = sectionKeyMapping[initialSection] || initialSection;
      
      setSectionStates(prev => ({
        ...prev,
        [sectionKeyToOpen]: true
      }));
      lastInitialSection.current = initialSection;
    }
  }, [initialSection, sectionStates]); // Depend on both to ensure state is ready

  // Save section states to sessionStorage whenever they change
  useEffect(() => {
    if (Object.keys(sectionStates).length > 0) {
      sessionStorage.setItem('siteManagement_sectionStates', JSON.stringify(sectionStates));
    }
  }, [sectionStates]);

  // Clean up function to reset states if needed (can be called externally)
  const resetSectionStates = () => {
    sessionStorage.removeItem('siteManagement_sectionStates');
    const initialStates: Record<string, boolean> = {};
    sectionsConfig.forEach(section => {
      initialStates[section.key] = false; // All sections start closed
    });
    setSectionStates(initialStates);
  };

  // Helper function to check if a field has meaningful data
  const hasFieldData = (fieldName: keyof Settings): boolean => {
    const value = settings[fieldName];
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'boolean') return true; // Booleans are always considered "data"
    return true; // Other truthy values
  };

  // Helper function to get detailed subsection statuses
  const getSubsectionStatuses = (section: any) => {
    if (!section.subsections) return [];
    
    return section.subsections.map((subsection: any) => {
      const fieldStatuses = subsection.fields ? subsection.fields.map((field: any) => ({
        hasData: hasFieldData(field.name),
        isEmpty: !hasFieldData(field.name),
        name: field.name
      })) : [];
      
      const hasData = fieldStatuses.some((f: any) => f.hasData);
      const isEmpty = fieldStatuses.every((f: any) => f.isEmpty);
      const allFieldsFilled = fieldStatuses.length > 0 && fieldStatuses.every((f: any) => f.hasData);
      
      return {
        hasData: allFieldsFilled, // Changed: only true if ALL fields are filled
        isEmpty: !allFieldsFilled, // Changed: true if ANY field is missing
        allFieldsFilled,
        title: subsection.title,
        fieldStatuses
      };
    });
  };

  // Helper function to get detailed field statuses for a subsection
  const getFieldStatuses = (subsection: any) => {
    if (!subsection.fields) return [];
    
    return subsection.fields.map((field: any) => ({
      hasData: hasFieldData(field.name),
      isEmpty: !hasFieldData(field.name),
      name: field.label || field.name
    }));
  };

  // Helper function to check if a section has data
  const checkSectionData = (section: any) => {
    if (section.fields) {
      const hasData = section.fields.some((field: any) => hasFieldData(field.name));
      const isEmpty = section.fields.every((field: any) => !hasFieldData(field.name));
      return { hasData, isEmpty };
    }
    if (section.subsections) {
      const subsectionStatuses = getSubsectionStatuses(section);
      const hasData = subsectionStatuses.some((s: any) => s.hasData);
      const isEmpty = subsectionStatuses.every((s: any) => s.isEmpty);
      const allSubsectionsFilled = subsectionStatuses.length > 0 && subsectionStatuses.every((s: any) => s.allFieldsFilled);
      
      return { 
        hasData, 
        isEmpty, 
        subsectionStatuses: subsectionStatuses.map((s: any) => ({
          hasData: s.hasData,
          isEmpty: s.isEmpty,
          title: s.title
        })),
        allSubsectionsFilled
      };
    }
    return { hasData: false, isEmpty: true };
  };

  // Helper function to check if a subsection has data
  const checkSubsectionData = (subsection: any) => {
    if (subsection.fields) {
      const fieldStatuses = getFieldStatuses(subsection);
      const hasData = fieldStatuses.some((f: any) => f.hasData);
      const isEmpty = fieldStatuses.every((f: any) => f.isEmpty);
      const allFieldsFilled = fieldStatuses.length > 0 && fieldStatuses.every((f: any) => f.hasData);
      
      return { 
        hasData, 
        isEmpty, 
        fieldStatuses,
        allFieldsFilled
      };
    }
    return { hasData: false, isEmpty: true };
  };

  const handleSectionToggle = (sectionKey: string, isOpen: boolean) => {
    setSectionStates(prev => ({
      ...prev,
      [sectionKey]: isOpen
    }));

    // Track which sections are being actively used
    if (isOpen) {
      setLastActiveSections(prev => new Set([...prev, sectionKey]));
    }
  };

  // Helper function to get grid classes - always single column for better UX
  const getGridClasses = (columns: number = 2) => {
    // Always use single column layout for better readability and consistent UX
    return 'grid grid-cols-1 gap-6';
  };

  // Helper function to get subsection grid classes - hybrid CSS-only approach
  const getSubsectionGridClasses = (sectionKey?: string) => {
    // AI Management section should always be full width (single column)
    if (sectionKey === 'ai-management') {
      return 'grid grid-cols-1 gap-6';
    }
    
    if (isNarrow) {
      return 'grid grid-cols-1 gap-6';
    }
    // Simple CSS-only responsive: two columns on large screens (1024px+)
    return 'grid grid-cols-1 lg:grid-cols-2 gap-6';
  };

  const handleSectionChange = (sectionKey: string, field: keyof Settings, value: any) => {
    onChange(field as keyof Settings, value);
    
    // Ensure the section being edited is open
    setSectionStates(prev => ({
      ...prev,
      [sectionKey]: true
    }));

    // Track this as an active section
    setLastActiveSections(prev => new Set([...prev, sectionKey]));
  };

  const renderSectionFields = (fields: any[], sectionKey: string, columns?: number) => {
    const fullSpanFields = fields.filter((field: any) => field.span === 'full');
    const regularFields = fields.filter((field: any) => field.span !== 'full');
    
    // Group fields by type for better layout
    const colorFields = regularFields.filter((field: any) => field.type === 'color');
    const nonColorFields = regularFields.filter((field: any) => field.type !== 'color');
    
    // Determine grid columns: use passed columns, fallback to section-specific logic, default to 2
    const gridColumns = columns || (sectionKey === 'images' ? 3 : 2);
    
    return (
      <div className="space-y-8">
        {/* Non-color regular fields */}
        {nonColorFields.length > 0 && (
          <div className={getGridClasses(gridColumns)}>
            {nonColorFields.map((field: any) => {
              const fieldComponent = renderField({
                field,
                value: (settings as any)[field.name],
                onChange: (name: string, value: any) => handleSectionChange(sectionKey, name as keyof Settings, value),
                onImageUpload,
                uploadingImages,
                allSettings: { ...settings, ...cookieData, organization_id: organizationId, session },
                readOnly
              });
              
              return fieldComponent ? (
                <div key={field.name}>
                  {fieldComponent as unknown as React.ReactElement}
                </div>
              ) : null;
            })}
          </div>
        )}

        {/* Color fields in 4-column layout */}
        {colorFields.length > 0 && (
          <div className={getGridClasses(4)}>
            {colorFields.map((field: any) => {
              const fieldComponent = renderField({
                field,
                value: (settings as any)[field.name],
                onChange: (name: string, value: any) => handleSectionChange(sectionKey, name as keyof Settings, value),
                onImageUpload,
                uploadingImages,
                allSettings: { ...settings, ...cookieData, organization_id: organizationId, session },
                readOnly
              });
              
              return fieldComponent ? (
                <div key={field.name}>
                  {fieldComponent as unknown as React.ReactElement}
                </div>
              ) : null;
            })}
          </div>
        )}
        
        {/* Full span fields */}
        <div className="space-y-6">
          {fullSpanFields.map((field: any) => {
            const fieldComponent = renderField({
              field,
              value: (settings as any)[field.name],
              onChange: (name: string, value: any) => handleSectionChange(sectionKey, name as keyof Settings, value),
              onImageUpload,
              uploadingImages,
              allSettings: { ...settings, ...cookieData, organization_id: organizationId, session },
              readOnly
            });
          
            return fieldComponent ? (
              <div key={field.name}>
                {fieldComponent as unknown as React.ReactElement}
              </div>
            ) : null;
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-64" data-settings-container>
      {sectionsConfig
        .filter(section => {
          // Mapping from modal tabs to section/subsection keys
          const sectionMapping: Record<string, { section: string; subsection?: string }> = {
            'general': { section: 'all' }, // Show all sections
            'hero': { section: 'hero' },
            'products': { section: 'content', subsection: 'products' },
            'features': { section: 'content', subsection: 'features' },
            'faqs': { section: 'content', subsection: 'faqs' },
            'banners': { section: 'content', subsection: 'banners' },
            'menu': { section: 'layout', subsection: 'menu-items' },
            'blog': { section: 'content', subsection: 'blog-posts' },
            'cookies': { section: 'consent' }, // Show entire consent section
          };

          // If initialSection is provided, filter based on mapping
          if (initialSection && sectionMapping[initialSection]) {
            const mapping = sectionMapping[initialSection];
            
            // If 'all', show everything
            if (mapping.section === 'all') {
              return true;
            }
            
            // If subsection specified, only show that parent section
            // (we'll filter subsections later)
            if (mapping.subsection) {
              return section.key === mapping.section;
            }
            
            // Otherwise, show matching section
            return section.key === mapping.section;
          }
          
          // Default: show all sections
          return true;
        })
        .map(section => {
          // Filter subsections if needed
          const sectionMapping: Record<string, { section: string; subsection?: string }> = {
            'general': { section: 'all' },
            'hero': { section: 'hero' },
            'products': { section: 'content', subsection: 'products' },
            'features': { section: 'content', subsection: 'features' },
            'faqs': { section: 'content', subsection: 'faqs' },
            'banners': { section: 'content', subsection: 'banners' },
            'menu': { section: 'layout', subsection: 'menu-items' },
            'blog': { section: 'content', subsection: 'blog-posts' },
            'cookies': { section: 'consent' },
          };

          const mapping = initialSection ? sectionMapping[initialSection] : null;
          
          // If we need to filter subsections
          if (mapping?.subsection && section.subsections) {
            const filteredSection = {
              ...section,
              subsections: section.subsections.filter(sub => sub.key === mapping.subsection)
            };
            return filteredSection;
          }
          
          return section;
        })
        .map(section => {
          // Define which sections should render directly without parent wrapper
          const directSubsections = ['products', 'features', 'faqs', 'banners', 'blog', 'menu', 'cookies'];
          const shouldRenderDirect = initialSection && directSubsections.includes(initialSection);

          // If direct subsection render, skip DisclosureSection wrapper
          if (shouldRenderDirect && section.subsections) {
            return (
              <div key={section.key} data-section-key={section.key} className="space-y-6">
                {section.subsections.map(subsection => {
                  console.log('🔍 Rendering direct subsection:', subsection.title, 'key:', subsection.key);
                  // Get item counts for badges
                  const getItemCount = (key: string) => {
                    console.log('🔍 [getItemCount] called with key:', key, 'settings.cookie_services:', settings.cookie_services);
                    if (key === 'blog-posts' && settings.blog_posts) {
                      return Array.isArray(settings.blog_posts) ? settings.blog_posts.length : 0;
                    }
                    if (key === 'products' && settings.products) {
                      return Array.isArray(settings.products) ? settings.products.length : 0;
                    }
                    if (key === 'features' && settings.features) {
                      return Array.isArray(settings.features) ? settings.features.length : 0;
                    }
                    if (key === 'faqs' && settings.faqs) {
                      return Array.isArray(settings.faqs) ? settings.faqs.length : 0;
                    }
                    if (key === 'banners' && settings.banners) {
                      return Array.isArray(settings.banners) ? settings.banners.length : 0;
                    }
                    if (key === 'menu-items' && settings.menu_items) {
                      return Array.isArray(settings.menu_items) ? settings.menu_items.length : 0;
                    }
                    if (key === 'cookie-categories' && settings.cookie_categories) {
                      return Array.isArray(settings.cookie_categories) ? settings.cookie_categories.length : 0;
                    }
                    if (key === 'cookie-services' && settings.cookie_services) {
                      const count = Array.isArray(settings.cookie_services) ? settings.cookie_services.length : 0;
                      console.log('🍪 Cookie services count calculation:', count, 'from array:', settings.cookie_services);
                      return count;
                    }
                    if (key === 'cookie-consent' && settings.cookie_consent_records) {
                      return Array.isArray(settings.cookie_consent_records) ? settings.cookie_consent_records.length : 0;
                    }
                    return undefined;
                  };

                  // Get action content for specific subsections
                  const getActionContent = () => {
                    // For now, return null - we'll implement this differently
                    return null;
                  };

                  return (
                    <SubsectionDisclosure 
                      key={subsection.key} 
                      title={subsection.title}
                      defaultOpen={false}
                      storageKey={`${section.key}_${subsection.key}`}
                      itemCount={getItemCount(subsection.key)}
                      actionContent={getActionContent()}
                      resetKey={resetKey}
                      hasData={checkSubsectionData(subsection).hasData}
                      isEmpty={checkSubsectionData(subsection).isEmpty}
                      fieldStatuses={checkSubsectionData(subsection).fieldStatuses}
                      allFieldsFilled={checkSubsectionData(subsection).allFieldsFilled}
                      action={subsection.key === 'menu-items' ? 
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            const event = new CustomEvent('addMenuItem');
                            window.dispatchEvent(event);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              const event = new CustomEvent('addMenuItem');
                              window.dispatchEvent(event);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-600 bg-sky-50/80 backdrop-blur-sm border border-sky-200 rounded-lg hover:bg-sky-100/80 hover:border-sky-300 transition-all duration-200 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Add Menu Item
                        </div>
                        : subsection.key === 'blog-posts' ? 
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            const event = new CustomEvent('addBlogPost');
                            window.dispatchEvent(event);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              const event = new CustomEvent('addBlogPost');
                              window.dispatchEvent(event);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50/80 backdrop-blur-sm border border-purple-200 rounded-lg hover:bg-purple-100/80 hover:border-purple-300 transition-all duration-200 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Add Post
                        </div>
                        : subsection.key === 'products' ? 
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            const event = new CustomEvent('addProduct');
                            window.dispatchEvent(event);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              const event = new CustomEvent('addProduct');
                              window.dispatchEvent(event);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 rounded-lg hover:bg-emerald-100/80 hover:border-emerald-300 transition-all duration-200 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Add Product
                        </div>
                        : subsection.key === 'features' ? 
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            const event = new CustomEvent('addFeature');
                            window.dispatchEvent(event);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              const event = new CustomEvent('addFeature');
                              window.dispatchEvent(event);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50/80 backdrop-blur-sm border border-orange-200 rounded-lg hover:bg-orange-100/80 hover:border-orange-300 transition-all duration-200 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Add Feature
                        </div>
                        : subsection.key === 'faqs' ? 
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            const event = new CustomEvent('addFAQ');
                            window.dispatchEvent(event);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              const event = new CustomEvent('addFAQ');
                              window.dispatchEvent(event);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50/80 backdrop-blur-sm border border-purple-200 rounded-lg hover:bg-purple-100/80 hover:border-purple-300 transition-all duration-200 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Add FAQ
                        </div>
                        : subsection.key === 'banners' ? 
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            const event = new CustomEvent('addBanner');
                            window.dispatchEvent(event);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              const event = new CustomEvent('addBanner');
                              window.dispatchEvent(event);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-600 bg-cyan-50/80 backdrop-blur-sm border border-cyan-200 rounded-lg hover:bg-cyan-100/80 hover:border-cyan-300 transition-all duration-200 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Add Banner
                        </div>
                        : subsection.key === 'cookie-services' ? 
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            const event = new CustomEvent('addCookieService');
                            window.dispatchEvent(event);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              const event = new CustomEvent('addCookieService');
                              window.dispatchEvent(event);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-lg hover:bg-blue-100/80 hover:border-blue-300 transition-all duration-200 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Add Service
                        </div>
                        : subsection.key === 'ai-agents' ? 
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            const event = new CustomEvent('addAIAgent');
                            window.dispatchEvent(event);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              const event = new CustomEvent('addAIAgent');
                              window.dispatchEvent(event);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-600 bg-sky-50/80 backdrop-blur-sm border border-sky-200 rounded-lg hover:bg-sky-100/80 hover:border-sky-300 transition-all duration-200 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Add AI Agent
                        </div>
                        : undefined
                      }
                    >
                      {renderSectionFields(subsection.fields, section.key, subsection.columns)}
                    </SubsectionDisclosure>
                  );
                })}
              </div>
            );
          }

          // Normal rendering with DisclosureSection wrapper
          return (
        <div key={section.key} data-section-key={section.key}>
          <DisclosureSection 
            title={section.title} 
            defaultOpen={false}
            sectionKey={section.key}
            isOpen={sectionStates[section.key] || false}
            onToggle={handleSectionToggle}
            hasData={checkSectionData(section).hasData}
            isEmpty={checkSectionData(section).isEmpty}
            subsectionStatuses={checkSectionData(section).subsectionStatuses}
            allSubsectionsFilled={checkSectionData(section).allSubsectionsFilled}
          >
            {section.subsections ? (
              <div className={getSubsectionGridClasses(section.key)}>
                {section.subsections.map(subsection => {
                  console.log('🔍 Processing subsection:', subsection.title, 'key:', subsection.key);
                  // Get item counts for badges
                  const getItemCount = (key: string) => {
                    console.log('🔍 [getItemCount] called with key:', key, 'settings.cookie_services:', settings.cookie_services);
                    if (key === 'blog-posts' && settings.blog_posts) {
                      return Array.isArray(settings.blog_posts) ? settings.blog_posts.length : 0;
                    }
                    if (key === 'products' && settings.products) {
                      return Array.isArray(settings.products) ? settings.products.length : 0;
                    }
                    if (key === 'features' && settings.features) {
                      return Array.isArray(settings.features) ? settings.features.length : 0;
                    }
                    if (key === 'faqs' && settings.faqs) {
                      return Array.isArray(settings.faqs) ? settings.faqs.length : 0;
                    }
                    if (key === 'banners' && settings.banners) {
                      return Array.isArray(settings.banners) ? settings.banners.length : 0;
                    }
                    if (key === 'menu-items' && settings.menu_items) {
                      return Array.isArray(settings.menu_items) ? settings.menu_items.length : 0;
                    }
                    if (key === 'cookie-categories' && settings.cookie_categories) {
                      return Array.isArray(settings.cookie_categories) ? settings.cookie_categories.length : 0;
                    }
                    if (key === 'cookie-services' && settings.cookie_services) {
                      const count = Array.isArray(settings.cookie_services) ? settings.cookie_services.length : 0;
                      console.log('🍪 Cookie services count calculation:', count, 'from array:', settings.cookie_services);
                      return count;
                    }
                    if (key === 'cookie-consent' && settings.cookie_consent_records) {
                      return Array.isArray(settings.cookie_consent_records) ? settings.cookie_consent_records.length : 0;
                    }
                    return undefined;
                  };

                  // Get action content for specific subsections
                  const getActionContent = () => {
                    // For now, return null - we'll implement this differently
                    return null;
                  };

                  return (
                    <SubsectionDisclosure 
                      key={subsection.key} 
                      title={subsection.title}
                      defaultOpen={false}
                      storageKey={`${section.key}_${subsection.key}`}
                      itemCount={getItemCount(subsection.key)}
                      actionContent={getActionContent()}
                      resetKey={resetKey}
                      hasData={checkSubsectionData(subsection).hasData}
                      isEmpty={checkSubsectionData(subsection).isEmpty}
                      fieldStatuses={checkSubsectionData(subsection).fieldStatuses}
                      allFieldsFilled={checkSubsectionData(subsection).allFieldsFilled}
                      action={subsection.key === 'menu-items' ? 
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Find the menu_items field and trigger add via a custom event
                            const event = new CustomEvent('addMenuItem');
                            window.dispatchEvent(event);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              const event = new CustomEvent('addMenuItem');
                              window.dispatchEvent(event);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-600 bg-sky-50/80 backdrop-blur-sm border border-sky-200 rounded-lg hover:bg-sky-100/80 hover:border-sky-300 transition-all duration-200 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Add Menu Item
                        </div>
                        : subsection.key === 'blog-posts' ? 
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Find the blog_posts field and trigger add via a custom event
                            const event = new CustomEvent('addBlogPost');
                            window.dispatchEvent(event);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              const event = new CustomEvent('addBlogPost');
                              window.dispatchEvent(event);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50/80 backdrop-blur-sm border border-purple-200 rounded-lg hover:bg-purple-100/80 hover:border-purple-300 transition-all duration-200 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Add Post
                        </div>
                        : subsection.key === 'products' ? 
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Find the products field and trigger add via a custom event
                            const event = new CustomEvent('addProduct');
                            window.dispatchEvent(event);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              const event = new CustomEvent('addProduct');
                              window.dispatchEvent(event);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 rounded-lg hover:bg-emerald-100/80 hover:border-emerald-300 transition-all duration-200 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Add Product
                        </div>
                        : subsection.key === 'features' ? 
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Find the features field and trigger add via a custom event
                            const event = new CustomEvent('addFeature');
                            window.dispatchEvent(event);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              const event = new CustomEvent('addFeature');
                              window.dispatchEvent(event);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50/80 backdrop-blur-sm border border-orange-200 rounded-lg hover:bg-orange-100/80 hover:border-orange-300 transition-all duration-200 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Add Feature
                        </div>
                        : subsection.key === 'faqs' ? 
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Find the faqs field and trigger add via a custom event
                            const event = new CustomEvent('addFAQ');
                            window.dispatchEvent(event);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              const event = new CustomEvent('addFAQ');
                              window.dispatchEvent(event);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50/80 backdrop-blur-sm border border-purple-200 rounded-lg hover:bg-purple-100/80 hover:border-purple-300 transition-all duration-200 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Add FAQ
                        </div>
                        : subsection.key === 'banners' ? 
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Find the banners field and trigger add via a custom event
                            const event = new CustomEvent('addBanner');
                            window.dispatchEvent(event);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              const event = new CustomEvent('addBanner');
                              window.dispatchEvent(event);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-600 bg-cyan-50/80 backdrop-blur-sm border border-cyan-200 rounded-lg hover:bg-cyan-100/80 hover:border-cyan-300 transition-all duration-200 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Add Banner
                        </div>
                        : subsection.key === 'cookie-services' ? 
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Find the cookie services field and trigger add via a custom event
                            const event = new CustomEvent('addCookieService');
                            window.dispatchEvent(event);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              const event = new CustomEvent('addCookieService');
                              window.dispatchEvent(event);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-lg hover:bg-blue-100/80 hover:border-blue-300 transition-all duration-200 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Add Service
                        </div>
                        : subsection.key === 'ai-agents' ? 
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Find the ai agents field and trigger add via a custom event
                            const event = new CustomEvent('addAIAgent');
                            window.dispatchEvent(event);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              const event = new CustomEvent('addAIAgent');
                              window.dispatchEvent(event);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-600 bg-sky-50/80 backdrop-blur-sm border border-sky-200 rounded-lg hover:bg-sky-100/80 hover:border-sky-300 transition-all duration-200 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Add AI Agent
                        </div>
                        : undefined
                      }
                    >
                      {renderSectionFields(subsection.fields, section.key, subsection.columns)}
                    </SubsectionDisclosure>
                  );
                })}
              </div>
            ) : section.fields ? (
              renderSectionFields(section.fields, section.key, section.columns)
            ) : null}
          </DisclosureSection>
        </div>
          );
        })}
    </div>
  );
};

export default SettingsFormFields;
