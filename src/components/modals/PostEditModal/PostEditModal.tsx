// components/PostEditModal/PostEditModal.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePostEditModal } from './context';
import { InformationCircleIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';
import PostEditor from '@/components/PostPage/PostEditor';
import { useRouter } from 'next/navigation';
import { BaseModal } from '@/components/modals/_shared';
import { revalidatePage } from '@/lib/revalidation';
import { getOrganizationId } from '@/lib/supabase';
import ImageGalleryModal from '@/components/modals/ImageGalleryModal';
import Image from 'next/image';
import TOC from '@/components/PostPage/TOC';

interface TOCItem {
  tag_name: string;
  tag_text: string;
  tag_id: string;
}

// Utility function to generate slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const DRAFT_KEY = 'postEditModal_draft';
const AUTO_SAVE_INTERVAL = 2 * 60 * 1000; // 2 minutes

// Tooltip component
const Tooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-flex">
      <div onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
        {children}
      </div>
      {isVisible && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 pointer-events-none w-64">
          <div className="bg-white text-gray-700 text-xs rounded-lg py-2.5 px-3.5 shadow-lg border border-gray-200">
            {content}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-white" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-px w-0 h-0 border-l-[5px] border-r-[5px] border-b-[5px] border-transparent border-b-gray-200" />
          </div>
        </div>
      )}
    </div>
  );
};

