// hooks/usePostSave.ts - Save functionality hook

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PostFormData } from '../types';
import { revalidatePage } from '@/lib/revalidation';

const DRAFT_KEY = 'postEditModal_draft';

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export function usePostSave(
  mode: 'create' | 'edit',
  editingPost: any,
  returnUrl: string | null,
  updatePost: ((post: any) => void) | undefined,
  closeModal: () => void
) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasTriedSave, setHasTriedSave] = useState(false);

  const handleSave = async (formData: PostFormData, contentToSave?: string, closeAfterSave = true) => {
    setIsSaving(true);
    setSaveError(null);
    setHasTriedSave(true);

    try {
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }

      const finalContent = contentToSave !== undefined ? contentToSave : formData.content;

      // Build JSONB-structured data
      const postData: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        content: finalContent,
        content_type: formData.contentType,
        display_config: {
          display_this_post: formData.displayThisPost,
          display_as_blog_post: formData.displayAsBlogPost,
          is_displayed_first_page: formData.isDisplayedFirstPage,
          is_help_center: formData.isHelpCenter,
          help_center_order: formData.helpCenterOrder.trim() ? parseInt(formData.helpCenterOrder) : 0,
          type: formData.postType,
          is_numbered: formData.isNumbered,
        },
        organization_config: {
          section_id: formData.section.trim() ? parseInt(formData.section) : null,
          subsection: formData.subsection.trim() || null,
          order: formData.order.trim() ? parseInt(formData.order) : 0,
          doc_set: formData.docSet && formData.docSet !== '__custom__' ? formData.docSet : null,
          doc_set_order: formData.docSet && formData.docSet !== '__custom__' && formData.docSetOrder.trim() 
            ? parseInt(formData.docSetOrder) : null,
          doc_set_title: formData.docSet && formData.docSet !== '__custom__' && formData.docSetTitle.trim() 
            ? formData.docSetTitle.trim() : null,
        },
        author_config: {
          is_with_author: false,
          is_company_author: formData.isCompanyAuthor,
          author_id: null,
        },
        media_config: {
          main_photo: formData.mainPhoto.trim() || formData.mediaConfig.main_photo || null,
          ...(formData.mediaConfig.unsplash_attribution && { 
            unsplash_attribution: formData.mediaConfig.unsplash_attribution 
          }),
          ...(formData.mediaConfig.pexels_attribution && { 
            pexels_attribution: formData.mediaConfig.pexels_attribution 
          }),
        },
        ...(formData.translations && Object.keys(formData.translations).length > 0 && {
          translations: formData.translations
        }),
      };

      if (formData.authorName.trim()) postData.author_name = formData.authorName.trim();
      if (formData.metaDescription.trim()) postData.metadescription_for_page = formData.metaDescription.trim();
      if (formData.createdOn) postData.created_on = formData.createdOn;

      let url: string;
      let method: string;

      if (mode === 'create') {
        postData.slug = formData.slug.trim() || generateSlug(formData.title);
        url = '/api/posts';
        method = 'POST';
      } else {
        if (formData.slug.trim()) postData.slug = formData.slug.trim();
        url = `/api/posts/${editingPost?.slug || formData.slug}`;
        method = 'PATCH';
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${mode} post`);
      }

      const savedPost = await response.json();

      localStorage.removeItem(DRAFT_KEY);

      if (updatePost && mode === 'create') {
        updatePost(savedPost);
      }

      // Dispatch event for instant updates
      window.dispatchEvent(new CustomEvent('post-updated', { detail: savedPost }));

      // Revalidate cache - this makes changes appear immediately on next page load
      const postSlug = savedPost.slug || formData.slug;
      await revalidatePage(postSlug);

      if (closeAfterSave) {
        closeModal();
      }

      if (returnUrl) {
        router.push(returnUrl);
      } else if (mode === 'create') {
        router.push(`/${savedPost.slug}`);
      }

      return savedPost;
    } catch (error: any) {
      console.error('Error saving post:', error);
      setSaveError(error.message || 'Failed to save post. Please try again.');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    saveError,
    hasTriedSave,
    handleSave,
    setSaveError,
  };
}
