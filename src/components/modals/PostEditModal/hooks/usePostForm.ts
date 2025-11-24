// hooks/usePostForm.ts - Form state management hook

import { useState, useEffect, useRef, useCallback } from 'react';
import { PostFormData, ContentType } from '../types';

const DRAFT_KEY = 'postEditModal_draft';

export function usePostForm(editingPost: any, mode: 'create' | 'edit', isOpen: boolean) {
  const initialLoadRef = useRef<boolean>(true);
  
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    description: '',
    content: '',
    contentType: 'html' as ContentType,
    subsection: '',
    slug: '',
    authorName: '',
    mainPhoto: '',
    mediaConfig: {},
    metaDescription: '',
    order: '',
    helpCenterOrder: '',
    displayThisPost: true,
    isDisplayedFirstPage: false,
    isCompanyAuthor: false,
    displayAsBlogPost: true,
    isHelpCenter: false,
    postType: 'default',
    isNumbered: false,
    createdOn: '',
    docSet: '',
    docSetOrder: '',
    docSetTitle: '',
    section: '',
  });

  const [isDirty, setIsDirty] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && editingPost) {
        const post = editingPost as any;
        
        const newFormData: PostFormData = {
          title: post.title || '',
          description: post.description || '',
          content: initialLoadRef.current ? (post.content || '') : formData.content,
          contentType: post.content_type || 'html',
          subsection: post.subsection || post.organization_config?.subsection || '',
          slug: post.slug || '',
          authorName: post.author_name || '',
          mainPhoto: post.main_photo || post.media_config?.main_photo || '',
          mediaConfig: post.media_config || {},
          metaDescription: post.metadescription_for_page || '',
          order: post.order?.toString() || post.organization_config?.order?.toString() || '',
          helpCenterOrder: post.help_center_order?.toString() || post.display_config?.help_center_order?.toString() || '',
          displayThisPost: post.display_this_post ?? post.display_config?.display_this_post ?? true,
          isDisplayedFirstPage: post.is_displayed_first_page ?? post.display_config?.is_displayed_first_page ?? false,
          isCompanyAuthor: post.is_company_author ?? post.author_config?.is_company_author ?? false,
          displayAsBlogPost: post.display_as_blog_post ?? post.display_config?.display_as_blog_post ?? true,
          isHelpCenter: post.is_help_center ?? post.display_config?.is_help_center ?? false,
          postType: post.display_config?.type || 'default',
          isNumbered: post.display_config?.is_numbered ?? false,
          createdOn: post.created_on || '',
          docSet: post.doc_set || post.organization_config?.doc_set || '',
          docSetOrder: post.doc_set_order?.toString() || post.organization_config?.doc_set_order?.toString() || '',
          docSetTitle: post.doc_set_title || post.organization_config?.doc_set_title || '',
          section: post.section || post.organization_config?.section_id?.toString() || '',
        };

        setFormData(newFormData);
        initialLoadRef.current = false;
      } else if (mode === 'create') {
        setFormData({
          title: '',
          description: '',
          content: '',
          contentType: 'html',
          subsection: '',
          slug: '',
          authorName: '',
          mainPhoto: '',
          mediaConfig: {},
          metaDescription: '',
          order: '',
          helpCenterOrder: '',
          displayThisPost: true,
          isDisplayedFirstPage: false,
          isCompanyAuthor: false,
          displayAsBlogPost: true,
          isHelpCenter: false,
          postType: 'default',
          isNumbered: false,
          createdOn: new Date().toISOString(),
          docSet: '',
          docSetOrder: '',
          docSetTitle: '',
          section: '',
        });
        initialLoadRef.current = false;
      }
      setIsDirty(false);
    } else {
      // Reset on close
      initialLoadRef.current = true;
    }
  }, [isOpen, mode, editingPost]);

  const updateField = useCallback(<K extends keyof PostFormData>(field: K, value: PostFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  const saveDraft = useCallback(() => {
    setFormData(currentData => {
      const draftData = {
        ...currentData,
        timestamp: Date.now(),
        postId: editingPost?.id,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      return currentData;
    });
  }, [editingPost?.id]);

  return {
    formData,
    setFormData,
    updateField,
    isDirty,
    setIsDirty,
    saveDraft,
  };
}