export default function PostEditModal() {
  const {
    isOpen,
    isFullScreen,
    editingPost,
    mode,
    returnUrl,
    closeModal,
    toggleFullScreen,
    updatePost,
  } = usePostEditModal();

  const router = useRouter();
  const themeColors = useThemeColors();
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState<'html' | 'markdown'>('html');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [section, setSection] = useState('');
  const [subsection, setSubsection] = useState('');
  const [slug, setSlug] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [mainPhoto, setMainPhoto] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [order, setOrder] = useState('');
  const [helpCenterOrder, setHelpCenterOrder] = useState('');
  const [displayThisPost, setDisplayThisPost] = useState(true);
  const [isDisplayedFirstPage, setIsDisplayedFirstPage] = useState(false);
  const [isCompanyAuthor, setIsCompanyAuthor] = useState(false);
  const [displayAsBlogPost, setDisplayAsBlogPost] = useState(true);
  const [isHelpCenter, setIsHelpCenter] = useState(false);
  const [postType, setPostType] = useState<'default' | 'minimal' | 'landing' | 'doc_set'>('default');
  const [isNumbered, setIsNumbered] = useState(false);
  const [createdOn, setCreatedOn] = useState('');
  const [docSet, setDocSet] = useState('');
  const [docSetOrder, setDocSetOrder] = useState('');
  const [docSetTitle, setDocSetTitle] = useState('');
  const [availableSets, setAvailableSets] = useState<{ slug: string; title: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [toc, setToc] = useState<TOCItem[]>([]);
  const [isCodeView, setIsCodeView] = useState(false);
  const autoSaveRef = useRef<NodeJS.Timeout>();
  const lastSaveRef = useRef<number>(0);
  const editorContentRef = useRef<HTMLDivElement>(null);
  const initialLoadRef = useRef<boolean>(true); // Track if this is initial load

  // Computed value for isLandingPage
  const isLandingPage = section === 'Landing';

  // Extract TOC from content
  useEffect(() => {
    if (!content || !isFullScreen) {
      setToc([]);
      return;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    const tocItems: TOCItem[] = Array.from(headings).map((heading, index) => {
      const text = heading.textContent || '';
      const tagName = heading.tagName.toLowerCase();
      // Generate ID if it doesn't exist
      const id = heading.id || `heading-${index}`;
      
      return {
        tag_name: tagName,
        tag_text: text,
        tag_id: id,
      };
    });
    
    setToc(tocItems);
  }, [content, isFullScreen]);

  // Fetch available document sets for the organization
  useEffect(() => {
    const fetchDocumentSets = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const organizationId = await getOrganizationId(baseUrl);
        
        if (!organizationId) return;

        const response = await fetch(`${baseUrl}/api/document-sets?organization_id=${organizationId}`);
        
        if (response.ok) {
          const sets = await response.json();
          setAvailableSets(sets);
        }
      } catch (error) {
        console.error('Error fetching document sets:', error);
      }
    };

    if (isOpen) {
      fetchDocumentSets();
    }
  }, [isOpen]);

  // Handle TOC scroll - scroll to heading in editor
  const handleScrollTo = useCallback((id: string) => {
    // Find the editor's ProseMirror content area
    const editorContent = document.querySelector('.ProseMirror');
    if (!editorContent) return;

    // Find the heading with the matching ID or text content
    const headings = editorContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let targetHeading: Element | null = null;

    // First try to find by ID
    targetHeading = editorContent.querySelector(`#${CSS.escape(id)}`);

    // If not found by ID, try to find by matching text
    if (!targetHeading) {
      const tocItem = toc.find(item => item.tag_id === id);
      if (tocItem) {
        targetHeading = Array.from(headings).find(h => 
          h.textContent?.trim() === tocItem.tag_text.trim()
        ) || null;
      }
    }

    if (targetHeading) {
      targetHeading.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Optional: highlight the heading briefly
      targetHeading.classList.add('ring-2', 'ring-sky-500', 'rounded');
      setTimeout(() => {
        targetHeading?.classList.remove('ring-2', 'ring-sky-500', 'rounded');
      }, 2000);
    }
  }, [toc]);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && editingPost) {
        const post = editingPost as any;
        setTitle(post.title || '');
        setDescription(post.description || '');
        
        // Only update content on initial load, not when editingPost updates after save
        if (initialLoadRef.current) {
          setContent(post.content || '');
          setContentType(post.content_type || 'html');
          initialLoadRef.current = false;
        }
        
        // Handle both flat and JSONB formats for backward compatibility
        setSection(post.section || post.organization_config?.section_id?.toString() || '');
        setSubsection(post.subsection || post.organization_config?.subsection || '');
        setSlug(post.slug || '');
        setAuthorName(post.author_name || '');
        setMainPhoto(post.main_photo || post.media_config?.main_photo || '');
        setMetaDescription(post.metadescription_for_page || '');
        setOrder(post.order?.toString() || post.organization_config?.order?.toString() || '');
        setHelpCenterOrder(post.help_center_order?.toString() || post.display_config?.help_center_order?.toString() || '');
        setDisplayThisPost(post.display_this_post ?? post.display_config?.display_this_post ?? true);
        setIsDisplayedFirstPage(post.is_displayed_first_page ?? post.display_config?.is_displayed_first_page ?? false);
        setIsCompanyAuthor(post.is_company_author ?? post.author_config?.is_company_author ?? false);
        setDisplayAsBlogPost(post.display_as_blog_post ?? post.display_config?.display_as_blog_post ?? true);
        setIsHelpCenter(post.is_help_center ?? post.display_config?.is_help_center ?? false);
        setPostType(post.display_config?.type || 'default');
        setIsNumbered(post.display_config?.is_numbered ?? false);
        setCreatedOn(post.created_on || '');
        setDocSet(post.doc_set || post.organization_config?.doc_set || '');
        setDocSetOrder(post.doc_set_order?.toString() || post.organization_config?.doc_set_order?.toString() || '');
        setDocSetTitle(post.doc_set_title || post.organization_config?.doc_set_title || '');
        
        // Set isCodeView to true for landing pages to open them in HTML mode
        if (post.display_config?.type === 'landing') {
          setIsCodeView(true);
        }
      } else if (mode === 'create') {
        // Clear all fields for create mode
        setTitle('');
        setDescription('');
        setContent('');
        setSection('');
        setSubsection('');
        setSlug('');
        setAuthorName('');
        setMainPhoto('');
        setMetaDescription('');
        setOrder('');
        setHelpCenterOrder('');
        setDisplayThisPost(true);
        setIsDisplayedFirstPage(false);
        setIsCompanyAuthor(false);
        setDisplayAsBlogPost(true);
        setIsHelpCenter(false);
        setPostType('default');
        setIsNumbered(false);
        setCreatedOn(new Date().toISOString());
        setDocSet('');
        setDocSetOrder('');
        setDocSetTitle('');
        initialLoadRef.current = false;
      }
      setIsDirty(false);
    } else {
      // Clear all fields when modal closes and reset initial load flag
      setTitle('');
      setDescription('');
      setContent('');
      setSection('');
      setSubsection('');
      setSlug('');
      setAuthorName('');
      setMainPhoto('');
      setMetaDescription('');
      setOrder('');
      setHelpCenterOrder('');
      setDisplayThisPost(true);
      setIsDisplayedFirstPage(false);
      setIsCompanyAuthor(false);
      setDisplayAsBlogPost(true);
      setIsHelpCenter(false);
      setPostType('default');
      setCreatedOn('');
      setDocSet('');
      setDocSetOrder('');
      setDocSetTitle('');
      setIsDirty(false);
      setIsCodeView(false); // Reset to visual mode when closing
      initialLoadRef.current = true; // Reset for next open
    }
  }, [isOpen, mode, editingPost]);

  // Automatically switch to HTML mode when post type is changed to 'landing'
  useEffect(() => {
    if (postType === 'landing') {
      setIsCodeView(true);
    }
  }, [postType]);

  // Auto-generate slug from title in create mode
  useEffect(() => {
    if (mode === 'create' && title) {
      const generatedSlug = generateSlug(title);
      if (generatedSlug) {
        setSlug(generatedSlug);
      }
    }
  }, [title, mode]);

  // Auto-save to localStorage
  const saveDraft = useCallback(() => {
    const draftData = {
      title,
      description,
      content,
      section,
      subsection,
      slug,
      authorName,
      mainPhoto,
      metaDescription,
      order,
      helpCenterOrder,
      displayThisPost,
      isDisplayedFirstPage,
      isCompanyAuthor,
      displayAsBlogPost,
      isHelpCenter,
      postType,
      createdOn,
      timestamp: Date.now(),
      postId: editingPost?.id,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    lastSaveRef.current = Date.now();
  }, [title, description, content, section, subsection, slug, authorName, mainPhoto, metaDescription, order, helpCenterOrder, displayThisPost, isDisplayedFirstPage, isCompanyAuthor, displayAsBlogPost, isHelpCenter, postType, createdOn, editingPost?.id]);

  // Set up auto-save interval
  useEffect(() => {
    if (isOpen && isDirty) {
      autoSaveRef.current = setInterval(() => {
        const now = Date.now();
        if (now - lastSaveRef.current >= AUTO_SAVE_INTERVAL) {
          saveDraft();
        }
      }, 30000);

      return () => {
        if (autoSaveRef.current) {
          clearInterval(autoSaveRef.current);
        }
      };
    }
  }, [isOpen, isDirty, saveDraft]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setIsDirty(true);
  }, []);

  const handleFieldChange = useCallback((field: string, value: any) => {
    switch (field) {
      case 'title':
        setTitle(value as string);
        break;
      case 'description':
        setDescription(value as string);
        break;
      case 'section':
        setSection(value as string);
        break;
      case 'subsection':
        setSubsection(value as string);
        break;
      case 'slug':
        setSlug(value as string);
        break;
      case 'authorName':
        setAuthorName(value as string);
        break;
      case 'mainPhoto':
        setMainPhoto(value as string);
        break;
      case 'metaDescription':
        setMetaDescription(value as string);
        break;
      case 'order':
        setOrder(value as string);
        break;
      case 'helpCenterOrder':
        setHelpCenterOrder(value as string);
        break;
      case 'displayThisPost':
        setDisplayThisPost(value as boolean);
        break;
      case 'isDisplayedFirstPage':
        setIsDisplayedFirstPage(value as boolean);
        break;
      case 'isCompanyAuthor':
        setIsCompanyAuthor(value as boolean);
        break;
      case 'displayAsBlogPost':
        setDisplayAsBlogPost(value as boolean);
        break;
      case 'isHelpCenter':
        setIsHelpCenter(value as boolean);
        break;
      case 'postType':
        setPostType(value as 'default' | 'minimal' | 'landing' | 'doc_set');
        break;
      case 'isNumbered':
        setIsNumbered(value as boolean);
        break;
      case 'createdOn':
        setCreatedOn(value as string);
        break;
      case 'docSet':
        setDocSet(value as string);
        break;
      case 'docSetOrder':
        setDocSetOrder(value as string);
        break;
      case 'docSetTitle':
        setDocSetTitle(value as string);
        break;
    }
    setIsDirty(true);
  }, []);

  const handleSaveWithContent = async (contentToSave?: string) => {
    setIsSaving(true);
    
    try {
      if (!title.trim()) {
        alert('Title is required');
        return;
      }
      
      // Use the content passed from the editor (preserves HTML comments and formatting)
      // or fall back to the state content
      const finalContent = contentToSave !== undefined ? contentToSave : content;
      
      // Build JSONB-structured data for the new API format
      const postData: any = {
        title: title.trim(),
        description: description.trim(),
        content: finalContent,
        content_type: contentType,
        // JSONB fields
        display_config: {
          display_this_post: displayThisPost,
          display_as_blog_post: displayAsBlogPost,
          is_displayed_first_page: isDisplayedFirstPage,
          is_help_center: isHelpCenter,
          help_center_order: helpCenterOrder.trim() ? parseInt(helpCenterOrder) : 0,
          type: postType,
          is_numbered: isNumbered,
        },
        organization_config: {
          section_id: section.trim() ? parseInt(section) : null,
          subsection: subsection.trim() || null,
          order: order.trim() ? parseInt(order) : 0,
          doc_set: docSet && docSet !== '__custom__' ? docSet : null,
          doc_set_order: docSet && docSet !== '__custom__' && docSetOrder.trim() ? parseInt(docSetOrder) : null,
          doc_set_title: docSet && docSet !== '__custom__' && docSetTitle.trim() ? docSetTitle.trim() : null,
        },
        author_config: {
          is_with_author: false, // You might want to add a field for this
          is_company_author: isCompanyAuthor,
          author_id: null, // Add field if needed
        },
        media_config: {
          main_photo: mainPhoto.trim() || null,
        },
      };
      
      if (authorName.trim()) postData.author_name = authorName.trim();
      if (metaDescription.trim()) postData.metadescription_for_page = metaDescription.trim();
      if (createdOn) postData.created_on = createdOn;
      
      let url: string;
      let method: string;
      
      if (mode === 'create') {
        if (slug.trim()) {
          postData.slug = slug.trim();
        } else {
          postData.slug = generateSlug(title);
        }
        url = '/api/posts';
        method = 'POST';
      } else {
        if (slug.trim()) postData.slug = slug.trim();
        // Use slug-based route instead of ID
        url = `/api/posts/${editingPost?.slug || slug}`;
        method = 'PATCH'; // Changed from PUT to PATCH
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${mode} post`);
      }
      
      const savedPost = await response.json();
      
      localStorage.removeItem(DRAFT_KEY);
      setIsDirty(false);
      
      // Don't update editingPost in context during edit mode
      // This prevents reloading content and losing comments/formatting
      // The modal will close and the page will refresh anyway
      if (updatePost && mode === 'create') {
        updatePost(savedPost);
      }
      
      // Dispatch custom event to notify components of updates (EXACTLY like HeroSectionModal does)
      window.dispatchEvent(new CustomEvent('post-updated', { 
        detail: savedPost 
      }));
      
      // Trigger cache revalidation for instant updates in production
      const postSlug = savedPost.slug || slug;
      revalidatePage(postSlug).catch(err => {
        console.warn('⚠️ Cache revalidation failed (non-critical):', err);
      });
      
      closeModal();
      
      if (returnUrl) {
        router.push(returnUrl);
      } else if (mode === 'create') {
        router.push(`/${savedPost.slug}`);
      } else {
        // For post updates, the event listener in PostPageClient will handle the reload
        // This matches the Hero pattern where the component handles the update
      }
    } catch (error: any) {
      console.error('Error saving post:', error);
      alert(error.message || 'Failed to save post. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Wrapper for onClick handlers that don't pass content
  const handleSave = () => {
    handleSaveWithContent();
  };

  const handleClose = () => {
    if (isDirty) {
      const confirmClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close? Your draft will be saved locally.'
      );
      if (confirmClose) {
        saveDraft();
        closeModal();
      }
    } else {
      closeModal();
    }
  };

  // Title with badge
  const modalTitle = (
    <div className="flex items-center gap-2.5">
      <span className="text-xl font-semibold text-gray-900">
        Post
      </span>
      <span 
        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${
          mode === 'edit' 
            ? 'bg-amber-100 text-amber-700 border-amber-200'
            : ''
        }`}
        style={mode === 'create' ? {
          backgroundColor: themeColors.cssVars.primary.lighter,
          color: themeColors.cssVars.primary.base,
          borderColor: themeColors.cssVars.primary.light
        } : undefined}
      >
        {mode === 'edit' ? 'Edit' : 'New'}
      </span>
    </div>
  );

  // Header actions (+ More button or Back button)
  const headerActions = !showAdvancedFields ? (
    <button
      onClick={() => setShowAdvancedFields(true)}
      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-1.5"
      title="Advanced settings for SEO, media, and display options"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      <span>More</span>
    </button>
  ) : (
    <button
      onClick={() => setShowAdvancedFields(false)}
      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-1.5"
      title="Back to editor"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
      </svg>
      <span>Back</span>
    </button>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      subtitle={mode === 'edit' ? 'Update your blog post content' : 'Create a new blog post'}
      size="xl"
      draggable={true}
      resizable={true}
      fullscreen={isFullScreen}
      showFullscreenButton={true}
      onToggleFullscreen={toggleFullScreen}
      headerActions={headerActions}
      noPadding={true}
      showFooter={false}
    >
      <div className="flex flex-col h-full">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          {/* Editor or Advanced Fields */}
          {!showAdvancedFields ? (
            <div className={isFullScreen ? "grid lg:grid-cols-8 gap-x-4 px-4" : ""}>
              {/* TOC Sidebar - Only in fullscreen and hidden when in HTML editor for landing pages */}
              {isFullScreen && !(postType === 'landing' && isCodeView) && (
                <aside className="lg:col-span-2 space-y-8 pb-8 sm:px-4">
                  <div className="hidden lg:block mt-8 sticky top-8">
                    {toc.length > 0 ? (
                      <TOC toc={toc} handleScrollTo={handleScrollTo} />
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                          <svg 
                            className="w-4 h-4 mr-2" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                            style={{ color: themeColors.cssVars.primary.base }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                          </svg>
                          Table of Contents
                        </h3>
                        <p className="text-xs text-gray-500">
                          Add headings to your content to see the table of contents here
                        </p>
                      </div>
                    )}
                  </div>
                </aside>
              )}

              {/* Main Content Area */}
              <div className={isFullScreen ? (postType === 'landing' && isCodeView ? "lg:col-span-8" : "lg:col-span-4") : ""}>
                {/* Title and Description Section - Hidden when in HTML editor mode for landing pages */}
                {!(postType === 'landing' && isCodeView) && (
                  <div className="p-6 pb-4 bg-white space-y-4 border-b border-gray-100">
                    {/* Subsection */}
                    {!isLandingPage && (
                      <div>
                        <input
                          type="text"
                          value={subsection}
                          onChange={(e) => handleFieldChange('subsection', e.target.value)}
                          className="px-0 py-1 border-0 focus:outline-none focus:ring-0 font-medium text-xs tracking-widest bg-transparent uppercase"
                          placeholder="SUBSECTION"
                          style={{
                            color: themeColors.cssVars.primary.base,
                            '--tw-placeholder-opacity': '0.5'
                          } as React.CSSProperties}
                        />
                      </div>
                    )}
                    
                    {/* Title */}
                    <div>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => handleFieldChange('title', e.target.value)}
                        className="w-full px-0 py-2 border-0 focus:outline-none focus:ring-0 text-4xl font-bold text-gray-900 placeholder:text-gray-300 bg-transparent"
                        placeholder="Enter post title..."
                      />
                    </div>
                    
                    {/* Description */}
                    <div>
                      <textarea
                        value={description}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        rows={3}
                        className="w-full px-0 py-2 border-0 focus:outline-none focus:ring-0 text-lg text-gray-600 placeholder:text-gray-300 resize-none bg-transparent leading-relaxed"
                        placeholder="Brief description or subtitle..."
                      />
                    </div>
                  </div>
                )}

                {/* Landing Page Type Notice - Hidden when in HTML editor */}
                {postType === 'landing' && !isCodeView && (
                  <div className="mx-4 mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-amber-900 mb-1">Landing Page Mode</h4>
                        <p className="text-xs text-amber-800 leading-relaxed mb-2">
                          This is a landing page without standard blog styling. Use the <strong>HTML editor</strong> (click the <code className="px-1.5 py-0.5 bg-amber-100 rounded text-amber-900">&lt;/&gt;</code> button in the toolbar) to create custom layouts with full HTML/CSS control.
                        </p>
                        <p className="text-xs text-amber-700">
                          💡 <strong>Tip:</strong> Table of contents, description, and author information will not be displayed for this page type.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Editor */}
                <PostEditor
                  key={`${mode}-${editingPost?.id || 'new'}-${isOpen}-${contentType}`}
                  initialContent={content}
                  initialContentType={contentType}
                  onContentChange={(newContent, newContentType) => {
                    handleContentChange(newContent);
                    if (newContentType) {
                      setContentType(newContentType);
                    }
                  }}
                  onSave={handleSaveWithContent}
                  onCodeViewChange={setIsCodeView}
                  postType={postType}
                  initialCodeView={postType === 'landing'}
                />
              </div>

              {/* Right Sidebar - Only in fullscreen */}
              {isFullScreen && (
                <aside className="lg:col-span-2"></aside>
              )}
            </div>
          ) : (
            <div className="px-6 py-6 bg-white">
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Section Title */}
                <div className="pb-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Advanced Settings</h3>
                </div>

              {/* Type Section */}
              <div className="space-y-4">
                <div className="inline-flex items-center px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg">
                  <span className="text-sm font-semibold text-purple-900 uppercase tracking-wide">Type</span>
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 block">
                    Post Display Type
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {/* Default Type */}
                    <button
                      type="button"
                      onClick={() => handleFieldChange('postType', 'default')}
                      className={`relative flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                        postType === 'default'
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/30'
                      }`}
                    >
                      <svg className="w-8 h-8 mb-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-900">Default</span>
                      <span className="text-xs text-gray-500 mt-1 text-center">Full blog post with TOC & author</span>
                      {postType === 'default' && (
                        <div className="absolute top-2 right-2">
                          <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>

                    {/* Minimal Type */}
                    <button
                      type="button"
                      onClick={() => handleFieldChange('postType', 'minimal')}
                      className={`relative flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                        postType === 'minimal'
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/30'
                      }`}
                    >
                      <svg className="w-8 h-8 mb-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-900">Minimal</span>
                      <span className="text-xs text-gray-500 mt-1 text-center">Content only, no TOC or metadata</span>
                      {postType === 'minimal' && (
                        <div className="absolute top-2 right-2">
                          <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>

                    {/* Landing Type */}
                    <button
                      type="button"
                      onClick={() => handleFieldChange('postType', 'landing')}
                      className={`relative flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                        postType === 'landing'
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/30'
                      }`}
                    >
                      <svg className="w-8 h-8 mb-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-900">Landing</span>
                      <span className="text-xs text-gray-500 mt-1 text-center">Custom HTML, no blog styling</span>
                      {postType === 'landing' && (
                        <div className="absolute top-2 right-2">
                          <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>

                    {/* Doc Set Type */}
                    <button
                      type="button"
                      onClick={() => handleFieldChange('postType', 'doc_set')}
                      className={`relative flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                        postType === 'doc_set'
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/30'
                      }`}
                    >
                      <svg className="w-8 h-8 mb-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-900">Doc Set</span>
                      <span className="text-xs text-gray-500 mt-1 text-center">Part of documentation series</span>
                      {postType === 'doc_set' && (
                        <div className="absolute top-2 right-2">
                          <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Type descriptions */}
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-xs text-gray-600 leading-relaxed">
                        {postType === 'default' && (
                          <span><strong>Default:</strong> Standard blog post with table of contents, description, author info, and date.</span>
                        )}
                        {postType === 'minimal' && (
                          <span><strong>Minimal:</strong> Clean content-only view without TOC, description, or author information.</span>
                        )}
                        {postType === 'landing' && (
                          <span><strong>Landing:</strong> Custom HTML page without blog styling. Use the HTML editor to create your layout.</span>
                        )}
                        {postType === 'doc_set' && (
                          <span><strong>Doc Set:</strong> Article in a documentation series with Master TOC navigation and prev/next links.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Show is_numbered checkbox only for doc_set type */}
                  {postType === 'doc_set' && (
                    <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isNumbered}
                          onChange={(e) => handleFieldChange('isNumbered', e.target.checked)}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Show article numbers in Master TOC</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1 ml-6">
                        When enabled, articles will be numbered (1, 2, 3...) in the Master TOC navigation.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* SEO & Identity Section */}
              <div className="space-y-4">
                <div 
                  className="inline-flex items-center px-3 py-1.5 rounded-lg border"
                  style={{
                    backgroundColor: themeColors.cssVars.primary.lighter,
                    borderColor: themeColors.cssVars.primary.light
                  }}
                >
                  <span 
                    className="text-sm font-semibold uppercase tracking-wide"
                    style={{ color: themeColors.cssVars.primary.base }}
                  >
                    SEO & Identity
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                      Slug {mode === 'create' && (
                        <span 
                          className="text-xs font-normal"
                          style={{ color: themeColors.cssVars.primary.base }}
                        >
                          (auto-generated)
                        </span>
                      )}
                      <Tooltip content="URL-friendly identifier for this post">
                        <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                      </Tooltip>
                    </label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => handleFieldChange('slug', e.target.value)}
                      placeholder="custom-url-slug"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-white
                               focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent
                               transition-all duration-150 text-gray-900 placeholder-gray-400 font-mono text-sm"
                      style={{
                        '--tw-ring-color': `${themeColors.cssVars.primary.base}30`
                      } as React.CSSProperties}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                      Author Name
                      <Tooltip content="Name of the post author">
                        <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                      </Tooltip>
                    </label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => handleFieldChange('authorName', e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-white
                               focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent
                               transition-all duration-150 text-gray-900 placeholder-gray-400"
                      style={{
                        '--tw-ring-color': `${themeColors.cssVars.primary.base}30`
                      } as React.CSSProperties}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    Meta Description
                    <Tooltip content="SEO meta description for search engines (max 160 characters)">
                      <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                    </Tooltip>
                  </label>
                  <textarea
                    value={metaDescription}
                    onChange={(e) => handleFieldChange('metaDescription', e.target.value)}
                    rows={2}
                    maxLength={160}
                    placeholder="A brief description for search engines..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-white
                             focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent
                             transition-all duration-150 text-gray-900 placeholder-gray-400 resize-none"
                    style={{
                      '--tw-ring-color': `${themeColors.cssVars.primary.base}30`
                    } as React.CSSProperties}
                  />
                  <div className="flex items-center justify-end">
                    <span className={`text-xs font-medium ${
                      metaDescription.length > 140 ? 'text-orange-600' : 'text-gray-400'
                    }`}>
                      {metaDescription.length}/160
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                      Section
                      <Tooltip content="Content section or category">
                        <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                      </Tooltip>
                    </label>
                    <input
                      type="text"
                      value={section}
                      onChange={(e) => handleFieldChange('section', e.target.value)}
                      placeholder="Blog, News, etc."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-white
                               focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent
                               transition-all duration-150 text-gray-900 placeholder-gray-400"
                      style={{
                        '--tw-ring-color': `${themeColors.cssVars.primary.base}30`
                      } as React.CSSProperties}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                      Display Order
                      <Tooltip content="Numerical order for sorting posts">
                        <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                      </Tooltip>
                    </label>
                    <input
                      type="number"
                      value={order}
                      onChange={(e) => handleFieldChange('order', e.target.value)}
                      placeholder="1"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-white
                               focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent
                               transition-all duration-150 text-gray-900 placeholder-gray-400"
                      style={{
                        '--tw-ring-color': `${themeColors.cssVars.primary.base}30`
                      } as React.CSSProperties}
                    />
                  </div>
                </div>
              </div>

              {/* Media Section */}
              <div className="space-y-4">
                <div className="inline-flex items-center px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg">
                  <span className="text-sm font-semibold text-purple-900 uppercase tracking-wide">Media</span>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {/* Main Photo - Image Gallery */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                      Main Photo
                      <Tooltip content="Primary image for the post - Click to select from gallery">
                        <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                      </Tooltip>
                    </label>
                    <div 
                      className="relative w-full h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 hover:border-purple-400 transition-colors cursor-pointer group overflow-hidden flex items-center justify-center"
                      onClick={() => setIsImageGalleryOpen(true)}
                    >
                      {mainPhoto ? (
                        <>
                          <div className="relative h-full max-w-full flex items-center justify-center">
                            <Image
                              src={mainPhoto}
                              alt="Main photo"
                              width={0}
                              height={0}
                              sizes="100vw"
                              style={{ width: 'auto', height: '100%', maxWidth: '100%' }}
                              className="object-contain rounded-lg"
                              loading="lazy"
                            />
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                            <PencilIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 group-hover:text-purple-600 transition-colors">
                          <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                          <p className="text-sm font-medium">Click to select image</p>
                          <p className="text-xs text-gray-400 mt-1">Choose from gallery</p>
                        </div>
                      )}
                    </div>
                    {mainPhoto && (
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500 truncate flex-1 mr-2" title={mainPhoto}>
                          {mainPhoto}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFieldChange('mainPhoto', '');
                          }}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Display Options Section */}
              <div className="space-y-4">
                <div className="inline-flex items-center px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-sm font-semibold text-green-900 uppercase tracking-wide">Display Options</span>
                </div>
                
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                    <input
                      type="checkbox"
                      checked={displayThisPost}
                      onChange={(e) => handleFieldChange('displayThisPost', e.target.checked)}
                      className="w-4 h-4 border-gray-300 rounded focus:ring-2"
                      style={{
                        accentColor: themeColors.cssVars.primary.base,
                        '--tw-ring-color': themeColors.cssVars.primary.base
                      } as React.CSSProperties}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700">Display Post</span>
                      <p className="text-xs text-gray-500">Make this post visible to users</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                    <input
                      type="checkbox"
                      checked={displayAsBlogPost}
                      onChange={(e) => handleFieldChange('displayAsBlogPost', e.target.checked)}
                      className="w-4 h-4 border-gray-300 rounded focus:ring-2"
                      style={{
                        accentColor: themeColors.cssVars.primary.base,
                        '--tw-ring-color': themeColors.cssVars.primary.base
                      } as React.CSSProperties}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700">Display as Blog Post</span>
                      <p className="text-xs text-gray-500">Show in blog listings</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                    <input
                      type="checkbox"
                      checked={isDisplayedFirstPage}
                      onChange={(e) => handleFieldChange('isDisplayedFirstPage', e.target.checked)}
                      className="w-4 h-4 border-gray-300 rounded focus:ring-2"
                      style={{
                        accentColor: themeColors.cssVars.primary.base,
                        '--tw-ring-color': themeColors.cssVars.primary.base
                      } as React.CSSProperties}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700">Feature on First Page</span>
                      <p className="text-xs text-gray-500">Display prominently on homepage</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                    <input
                      type="checkbox"
                      checked={isHelpCenter}
                      onChange={(e) => handleFieldChange('isHelpCenter', e.target.checked)}
                      className="w-4 h-4 border-gray-300 rounded focus:ring-2"
                      style={{
                        accentColor: themeColors.cssVars.primary.base,
                        '--tw-ring-color': themeColors.cssVars.primary.base
                      } as React.CSSProperties}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700">Help Center Article</span>
                      <p className="text-xs text-gray-500">Show in help center</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                    <input
                      type="checkbox"
                      checked={isCompanyAuthor}
                      onChange={(e) => handleFieldChange('isCompanyAuthor', e.target.checked)}
                      className="w-4 h-4 border-gray-300 rounded focus:ring-2"
                      style={{
                        accentColor: themeColors.cssVars.primary.base,
                        '--tw-ring-color': themeColors.cssVars.primary.base
                      } as React.CSSProperties}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700">Company Author</span>
                      <p className="text-xs text-gray-500">Attribute to company instead of individual</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Help Center Order - only show if isHelpCenter is true */}
              {isHelpCenter && (
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    Help Center Order
                    <Tooltip content="Display order in help center">
                      <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                    </Tooltip>
                  </label>
                  <input
                    type="number"
                    value={helpCenterOrder}
                    onChange={(e) => handleFieldChange('helpCenterOrder', e.target.value)}
                    placeholder="1"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-white
                             focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent
                             transition-all duration-150 text-gray-900 placeholder-gray-400"
                    style={{
                      '--tw-ring-color': `${themeColors.cssVars.primary.base}30`
                    } as React.CSSProperties}
                  />
                </div>
              )}

              {/* Document Set Section */}
              <div className="space-y-4">
                <div className="inline-flex items-center px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <span className="text-sm font-semibold text-indigo-900 uppercase tracking-wide">Document Set</span>
                </div>
                
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Organize this post into a document set for multi-article documentation with shared navigation.
                  </p>
                  
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                      Document Set
                      <Tooltip content="Group posts into document sets for tutorials, guides, and multi-part documentation">
                        <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                      </Tooltip>
                    </label>
                    <div className="space-y-2">
                      <select
                        value={docSet}
                        onChange={(e) => handleFieldChange('docSet', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-white
                                 focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent
                                 transition-all duration-150 text-gray-900"
                        style={{
                          '--tw-ring-color': `${themeColors.cssVars.primary.base}30`
                        } as React.CSSProperties}
                      >
                        <option value="">No Document Set</option>
                        {availableSets.map((set) => (
                          <option key={set.slug} value={set.slug}>{set.title}</option>
                        ))}
                        <option value="__custom__">+ Create New Set</option>
                      </select>
                      
                      {docSet === '__custom__' && (
                        <input
                          type="text"
                          value={docSetTitle}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            handleFieldChange('docSetTitle', newValue);
                            handleFieldChange('docSet', newValue.toLowerCase().replace(/\s+/g, '-'));
                          }}
                          placeholder="Enter new document set name (e.g., User Guide)"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-white
                                   focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent
                                   transition-all duration-150 text-gray-900 placeholder-gray-400"
                          style={{
                            '--tw-ring-color': `${themeColors.cssVars.primary.base}30`
                          } as React.CSSProperties}
                        />
                      )}
                    </div>
                  </div>

                  {docSet && docSet !== '__custom__' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                          Set Display Title
                          <Tooltip content="Human-readable title for the document set">
                            <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                          </Tooltip>
                        </label>
                        <input
                          type="text"
                          value={docSetTitle}
                          onChange={(e) => handleFieldChange('docSetTitle', e.target.value)}
                          placeholder="e.g., Getting Started Guide"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-white
                                   focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent
                                   transition-all duration-150 text-gray-900 placeholder-gray-400"
                          style={{
                            '--tw-ring-color': `${themeColors.cssVars.primary.base}30`
                          } as React.CSSProperties}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                          Article Order
                          <Tooltip content="Display order within the document set (lower numbers appear first)">
                            <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                          </Tooltip>
                        </label>
                        <input
                          type="number"
                          value={docSetOrder}
                          onChange={(e) => handleFieldChange('docSetOrder', e.target.value)}
                          placeholder="1"
                          min="0"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-white
                                   focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent
                                   transition-all duration-150 text-gray-900 placeholder-gray-400"
                          style={{
                            '--tw-ring-color': `${themeColors.cssVars.primary.base}30`
                          } as React.CSSProperties}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Metadata Section */}
              <div className="space-y-4">
                <div className="inline-flex items-center px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg">
                  <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Metadata</span>
                </div>
                
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    Created On
                    <Tooltip content="Post creation date and time">
                      <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                    </Tooltip>
                  </label>
                  <input
                    type="datetime-local"
                    value={createdOn ? new Date(createdOn).toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleFieldChange('createdOn', new Date(e.target.value).toISOString())}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-white
                             focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent
                             transition-all duration-150 text-gray-900"
                    style={{
                      '--tw-ring-color': `${themeColors.cssVars.primary.base}30`
                    } as React.CSSProperties}
                  />
                </div>
              </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Banner - Before Footer - Only show for new posts */}
        {!showAdvancedFields && mode === 'create' && (
          <div className="hidden md:block px-6 py-4 border-t border-gray-100 bg-gray-50">
            <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-3.5">
              <div className="flex items-center">
                <div className="space-y-1.5 flex-1">
                  <p className="text-sm font-semibold text-sky-900">💡 Quick Tip</p>
                  <p className="text-xs text-sky-800 leading-relaxed">
                    Enter your title and description above, then use the editor toolbar to format your content. Click "+ More" in the header for advanced settings. Changes auto-save every 2 minutes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer - Fixed for both regular and advanced modes */}
        <div className="px-6 py-3 border-t border-gray-200 bg-white flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {isDirty ? (
              <span className="flex items-center">
                <svg className="animate-spin h-4 w-4 mr-2 text-sky-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Draft saved locally
              </span>
            ) : (
              <span>All changes saved</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={showAdvancedFields ? () => setShowAdvancedFields(false) : handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg 
                       hover:bg-gray-50 transition-colors"
            >
              {showAdvancedFields ? 'Back to Editor' : 'Cancel'}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90"
              style={{
                backgroundColor: themeColors.cssVars.primary.base
              }}
            >
              {isSaving ? 'Saving...' : mode === 'edit' ? 'Update' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Image Gallery Modal */}
      <ImageGalleryModal
        isOpen={isImageGalleryOpen}
        onClose={() => setIsImageGalleryOpen(false)}
        onSelectImage={(imageUrl) => {
          handleFieldChange('mainPhoto', imageUrl);
          setIsImageGalleryOpen(false);
        }}
      />
    </BaseModal>
  );
}
