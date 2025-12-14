'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSettings } from '@/context/SettingsContext';

interface EmailTemplate {
  id: number;
  organization_id: string;
  name: string;
  description: string | null;
  subject: string | null;
  html_code: string | null;
  type: string | null;
  category: 'transactional' | 'marketing' | 'system' | null;
  from_email_address_type: 'transactional_email' | 'marketing_email' | 'transactional_email_2' | 'marketing_email_2' | null;
  email_main_logo_image: string | null;
  is_active: boolean;
  is_default: boolean;
  created_by: string | null;
  created_at?: string;
  updated_at: string | null;
}

interface UseEmailTemplatesReturn {
  templates: EmailTemplate[];
  transactionalTemplates: EmailTemplate[];
  marketingTemplates: EmailTemplate[];
  isLoading: boolean;
  error: string | null;
  refreshTemplates: () => Promise<void>;
  getTemplateById: (id: number) => EmailTemplate | undefined;
  searchTemplates: (query: string) => EmailTemplate[];
  createTemplate: (template: Omit<EmailTemplate, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => Promise<EmailTemplate | null>;
  updateTemplate: (id: number, updates: Partial<Omit<EmailTemplate, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>) => Promise<boolean>;
  deleteTemplate: (id: number) => Promise<boolean>;
  duplicateTemplate: (id: number) => Promise<EmailTemplate | null>;
}

export function useEmailTemplates(): UseEmailTemplatesReturn {
  const { settings } = useSettings();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    if (!settings?.organization_id) {
      setTemplates([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('email_template')
        .select('*')
        .eq('organization_id', settings.organization_id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      console.log('Fetched templates:', data);
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching email templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [settings?.organization_id]);

  // Filter transactional templates
  const transactionalTemplates = templates.filter(
    (template) => template.category === 'transactional'
  );

  // Filter marketing templates
  const marketingTemplates = templates.filter(
    (template) => template.category === 'marketing'
  );

  const refreshTemplates = async () => {
    await fetchTemplates();
  };

  const getTemplateById = (id: number): EmailTemplate | undefined => {
    return templates.find((template) => template.id === id);
  };

  const searchTemplates = (query: string): EmailTemplate[] => {
    if (!query.trim()) return templates;

    const lowerQuery = query.toLowerCase();
    return templates.filter(
      (template) =>
        template.name?.toLowerCase().includes(lowerQuery) ||
        template.subject?.toLowerCase().includes(lowerQuery) ||
        template.description?.toLowerCase().includes(lowerQuery) ||
        template.html_code?.toLowerCase().includes(lowerQuery)
    );
  };

  const createTemplate = async (template: Omit<EmailTemplate, 'id' | 'organization_id' | 'created_at' | 'updated_at'>): Promise<EmailTemplate | null> => {
    if (!settings?.organization_id) return null;

    try {
      const { data, error } = await supabase
        .from('email_template')
        .insert({
          ...template,
          organization_id: settings.organization_id,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchTemplates();
      return data;
    } catch (err) {
      console.error('Error creating template:', err);
      setError(err instanceof Error ? err.message : 'Failed to create template');
      return null;
    }
  };

  const updateTemplate = async (id: number, updates: Partial<Omit<EmailTemplate, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('email_template')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', settings?.organization_id);

      if (error) throw error;

      await fetchTemplates();
      return true;
    } catch (err) {
      console.error('Error updating template:', err);
      setError(err instanceof Error ? err.message : 'Failed to update template');
      return false;
    }
  };

  const deleteTemplate = async (id: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('email_template')
        .delete()
        .eq('id', id)
        .eq('organization_id', settings?.organization_id);

      if (error) throw error;

      await fetchTemplates();
      return true;
    } catch (err) {
      console.error('Error deleting template:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete template');
      return false;
    }
  };

  const duplicateTemplate = async (id: number): Promise<EmailTemplate | null> => {
    const template = getTemplateById(id);
    if (!template) return null;

    return createTemplate({
      name: `${template.name} (Copy)`,
      description: template.description,
      subject: template.subject,
      html_code: template.html_code,
      type: template.type,
      category: template.category,
      from_email_address_type: template.from_email_address_type,
      email_main_logo_image: template.email_main_logo_image,
      is_active: template.is_active,
      is_default: false,
      created_by: template.created_by,
    });
  };

  return {
    templates,
    transactionalTemplates,
    marketingTemplates,
    isLoading,
    error,
    refreshTemplates,
    getTemplateById,
    searchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
  };
}
