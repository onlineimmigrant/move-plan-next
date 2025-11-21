'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, DocumentPlusIcon } from '@heroicons/react/24/outline';
import { createClient } from '@supabase/supabase-js';
import { usePageCreation } from '@/context/PageCreationContext';
import { getOrganizationId } from '@/lib/supabase';
import { getBaseUrl } from '@/lib/utils';

interface PageCreationModalProps {
  onSuccess?: (pageData: { slug: string; title: string }) => void;
}

const PageCreationModal: React.FC<PageCreationModalProps> = ({
  onSuccess,
}) => {
  const { isOpen, closeModal } = usePageCreation();
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch organization ID on mount
  useEffect(() => {
    const fetchOrganizationId = async () => {
      try {
        const baseUrl = getBaseUrl(false); // Get client-side base URL
        const orgId = await getOrganizationId(baseUrl);

        if (!orgId) {
          console.error('No organization ID found for base URL:', baseUrl);
          setErrors({ form: 'Could not find organization. Please refresh and try again.' });
          return;
        }

        // Found organization ID for base URL
        setOrganizationId(orgId);
      } catch (error) {
        console.error('Error in fetchOrganizationId:', error);
        setErrors({ form: 'Failed to load organization data. Please try again.' });
      }
    };

    if (isOpen) {
      fetchOrganizationId();
    }
  }, [isOpen]);

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const generatedSlug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.title, formData.slug]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ title: '', slug: '', description: '' });
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Page title is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Page slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!organizationId) {
      setErrors({ form: 'Organization ID not found. Please try again.' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Check if slug already exists
      const { data: existingPage, error: checkError } = await supabase
        .from('blog_post')
        .select('slug')
        .eq('organization_id', organizationId)
        .eq('slug', formData.slug)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw checkError;
      }

      if (existingPage) {
        setErrors({ slug: 'A page with this slug already exists' });
        setIsSubmitting(false);
        return;
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

      // Create the page entry in blog_post table
      // Key difference: no content, display_as_blog_post = false
      const { data: newPage, error: insertError } = await supabase
        .from('blog_post')
        .insert({
          title: formData.title.trim(),
          slug: formData.slug.trim(),
          description: formData.description.trim() || null,
          content: null, // No content - page will use template sections
          organization_id: organizationId,
          order: nextOrder,
          display_this_post: true,
          display_as_blog_post: false, // This marks it as a page, not a blog post
          section_id: null,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Success!
      // Page created successfully
      
      if (onSuccess) {
        onSuccess({
          slug: formData.slug,
          title: formData.title,
        });
      }

      // Close modal
      closeModal();

      // Show success message
      alert(`Page "${formData.title}" created successfully! You can now add template sections and headings to this page.`);
      
      // Navigate to the new page
      window.location.href = `/${formData.slug}`;
      
    } catch (error: any) {
      console.error('Error creating page:', error);
      setErrors({ 
        form: error.message || 'Failed to create page. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={closeModal}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-2xl bg-gradient-to-br from-white via-gray-50 to-gray-100 
                     rounded-2xl shadow-[8px_8px_24px_rgba(0,0,0,0.12),-4px_-4px_16px_rgba(255,255,255,0.8)] 
                     overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 
                         px-6 py-5 border-b border-gray-200/50 z-10
                         shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 
                               shadow-[inset_2px_2px_4px_rgba(255,255,255,0.8),inset_-2px_-2px_4px_rgba(99,102,241,0.1)]">
                  <DocumentPlusIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Create New Page
                  </h2>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Create a template-based page for your site
                  </p>
                </div>
              </div>
              
              <button
                onClick={closeModal}
                className="p-2 rounded-full bg-gradient-to-br from-gray-100 to-gray-50
                         hover:from-gray-200 hover:to-gray-100 transition-all duration-200
                         shadow-[2px_2px_4px_rgba(0,0,0,0.1),-2px_-2px_4px_rgba(255,255,255,0.8)]
                         hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]
                         active:scale-95"
                aria-label="Close"
              >
                <XMarkIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Info Banner */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200/50 rounded-xl">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">
                    Template-Based Page
                  </h4>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    This creates a page without content. You'll add content using <strong>Template Sections</strong> and <strong>Template Headings</strong> that you can manage directly on the page.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Error */}
            {errors.form && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200/50 rounded-xl">
                <p className="text-sm text-red-800">{errors.form}</p>
              </div>
            )}

            <div className="space-y-5">
              {/* Page Title */}
              <div>
                <label htmlFor="page-title" className="block text-sm font-semibold text-gray-700 mb-2">
                  Page Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="page-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., About Us, Contact, Services"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.title ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                  } shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)]
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                    transition-all duration-200 text-gray-900 placeholder-gray-400`}
                  disabled={isSubmitting}
                />
                {errors.title && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Page Slug */}
              <div>
                <label htmlFor="page-slug" className="block text-sm font-semibold text-gray-700 mb-2">
                  Page URL Slug <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    /
                  </span>
                  <input
                    id="page-slug"
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value.toLowerCase())}
                    placeholder="about-us"
                    className={`w-full pl-8 pr-4 py-3 rounded-xl border ${
                      errors.slug ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                    } shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)]
                      focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                      transition-all duration-200 text-gray-900 placeholder-gray-400`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.slug && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.slug}</p>
                )}
                <p className="mt-1.5 text-xs text-gray-500">
                  URL-friendly version of the page title (lowercase, hyphens only)
                </p>
              </div>

              {/* Page Description */}
              <div>
                <label htmlFor="page-description" className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="page-description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description for SEO and meta tags"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white
                           shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)]
                           focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                           transition-all duration-200 text-gray-900 placeholder-gray-400
                           resize-none"
                  disabled={isSubmitting}
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  This will be used for SEO meta description
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200/50">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl font-medium text-gray-700
                         bg-gradient-to-br from-gray-100 to-gray-50
                         shadow-[2px_2px_6px_rgba(0,0,0,0.1),-2px_-2px_6px_rgba(255,255,255,0.8)]
                         hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200 active:scale-95"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting || !organizationId}
                className="px-6 py-2.5 rounded-xl font-semibold text-white
                         bg-gradient-to-br from-blue-600 to-indigo-600
                         shadow-[2px_2px_8px_rgba(59,130,246,0.4),-2px_-2px_8px_rgba(255,255,255,0.1)]
                         hover:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.2)]
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200 active:scale-95
                         flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <DocumentPlusIcon className="w-4 h-4" />
                    Create Page
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PageCreationModal;
