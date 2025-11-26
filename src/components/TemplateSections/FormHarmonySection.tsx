// src/components/TemplateSections/FormHarmonySection.tsx
'use client';

import React, { useEffect, useState, useRef, memo } from 'react';
import { FormRenderer } from '@/components/tally/FormRenderer';
import { CompanyLogo } from '@/components/modals/TemplateSectionModal/components/forms/components/CompanyLogo';
import { useSettings } from '@/context/SettingsContext';

interface FormHarmonySectionProps {
  formId: string;
}

type Question = {
  id: string;
  type: 'text' | 'email' | 'textarea' | 'tel' | 'url' | 'number' | 'date' | 'yesno' | 'multiple' | 'checkbox' | 'dropdown' | 'rating' | 'file';
  label: string;
  description?: string | null;
  required?: boolean;
  options?: string[];
  logic_show_if?: string;
  logic_value?: string;
  validation?: Record<string, any>;
};

type FormData = {
  id: string;
  title: string;
  questions: Question[];
};

type Settings = {
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
  designStyle?: 'large' | 'compact';
  designType?: 'classic' | 'card';
  showCompanyLogo?: boolean;
  columnLayout?: 1 | 2 | 3;
  formPosition?: 'left' | 'center' | 'right';
  contentColumns?: Array<{
    position: 'left' | 'center' | 'right';
    type: 'image' | 'video' | 'text';
    content: string;
  }>;
};

// Cache forms to prevent refetching
const formCache = new Map<string, { form: FormData; settings: Settings; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function FormHarmonySection({ formId }: FormHarmonySectionProps) {
  const [form, setForm] = useState<FormData | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(false);
  const { settings: appSettings } = useSettings();

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    // Don't fetch if already loaded
    if (hasLoadedRef.current) return;
    
    const fetchForm = async () => {
      // Check cache first
      const cached = formCache.get(formId);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        if (isMounted.current) {
          setForm(cached.form);
          setSettings(cached.settings);
          setLoading(false);
          hasLoadedRef.current = true;
        }
        return;
      }

      try {
        setLoading(true);
        
        // Fetch form data
        const formResponse = await fetch(`/api/forms/${formId}`);
        
        if (!formResponse.ok) {
          throw new Error('Form not found or not published');
        }
        
        const formData = await formResponse.json();
        
        // Map database questions to FormRenderer format
        const mappedQuestions = formData.form.questions?.map((q: any) => ({
          id: q.id,
          type: q.type,
          label: q.label,
          description: q.description || null,
          required: q.required || false,
          options: q.options || [],
          logic_show_if: q.logic_show_if || undefined,
          logic_value: q.logic_value || undefined,
          validation: q.validation || {},
        })) || [];
        
        const formObject = {
          id: formData.form.id,
          title: formData.form.title,
          questions: mappedQuestions,
        };
        
        // Use form settings or defaults
        const formSettings = formData.form.settings || {};
        const settingsObject = {
          primary_color: formSettings.theme || 'purple',
          font_family: formSettings.font_family || 'inter',
          designStyle: formSettings.designStyle || 'large',
          designType: formSettings.designType || 'classic',
          showCompanyLogo: formSettings.showCompanyLogo || false,
          columnLayout: formSettings.columnLayout || 1,
          formPosition: formSettings.formPosition || 'left',
          contentColumns: formSettings.contentColumns || [],
        };
        
        // Cache the result
        formCache.set(formId, {
          form: formObject,
          settings: settingsObject,
          timestamp: Date.now(),
        });
        
        // Only update state if still mounted
        if (isMounted.current) {
          setForm(formObject);
          setSettings(settingsObject);
          setLoading(false);
          hasLoadedRef.current = true;
        }
      } catch (err: any) {
        console.error('Error fetching form:', err);
        if (isMounted.current) {
          setError(err.message || 'Failed to load form');
          setLoading(false);
          hasLoadedRef.current = true;
        }
      }
    };

    if (formId && !hasLoadedRef.current) {
      // Use IntersectionObserver to only load when visible
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasLoadedRef.current) {
              fetchForm();
              observer.disconnect();
            }
          });
        },
        { rootMargin: '50px' } // Start loading slightly before entering viewport
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => {
        observer.disconnect();
      };
    }
  }, [formId]);

  if (loading) {
    return (
      <div ref={containerRef} className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div ref={containerRef} className="min-h-[400px] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <p className="text-red-600 text-lg font-medium mb-2">Failed to load form</p>
          <p className="text-gray-600">{error || 'Form not available'}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative pt-20 md:pt-16">
      {settings?.showCompanyLogo && appSettings?.image && (
        <CompanyLogo 
          imageUrl={appSettings.image} 
          designStyle={settings.designStyle || 'large'} 
        />
      )}
      <FormRenderer 
        form={form} 
        settings={settings || { primary_color: 'purple', font_family: 'inter' }} 
      />
    </div>
  );
}

export default memo(FormHarmonySection);
