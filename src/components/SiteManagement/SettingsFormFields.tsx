import React, { useState, useEffect } from 'react';
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
}

const SettingsFormFields: React.FC<SettingsFormFieldsProps> = ({ 
  settings, 
  onChange, 
  onImageUpload, 
  uploadingImages,
  isNarrow = false,
  cookieData
}) => {
  const [sectionChanges, setSectionChanges] = useState<Record<string, Partial<Settings>>>({});
  const [originalSectionValues, setOriginalSectionValues] = useState<Record<string, Partial<Settings>>>({});
  const [sectionStates, setSectionStates] = useState<Record<string, boolean>>({});
  const [lastActiveSections, setLastActiveSections] = useState<Set<string>>(new Set());

  // Initialize section states only once
  useEffect(() => {
    const storedStates = sessionStorage.getItem('siteManagement_sectionStates');
    if (storedStates) {
      try {
        const parsed = JSON.parse(storedStates);
        // Validate that stored states match current sections
        const validatedStates: Record<string, boolean> = {};
        sectionsConfig.forEach(section => {
          validatedStates[section.key] = parsed[section.key] || false;
        });
        // If no sections are open, default to hero section
        const hasOpenSection = Object.values(validatedStates).some(isOpen => isOpen);
        if (!hasOpenSection) {
          validatedStates.hero = true;
        }
        setSectionStates(validatedStates);
      } catch {
        // Fallback to default if parsing fails
        const initialStates: Record<string, boolean> = {};
        sectionsConfig.forEach(section => {
          initialStates[section.key] = section.key === 'hero';
        });
        setSectionStates(initialStates);
      }
    } else {
      const initialStates: Record<string, boolean> = {};
      sectionsConfig.forEach(section => {
        // Default hero section to be open, others closed
        initialStates[section.key] = section.key === 'hero';
      });
      setSectionStates(initialStates);
    }
  }, []);

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
      initialStates[section.key] = section.key === 'hero';
    });
    setSectionStates(initialStates);
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

  // Helper function to get grid classes based on narrow state
  const getGridClasses = (columns: number = 2) => {
    if (isNarrow) {
      return 'grid grid-cols-1 gap-6';
    }
    if (columns === 4) {
      return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
    }
    if (columns === 3) {
      return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    }
    return 'grid grid-cols-1 md:grid-cols-2 gap-6';
  };

  // Helper function to get subsection grid classes - hybrid CSS-only approach
  const getSubsectionGridClasses = () => {
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
    
    setSectionChanges(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [field]: value
      }
    }));

    if (!originalSectionValues[sectionKey]) {
      setOriginalSectionValues(prev => ({
        ...prev,
        [sectionKey]: {
          [field]: settings[field]
        }
      }));
    } else if (!(field in originalSectionValues[sectionKey])) {
      setOriginalSectionValues(prev => ({
        ...prev,
        [sectionKey]: {
          ...prev[sectionKey],
          [field]: settings[field]
        }
      }));
    }
  };

  const handleSectionSave = (sectionKey: string) => {
    // Keep the section that was saved open
    setSectionStates(prev => ({
      ...prev,
      [sectionKey]: true
    }));

    // Track this as the last active section
    setLastActiveSections(prev => new Set([...prev, sectionKey]));
    
    setSectionChanges(prev => {
      const newChanges = { ...prev };
      delete newChanges[sectionKey];
      return newChanges;
    });
    
    setOriginalSectionValues(prev => {
      const newOriginals = { ...prev };
      delete newOriginals[sectionKey];
      return newOriginals;
    });

    // Scroll to the saved section after a brief delay to ensure DOM is updated
    setTimeout(() => {
      const sectionElement = document.querySelector(`[data-section-key="${sectionKey}"]`);
      if (sectionElement) {
        sectionElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest' 
        });
      }
    }, 100);
  };

  const handleSectionCancel = (sectionKey: string) => {
    const originalValues = originalSectionValues[sectionKey];
    if (originalValues) {
      Object.entries(originalValues).forEach(([field, value]) => {
        onChange(field as keyof Settings, value);
      });
    }
    
    setSectionChanges(prev => {
      const newChanges = { ...prev };
      delete newChanges[sectionKey];
      return newChanges;
    });
    
    setOriginalSectionValues(prev => {
      const newOriginals = { ...prev };
      delete newOriginals[sectionKey];
      return newOriginals;
    });
  };

  const hasSectionChanges = (sectionKey: string) => {
    return sectionChanges[sectionKey] && Object.keys(sectionChanges[sectionKey]).length > 0;
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
                allSettings: { ...settings, ...cookieData }
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
                allSettings: { ...settings, ...cookieData }
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
              allSettings: { ...settings, ...cookieData }
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
      {sectionsConfig.map(section => (
        <div key={section.key} data-section-key={section.key}>
          <DisclosureSection 
            title={section.title} 
            defaultOpen={false}
            sectionKey={section.key}
            hasChanges={hasSectionChanges(section.key)}
            onSave={() => handleSectionSave(section.key)}
            onCancel={() => handleSectionCancel(section.key)}
            isOpen={sectionStates[section.key] || false}
            onToggle={handleSectionToggle}
          >
            {section.subsections ? (
              <div className={getSubsectionGridClasses()}>
                {section.subsections.map(subsection => {
                  // Get item counts for badges
                  const getItemCount = (key: string) => {
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
      ))}
    </div>
  );
};

export default SettingsFormFields;
