// components/PostEditModal/PostEditModal.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePostEditModal } from '@/context/PostEditModalContext';
import { ArrowsPointingOutIcon, ArrowsPointingInIcon, XMarkIcon } from '@heroicons/react/24/outline';
import PostEditor from '@/components/PostPage/PostEditor';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
// Utility function to generate slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

const DRAFT_KEY = 'postEditModal_draft';
const AUTO_SAVE_INTERVAL = 2 * 60 * 1000; // 2 minutes

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
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [section, setSection] = useState('');
  const [subsection, setSubsection] = useState('');
  const [slug, setSlug] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [mainPhoto, setMainPhoto] = useState('');
  const [secondaryPhoto, setSecondaryPhoto] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [order, setOrder] = useState('');
  const [helpCenterOrder, setHelpCenterOrder] = useState('');
  const [displayThisPost, setDisplayThisPost] = useState(true);
  const [isDisplayedFirstPage, setIsDisplayedFirstPage] = useState(false);
  const [isCompanyAuthor, setIsCompanyAuthor] = useState(false);
  const [displayAsBlogPost, setDisplayAsBlogPost] = useState(true);
  const [isHelpCenter, setIsHelpCenter] = useState(false);
  const [createdOn, setCreatedOn] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const autoSaveRef = useRef<NodeJS.Timeout>();
  const lastSaveRef = useRef<number>(0);

  // Computed value for isLandingPage
  const isLandingPage = section === 'Landing';

  // Dragging and resizing state
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState(() => {
    if (typeof window === 'undefined') return { width: 920, height: 800 };
    return {
      width: Math.min(window.innerWidth - 80, 1400),
      height: Math.floor(window.innerHeight * 0.95)
    };
  });
  const modalRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && editingPost) {
        console.log('Loading post data for edit:', editingPost); // Debug log
        const post = editingPost as any; // Type assertion for extended fields
        setTitle(post.title || '');
        setDescription(post.description || '');
        setContent(post.content || '');
        setSection(post.section || '');
        setSubsection(post.subsection || '');
        setSlug(post.slug || '');
        setAuthorName(post.author_name || '');
        setMainPhoto(post.main_photo || '');
        setSecondaryPhoto(post.secondary_photo || '');
        setMetaDescription(post.metadescription_for_page || '');
        setOrder(post.order?.toString() || '');
        setHelpCenterOrder(post.help_center_order?.toString() || '');
        setDisplayThisPost(post.display_this_post ?? true);
        setIsDisplayedFirstPage(post.is_displayed_first_page ?? false);
        setIsCompanyAuthor(post.is_company_author ?? false);
        setDisplayAsBlogPost(post.display_as_blog_post ?? true);
        setIsHelpCenter(post.is_help_center ?? false);
        setCreatedOn(post.created_on || '');
      } else if (mode === 'create') {
        console.log('Creating new post, clearing all fields'); // Debug log
        // For create mode, start with default values
        setTitle('');
        setDescription('');
        setContent('');
        setSection('');
        setSubsection('');
        setSlug('');
        setAuthorName('');
        setMainPhoto('');
        setSecondaryPhoto('');
        setMetaDescription('');
        setOrder('');
        setHelpCenterOrder('');
        setDisplayThisPost(true);
        setIsDisplayedFirstPage(false);
        setIsCompanyAuthor(false);
        setDisplayAsBlogPost(true);
        setIsHelpCenter(false);
        setCreatedOn(new Date().toISOString());
      }
      setIsDirty(false);
    } else {
      // Clear all fields when modal closes to prevent state pollution
      setTitle('');
      setDescription('');
      setContent('');
      setSection('');
      setSubsection('');
      setSlug('');
      setAuthorName('');
      setMainPhoto('');
      setSecondaryPhoto('');
      setMetaDescription('');
      setOrder('');
      setHelpCenterOrder('');
      setDisplayThisPost(true);
      setIsDisplayedFirstPage(false);
      setIsCompanyAuthor(false);
      setDisplayAsBlogPost(true);
      setIsHelpCenter(false);
      setCreatedOn('');
      setIsDirty(false);
    }
  }, [isOpen, mode, editingPost]);

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
      secondaryPhoto,
      metaDescription,
      order,
      helpCenterOrder,
      displayThisPost,
      isDisplayedFirstPage,
      isCompanyAuthor,
      displayAsBlogPost,
      isHelpCenter,
      createdOn,
      timestamp: Date.now(),
      postId: editingPost?.id,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    lastSaveRef.current = Date.now();
  }, [title, description, content, section, subsection, slug, authorName, mainPhoto, secondaryPhoto, metaDescription, order, helpCenterOrder, displayThisPost, isDisplayedFirstPage, isCompanyAuthor, displayAsBlogPost, isHelpCenter, createdOn, editingPost?.id]);

  // Set up auto-save interval
  useEffect(() => {
    if (isOpen && isDirty) {
      autoSaveRef.current = setInterval(() => {
        const now = Date.now();
        if (now - lastSaveRef.current >= AUTO_SAVE_INTERVAL) {
          saveDraft();
        }
      }, 30000); // Check every 30 seconds

      return () => {
        if (autoSaveRef.current) {
          clearInterval(autoSaveRef.current);
        }
      };
    }
  }, [isOpen, isDirty, saveDraft]);

  // Drag and resize handlers
  const handleHeaderMouseDown = useCallback((e: React.MouseEvent) => {
    if (isFullScreen) return;
    
    // Only allow dragging if clicking on the header itself (not buttons)
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      return;
    }
    
    e.preventDefault();
    setIsDragging(true);
    const rect = modalRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  }, [isFullScreen]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging && !isResizing) return;
    
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      setPosition({ x: newX, y: newY });
    }
    
    if (isResizing) {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      setSize(prev => ({
        width: Math.max(400, prev.width + deltaX),
        height: Math.max(300, prev.height + deltaY)
      }));
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  }, [isDragging, isResizing, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  // Reset position and size when toggling fullscreen
  useEffect(() => {
    if (isFullScreen) {
      setPosition({ x: 0, y: 0 });
    } else {
      // Center the modal when switching back from fullscreen
      setPosition({ x: 0, y: 0 });
      setSize({ 
        width: 800, 
        height: typeof window !== 'undefined' ? Math.floor(window.innerHeight * 0.80) : 600 
      });
    }
  }, [isFullScreen]);

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = isDragging ? 'grabbing' : 'nw-resize';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Save draft when content changes (after 2 minutes of inactivity)
  useEffect(() => {
    if (isDirty) {
      const timeout = setTimeout(() => {
        saveDraft();
      }, AUTO_SAVE_INTERVAL);

      return () => clearTimeout(timeout);
    }
  }, [content, title, description, isDirty, saveDraft]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setIsDirty(true);
  }, []);

  const handleFieldChange = useCallback((field: string, value: string | boolean) => {
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
      case 'secondaryPhoto':
        setSecondaryPhoto(value as string);
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
      case 'createdOn':
        setCreatedOn(value as string);
        break;
    }
    setIsDirty(true);
  }, []);

 const handleSave = async () => {
  setIsSaving(true);
  
  try {
    // Validate required fields
    if (!title.trim()) {
      alert('Title is required');
      return;
    }
    
    let postData: any = {
      title: title.trim(),
      description: description.trim(),
      content,
      display_this_post: displayThisPost,
      is_displayed_first_page: isDisplayedFirstPage,
      is_company_author: isCompanyAuthor,
      display_as_blog_post: displayAsBlogPost,
      is_help_center: isHelpCenter,
    };
    
    // Add optional fields if they have values
    if (subsection.trim()) postData.subsection = subsection.trim();
    if (section.trim()) postData.section = section.trim();
    if (authorName.trim()) postData.author_name = authorName.trim();
    if (mainPhoto.trim()) postData.main_photo = mainPhoto.trim();
    if (secondaryPhoto.trim()) postData.secondary_photo = secondaryPhoto.trim();
    if (metaDescription.trim()) postData.metadescription_for_page = metaDescription.trim();
    if (order.trim()) postData.order = parseInt(order);
    if (helpCenterOrder.trim()) postData.help_center_order = parseInt(helpCenterOrder);
    if (createdOn) postData.created_on = createdOn;
    
    let url: string;
    let method: string;
    
    if (mode === 'create') {
      // For creating posts, generate slug and use POST to /api/posts
      const generatedSlug = slug.trim() || generateSlug(title);
      if (!generatedSlug) {
        alert('Could not generate a valid slug from the title. Please use alphanumeric characters.');
        return;
      }
      postData.slug = generatedSlug;
      url = '/api/posts';
      method = 'POST';
    } else {
      // For editing posts, use PATCH to /api/posts/[slug]
      if (!editingPost?.slug) {
        alert('Post slug is missing. Cannot update post.');
        return;
      }
      // Allow slug update in edit mode if provided
      if (slug.trim() && slug.trim() !== editingPost.slug) {
        postData.slug = slug.trim();
      }
      url = `/api/posts/${editingPost.slug}`;
      method = 'PATCH';
    }
    
    console.log('Saving post:', { method, url, postData }); // Debug log
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    if (response.ok) {
      // Clear draft and dirty state
      localStorage.removeItem(DRAFT_KEY);
      setIsDirty(false);
      
      // Close modal
      closeModal();
      
      // Navigation logic
      if (returnUrl) {
        router.push(returnUrl);
      } else {
        const result = await response.json();
        if (mode === 'create' && result.slug) {
          router.push(`/${result.slug}`);
        } else {
          router.refresh();
        }
      }
    } else {
      // Handle API errors with detailed messages
      let errorMessage = 'Failed to save post';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        console.error('API Error Response:', errorData);
      } catch (e) {
        const errorText = await response.text();
        console.error('API Error Text:', errorText);
        errorMessage = `${errorMessage} (Status: ${response.status})`;
      }
      alert(errorMessage);
    }
  } catch (error) {
    console.error('Error saving post:', error);
    alert(`Failed to save post: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    setIsSaving(false);
  }
};

  const handleClose = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) return;
    }
    closeModal();
  }, [isDirty, closeModal]);

  if (!isOpen) return null;

    const modalClasses = isFullScreen
    ? 'fixed inset-0 z-[9999] bg-white flex flex-col'
    : `fixed z-[9999] bg-white shadow-2xl border border-gray-200 flex flex-col inset-0 md:inset-auto md:rounded-lg ${isDragging ? 'cursor-grabbing' : 'md:cursor-grab'}`;

  const modalStyle = isFullScreen ? {} : {
    // On mobile (below md), use full screen via inset-0 class
    // On desktop (md and up), use custom positioning
    ...(typeof window !== 'undefined' && window.innerWidth >= 768 ? {
      width: `${size.width}px`,
      height: `${size.height}px`,
      maxWidth: 'none',
      maxHeight: 'none',
      ...(position.x === 0 && position.y === 0 
        ? {
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }
        : {
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'none'
          }
      )
    } : {})
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Backdrop - More transparent */}
      {!isFullScreen && (
        <div 
          className="fixed inset-0 bg-black/5 backdrop-blur-[2px] transition-all duration-300"
          onClick={handleClose}
        />
      )}
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className={modalClasses}
        style={modalStyle}
      >
        {/* Header - Draggable */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white md:rounded-t-lg md:cursor-grab md:active:cursor-grabbing select-none shadow-sm"
          onMouseDown={handleHeaderMouseDown}
        >
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === 'create' ? 'New Post' : 'Edit Post'}
            </h2>
            {isLandingPage && (
              <span className="inline-flex items-center text-xs font-medium text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Landing Page
              </span>
            )}
            {isDirty && (
              <span className="inline-flex items-center text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5 animate-pulse"></span>
                Unsaved
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Action buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                className="h-9 w-9 p-0"
                title={showAdvancedFields ? "Hide advanced fields" : "Show advanced fields"}
              >
                <svg className={`w-4 h-4 transition-transform ${showAdvancedFields ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </Button>
              
              <Button
                variant="secondary"
                onClick={handleClose}
                disabled={isSaving}
                className="h-9 text-sm"
              >
                Cancel
              </Button>
              
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={isSaving || !title.trim()}
                className="h-9 text-sm"
              >
                {isSaving ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  mode === 'create' ? 'Create' : 'Update'
                )}
              </Button>
            </div>
            
            {/* Window controls separator */}
            <div className="h-6 w-px bg-gray-300"></div>
            
            {/* Window control buttons */}
            <div className="flex items-center space-x-1">
              {/* Expand/Shrink button - hidden on mobile */}
              <button
                onClick={toggleFullScreen}
                className="hidden md:flex p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-all duration-200"
                title={isFullScreen ? 'Shrink' : 'Expand'}
              >
                {isFullScreen ? (
                  <ArrowsPointingInIcon className="w-5 h-5" />
                ) : (
                  <ArrowsPointingOutIcon className="w-5 h-5" />
                )}
              </button>
              
              {/* Close button */}
              <button
                onClick={handleClose}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200"
                title="Close"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Scrollable Content Area - includes title, description, and editor */}
          <div className="flex-1 overflow-y-auto bg-white">
            {/* Title and Description Section */}
            <div className="p-6 pb-4 bg-white space-y-4 border-b border-gray-100">
              {/* Subsection - Styled as real post badge above title */}
              {!isLandingPage && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={subsection}
                    onChange={(e) => handleFieldChange('subsection', e.target.value)}
                    className="px-0 py-1 border-0 focus:outline-none focus:ring-0 font-medium text-xs text-sky-500 tracking-widest placeholder:text-sky-300 bg-transparent uppercase"
                    placeholder="SUBSECTION"
                  />
                </div>
              )}
              
              {/* Title - Styled as real post heading */}
              <div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  className="w-full px-0 py-2 border-0 focus:outline-none focus:ring-0 text-4xl font-bold text-gray-900 placeholder:text-gray-300 bg-transparent"
                  placeholder="Enter post title..."
                />
              </div>
              
              {/* Description - Styled as real post subtitle, 3 lines */}
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

            {/* Editor Content - Hidden when advanced fields are shown */}
            {!showAdvancedFields && (
              <PostEditor
                key={`${mode}-${editingPost?.id || 'new'}-${isOpen}`}
                initialContent={content}
                onContentChange={handleContentChange}
                onSave={handleSave}
              />
            )}

            {/* Advanced Fields - Overlays editor when opened */}
            {showAdvancedFields && (
              <div className="px-6 py-4 bg-white space-y-6 animate-in fade-in slide-in-from-top-2 duration-300 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {/* SEO & Identity Section */}
                <div className="space-y-4">
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-full">
                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-sm font-bold text-blue-900 uppercase tracking-wide">SEO & Identity</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Slug {mode === 'create' && <span className="text-xs font-normal text-blue-600">(auto-generated)</span>}
                      </label>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => handleFieldChange('slug', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                        placeholder="custom-url-slug"
                      />
                      <p className="text-xs text-gray-500 mt-1">{mode === 'create' ? 'Auto-generates from title, edit to customize' : 'Edit to change URL slug'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Author Name
                      </label>
                      <input
                        type="text"
                        value={authorName}
                        onChange={(e) => handleFieldChange('authorName', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                        placeholder="Author name"
                      />
                    </div>
                  </div>
                  
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      value={metaDescription}
                      onChange={(e) => handleFieldChange('metaDescription', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[60px] transition-all duration-200 hover:border-gray-400"
                      placeholder="Meta description for SEO..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Recommended: 150-160 characters</p>
                  </div>
                </div>

                {/* Organization Section */}
                <div className="space-y-4">
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-full">
                    <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    <span className="text-sm font-bold text-purple-900 uppercase tracking-wide">Organization</span>
                  </div>
                  
                  {/* Landing Page Toggle */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <div>
                          <span className="text-sm font-semibold text-gray-700">Landing Page</span>
                          <p className="text-xs text-gray-500">Display as a landing page (no TOC, different layout)</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isLandingPage}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSection('Landing');
                          } else {
                            setSection('');
                          }
                        }}
                        className="w-5 h-5 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 focus:ring-2 cursor-pointer"
                      />
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Section field - always visible but pre-filled when Landing */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Section {isLandingPage && <span className="text-xs text-purple-600">(Auto-set to &quot;Landing&quot;)</span>}
                      </label>
                      <input
                        type="text"
                        value={section}
                        onChange={(e) => handleFieldChange('section', e.target.value)}
                        disabled={isLandingPage}
                        className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 ${isLandingPage ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        placeholder="Post section..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Display Order
                      </label>
                      <input
                        type="number"
                        value={order}
                        onChange={(e) => handleFieldChange('order', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Help Center Order
                      </label>
                      <input
                        type="number"
                        value={helpCenterOrder}
                        onChange={(e) => handleFieldChange('helpCenterOrder', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Media Section */}
                <div className="space-y-4">
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full">
                    <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-bold text-green-900 uppercase tracking-wide">Media</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Main Photo URL
                      </label>
                      <input
                        type="text"
                        value={mainPhoto}
                        onChange={(e) => handleFieldChange('mainPhoto', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                        placeholder="https://..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Secondary Photo URL
                      </label>
                      <input
                        type="text"
                        value={secondaryPhoto}
                        onChange={(e) => handleFieldChange('secondaryPhoto', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>

                {/* Display Settings Section */}
                <div className="space-y-4">
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-full">
                    <svg className="w-4 h-4 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="text-sm font-bold text-amber-900 uppercase tracking-wide">Display Settings</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={displayThisPost}
                        onChange={(e) => handleFieldChange('displayThisPost', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-semibold text-gray-700">Display This Post</span>
                        <p className="text-xs text-gray-500">Show post publicly</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={isDisplayedFirstPage}
                        onChange={(e) => handleFieldChange('isDisplayedFirstPage', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-semibold text-gray-700">Show on First Page</span>
                        <p className="text-xs text-gray-500">Feature on homepage</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={displayAsBlogPost}
                        onChange={(e) => handleFieldChange('displayAsBlogPost', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-semibold text-gray-700">Display as Blog Post</span>
                        <p className="text-xs text-gray-500">Show in blog section</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={isHelpCenter}
                        onChange={(e) => handleFieldChange('isHelpCenter', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-semibold text-gray-700">Help Center Article</span>
                        <p className="text-xs text-gray-500">Show in help center</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={isCompanyAuthor}
                        onChange={(e) => handleFieldChange('isCompanyAuthor', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-semibold text-gray-700">Company Author</span>
                        <p className="text-xs text-gray-500">Attribute to company</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Metadata Section */}
                <div className="space-y-4">
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-300 rounded-full">
                    <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">Metadata</span>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Created On
                    </label>
                    <input
                      type="datetime-local"
                      value={createdOn ? new Date(createdOn).toISOString().slice(0, 16) : ''}
                      onChange={(e) => handleFieldChange('createdOn', new Date(e.target.value).toISOString())}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    />
                    <p className="text-xs text-gray-500 mt-1">Post creation date and time</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-200 bg-white flex items-center shadow-sm">
            <div className="text-sm text-gray-600 font-medium">
              {isDirty && (
                <span className="inline-flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Auto-saving...
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Resize handle - only show when not fullscreen */}
        {!isFullScreen && (
          <div
            className="absolute bottom-0 right-0 w-5 h-5 cursor-nw-resize bg-gray-400 hover:bg-blue-500 transition-all duration-200 opacity-50 hover:opacity-100"
            style={{
              clipPath: 'polygon(100% 0, 100% 100%, 0 100%)'
            }}
            onMouseDown={handleResizeStart}
          />
        )}
      </div>
    </div>
  );
}