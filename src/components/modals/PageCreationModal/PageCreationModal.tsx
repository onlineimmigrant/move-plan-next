'use client';

import React, { useState, useEffect } from 'react';
import { DocumentPlusIcon, LinkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { createClient } from '@supabase/supabase-js';
import { usePageCreation } from './context';
import { getOrganizationId } from '@/lib/supabase';
import { getBaseUrl } from '@/lib/utils';
import {
  BaseModal,
  useModalForm,
  validators,
  generateSlug,
} from '@/components/modals/_shared';

interface PageCreationModalProps {
  onSuccess?: (pageData: { slug: string; title: string }) => void;
}

interface PageFormData {
  title: string;
  slug: string;
  description: string;
}

const PageCreationModal: React.FC<PageCreationModalProps> = ({ onSuccess }) => {
  const { isOpen, closeModal } = usePageCreation();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isLoadingOrg, setIsLoadingOrg] = useState(false);

  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Form management with shared hook
  const form = useModalForm<PageFormData>({
    initialValues: {
      title: '',
      slug: '',
      description: '',
    },
    validators: {
      title: validators.required('Page title'),
      slug: (value) => {
        if (!value?.trim()) return 'Page slug is required';
        if (!/^[a-z0-9-]+$/.test(value)) {
          return 'Slug can only contain lowercase letters, numbers, and hyphens';
        }
        return undefined;
      },
    },
    onSubmit: async (values) => {
      if (!organizationId) {
        throw new Error('Organization ID not found. Please try again.');
      }

      // Check if slug already exists
      const { data: existingPage, error: checkError } = await supabase
        .from('blog_post')
        .select('slug')
        .eq('organization_id', organizationId)
        .eq('slug', values.slug)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingPage) {
        form.setError('slug', 'A page with this slug already exists');
        throw new Error('Slug already exists');
      }

      // Get the highest order number
      const { data: maxOrderData } = await supabase
        .from('blog_post')
        .select('order')
        .eq('organization_id', organizationId)
        .order('order', { ascending: false })
        .limit(1)
        .single();

      const nextOrder = (maxOrderData?.order || 0) + 1;

      // Create the page
      const { data: newPage, error: insertError } = await supabase
        .from('blog_post')
        .insert({
          title: values.title.trim(),
          slug: values.slug.trim(),
          description: values.description.trim() || null,
          content: null,
          organization_id: organizationId,
          order: nextOrder,
          display_this_post: true,
          display_as_blog_post: false,
          section_id: null,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      return newPage;
    },
    onSuccess: () => {
      if (onSuccess) {
        onSuccess({
          slug: form.values.slug,
          title: form.values.title,
        });
      }
      
      closeModal();
      form.reset();
      
      // Navigate to the new page
      setTimeout(() => {
        window.location.href = `/${form.values.slug}`;
      }, 300);
    },
    onError: (error) => {
      if (error.message !== 'Slug already exists') {
        form.setError('form', error.message || 'Failed to create page. Please try again.');
      }
    },
  });

  // Fetch organization ID when modal opens
  useEffect(() => {
    const fetchOrganizationId = async () => {
      if (!isOpen) return;
      
      setIsLoadingOrg(true);
      try {
        const baseUrl = getBaseUrl(false);
        const orgId = await getOrganizationId(baseUrl);

        if (!orgId) {
          form.setError('form', 'Could not find organization. Please refresh and try again.');
          return;
        }

        setOrganizationId(orgId);
      } catch (error) {
        console.error('Error fetching organization:', error);
        form.setError('form', 'Failed to load organization data. Please try again.');
      } finally {
        setIsLoadingOrg(false);
      }
    };

    fetchOrganizationId();
  }, [isOpen]);

  // Auto-generate slug from title
  useEffect(() => {
    if (form.values.title && !form.touched.slug) {
      const slug = generateSlug(form.values.title);
      form.setValue('slug', slug);
    }
  }, [form.values.title]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setOrganizationId(null);
    }
  }, [isOpen]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={closeModal}
      title={
        <div className="flex items-center gap-2.5">
          <span className="text-xl font-semibold text-gray-900">Create Page</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-sky-100 text-sky-700 border border-sky-200">
            New
          </span>
        </div>
      }
      subtitle="Build a template-based page for your site"
      size="lg"
      primaryAction={{
        label: 'Create',
        onClick: form.handleSubmit,
        loading: form.isSubmitting,
        disabled: !organizationId || isLoadingOrg,
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: closeModal,
      }}
    >
      <form onSubmit={form.handleSubmit} className="space-y-5">
        {/* Info Banner - Sky themed, no icon */}
        <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-sky-900">Template-Based Page</p>
            <p className="text-sm text-sky-800 leading-relaxed">
              This creates a dynamic page without fixed content. You can add <strong className="font-semibold">Template Sections</strong> and <strong className="font-semibold">Heading Sections</strong> that you can manage directly on the page.
            </p>
            <p className="text-xs text-sky-700 pt-1">
              Perfect for landing pages, services, and feature showcases
            </p>
          </div>
        </div>

        {/* Form Error */}
        {form.errors.form && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200">
            <div className="flex gap-2.5">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-800 font-medium">{form.errors.form}</p>
            </div>
          </div>
        )}

        {/* Page Title */}
        <div className="space-y-1.5">
          <label htmlFor="page-title" className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            Page Title <span className="text-red-500">*</span>
            <Tooltip content="The main heading displayed on your page">
              <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
            </Tooltip>
          </label>
          <div className="relative">
            <input
              id="page-title"
              type="text"
              value={form.values.title}
              onChange={form.handleChange('title')}
              onBlur={form.handleBlur('title')}
              placeholder="e.g., About Us, Our Services, Contact"
              className={`w-full px-3.5 py-2.5 rounded-lg border ${
                form.touched.title && form.errors.title
                  ? 'border-red-300 bg-red-50/30'
                  : 'border-gray-200 bg-gray-50/50 hover:bg-white'
              } focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all duration-150 text-gray-900 placeholder-gray-400`}
              disabled={form.isSubmitting}
            />
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <DocumentPlusIcon className={`w-4.5 h-4.5 transition-colors ${
                form.values.title ? 'text-sky-500' : 'text-gray-300'
              }`} />
            </div>
          </div>
          {form.touched.title && form.errors.title && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {form.errors.title}
            </p>
          )}
        </div>

        {/* Page Slug */}
        <div className="space-y-1.5">
          <label htmlFor="page-slug" className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            Page URL Slug <span className="text-red-500">*</span>
            <Tooltip content="URL-friendly identifier (lowercase, hyphens only). Auto-generated from title.">
              <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
            </Tooltip>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <LinkIcon className="w-4 h-4 text-gray-400" />
            </div>
            <span className="absolute left-9 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              /
            </span>
            <input
              id="page-slug"
              type="text"
              value={form.values.slug}
              onChange={form.handleChange('slug')}
              onBlur={form.handleBlur('slug')}
              placeholder="about-us"
              className={`w-full pl-12 pr-3.5 py-2.5 rounded-lg border ${
                form.touched.slug && form.errors.slug
                  ? 'border-red-300 bg-red-50/30'
                  : 'border-gray-200 bg-gray-50/50 hover:bg-white'
              } focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all duration-150 text-gray-900 placeholder-gray-400 font-mono text-sm`}
              disabled={form.isSubmitting}
            />
          </div>
          {form.touched.slug && form.errors.slug && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {form.errors.slug}
            </p>
          )}
        </div>

        {/* Page Description */}
        <div className="space-y-1.5">
          <label htmlFor="page-description" className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            Meta Description
            <span className="ml-1 text-xs font-normal text-gray-500">(Optional)</span>
            <Tooltip content="Brief description for search engines and social media previews (max 160 characters)">
              <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
            </Tooltip>
          </label>
          <textarea
            id="page-description"
            value={form.values.description}
            onChange={form.handleChange('description')}
            onBlur={form.handleBlur('description')}
            placeholder="A brief, engaging description..."
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-white
                     focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500
                     transition-all duration-150 text-gray-900 placeholder-gray-400
                     resize-none"
            disabled={form.isSubmitting}
            maxLength={160}
          />
          <div className="flex items-center justify-end">
            <span className={`text-xs font-medium ${
              form.values.description.length > 140 
                ? 'text-orange-600' 
                : form.values.description.length > 0 
                ? 'text-gray-600' 
                : 'text-gray-400'
            }`}>
              {form.values.description.length}/160
            </span>
          </div>
        </div>

        {/* Loading Organization State */}
        {isLoadingOrg && (
          <div className="flex items-center justify-center py-3 text-sm text-gray-600">
            <svg className="animate-spin -ml-1 mr-2.5 h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading organization data...
          </div>
        )}
      </form>
    </BaseModal>
  );
};

// Improved Tooltip Component
const Tooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-flex">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 pointer-events-none">
          <div className="bg-white text-gray-700 text-xs rounded-lg py-2.5 px-3.5 min-w-[240px] max-w-sm shadow-lg border border-gray-200">
            {content}
            {/* Arrow pointing up */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-transparent border-b-white" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-px w-0 h-0 border-l-[7px] border-r-[7px] border-b-[7px] border-transparent border-b-gray-200" />
          </div>
        </div>
      )}
    </div>
  );
};

export default PageCreationModal;
