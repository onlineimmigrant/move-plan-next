import React, { useState } from 'react';
import { Settings } from './types';
import { DisclosureSection } from './DisclosureSection';
import { sectionsConfig, renderField } from './fieldConfig';

interface SettingsFormFieldsProps {
  settings: Settings;
  onChange: (field: keyof Settings, value: any) => void;
  onImageUpload: (field: 'image' | 'favicon' | 'hero_image') => void;
  uploadingImages: Set<string>;
  isNarrow?: boolean;
}

export default function SettingsFormFields({ 
  settings, 
  onChange, 
  onImageUpload, 
  uploadingImages,
  isNarrow = false
}: SettingsFormFieldsProps) {
  const [sectionChanges, setSectionChanges] = useState<Record<string, Partial<Settings>>>({});
  const [originalSectionValues, setOriginalSectionValues] = useState<Record<string, Partial<Settings>>>({});

  // Helper function to get grid classes based on narrow state
  const getGridClasses = (columns: number = 2) => {
    if (isNarrow) {
      return 'grid grid-cols-1 gap-4';
    }
    if (columns === 3) {
      return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
    }
    return 'grid grid-cols-1 md:grid-cols-2 gap-4';
  };

  const handleSectionChange = (sectionKey: string, field: keyof Settings, value: any) => {
    onChange(field as keyof Settings, value);
    
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

  const renderSectionFields = (fields: any[], sectionKey: string) => {
    const fullSpanFields = fields.filter((field: any) => field.span === 'full');
    const regularFields = fields.filter((field: any) => field.span !== 'full');
    
    return (
      <>
        {/* Regular grid fields */}
        {regularFields.length > 0 && (
          <div className={getGridClasses(sectionKey === 'images' ? 3 : 2)}>
            {regularFields.map((field: any) => {
              const fieldComponent = renderField({
                field,
                value: (settings as any)[field.name],
                onChange: (name: string, value: any) => handleSectionChange(sectionKey, name as keyof Settings, value),
                onImageUpload,
                uploadingImages,
                allSettings: settings
              } as any);
              
              return fieldComponent ? (
                <div key={field.name}>
                  {fieldComponent as unknown as React.ReactElement}
                </div>
              ) : null;
            })}
          </div>
        )}
        
        {/* Full span fields */}
        {fullSpanFields.map((field: any) => {
          const fieldComponent = renderField({
            field,
            value: (settings as any)[field.name],
            onChange: (name: string, value: any) => handleSectionChange(sectionKey, name as keyof Settings, value),
            onImageUpload,
            uploadingImages,
            allSettings: settings
          } as any);
          
          return fieldComponent ? (
            <div key={field.name}>
              {fieldComponent as unknown as React.ReactElement}
            </div>
          ) : null;
        })}
      </>
    );
  };

  return (
    <div className="space-y-4">
      {sectionsConfig.map(section => (
        <DisclosureSection 
          key={section.key}
          title={section.title} 
          defaultOpen={false}
          sectionKey={section.key}
          hasChanges={hasSectionChanges(section.key)}
          onSave={() => handleSectionSave(section.key)}
          onCancel={() => handleSectionCancel(section.key)}
        >
          {renderSectionFields(section.fields, section.key)}
        </DisclosureSection>
      ))}
    </div>
  );
}
