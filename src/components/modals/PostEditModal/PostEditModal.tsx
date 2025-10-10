// components/PostEditModal/PostEditModal.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePostEditModal } from './context';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import PostEditor from '@/components/PostPage/PostEditor';
import { useRouter } from 'next/navigation';
import { BaseModal } from '@/components/modals/_shared';

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

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && editingPost) {
        const post = editingPost as any;
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
        // Clear all fields for create mode
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
      // Clear all fields when modal closes
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
        if (slug.trim()) {
          postData.slug = slug.trim();
        } else {
          postData.slug = generateSlug(title);
        }
        url = '/api/posts';
        method = 'POST';
      } else {
        if (slug.trim()) postData.slug = slug.trim();
        url = `/api/posts/${editingPost?.id}`;
        method = 'PUT';
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
      
      if (updatePost) {
        updatePost(savedPost);
      }
      
      closeModal();
      
      if (returnUrl) {
        router.push(returnUrl);
      } else if (mode === 'create') {
        router.push(`/${savedPost.slug}`);
      } else {
        router.refresh();
      }
    } catch (error: any) {
      console.error('Error saving post:', error);
      alert(error.message || 'Failed to save post. Please try again.');
    } finally {
      setIsSaving(false);
    }
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
        {mode === 'edit' ? 'Edit Post' : 'Create Post'}
      </span>
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${
        mode === 'edit' 
          ? 'bg-amber-100 text-amber-700 border-amber-200'
          : 'bg-sky-100 text-sky-700 border-sky-200'
      }`}>
        {mode === 'edit' ? 'Edit' : 'New'}
      </span>
      {isDirty && (
        <span className="inline-flex items-center text-xs text-gray-500">
          <svg className="animate-spin h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Auto-saving...
        </span>
      )}
    </div>
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
      noPadding={true}
      showFooter={false}
    >
      <div className="flex flex-col h-full">
        {/* Info Banner - Sky themed */}
        {!showAdvancedFields && (
          <div className="px-6 pt-5 pb-4 border-b border-gray-100">
            <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-3.5">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5 flex-1">
                  <p className="text-sm font-semibold text-sky-900">Rich Text Editor</p>
                  <p className="text-xs text-sky-800 leading-relaxed">
                    Use the editor below to format your content. Changes are auto-saved every 2 minutes.
                  </p>
                </div>
                <button
                  onClick={() => setShowAdvancedFields(true)}
                  className="ml-4 px-3 py-1.5 text-xs font-medium text-sky-700 bg-white border border-sky-200 rounded-lg hover:bg-sky-50 transition-colors"
                >
                  Advanced
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          {/* Title and Description Section */}
          <div className="p-6 pb-4 bg-white space-y-4 border-b border-gray-100">
            {/* Subsection */}
            {!isLandingPage && (
              <div>
                <input
                  type="text"
                  value={subsection}
                  onChange={(e) => handleFieldChange('subsection', e.target.value)}
                  className="px-0 py-1 border-0 focus:outline-none focus:ring-0 font-medium text-xs text-sky-500 tracking-widest placeholder:text-sky-300 bg-transparent uppercase"
                  placeholder="SUBSECTION"
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

          {/* Editor or Advanced Fields */}
          {!showAdvancedFields ? (
            <PostEditor
              key={`${mode}-${editingPost?.id || 'new'}-${isOpen}`}
              initialContent={content}
              onContentChange={handleContentChange}
              onSave={handleSave}
            />
          ) : (
            <div className="px-6 py-6 bg-white space-y-6">
              {/* Back button */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Advanced Settings</h3>
                <button
                  onClick={() => setShowAdvancedFields(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ← Back to Editor
                </button>
              </div>

              {/* SEO & Identity Section */}
              <div className="space-y-4">
                <div className="inline-flex items-center px-3 py-1.5 bg-sky-50 border border-sky-200 rounded-lg">
                  <span className="text-sm font-semibold text-sky-900 uppercase tracking-wide">SEO & Identity</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                      Slug {mode === 'create' && <span className="text-xs font-normal text-sky-600">(auto-generated)</span>}
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
                               focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500
                               transition-all duration-150 text-gray-900 placeholder-gray-400 font-mono text-sm"
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
                               focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500
                               transition-all duration-150 text-gray-900 placeholder-gray-400"
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
                             focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500
                             transition-all duration-150 text-gray-900 placeholder-gray-400 resize-none"
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
                               focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500
                               transition-all duration-150 text-gray-900 placeholder-gray-400"
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
                               focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500
                               transition-all duration-150 text-gray-900 placeholder-gray-400"
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
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                      Main Photo URL
                      <Tooltip content="Primary image for the post">
                        <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                      </Tooltip>
                    </label>
                    <input
                      type="url"
                      value={mainPhoto}
                      onChange={(e) => handleFieldChange('mainPhoto', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-white
                               focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500
                               transition-all duration-150 text-gray-900 placeholder-gray-400 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                      Secondary Photo URL
                      <Tooltip content="Secondary or thumbnail image">
                        <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                      </Tooltip>
                    </label>
                    <input
                      type="url"
                      value={secondaryPhoto}
                      onChange={(e) => handleFieldChange('secondaryPhoto', e.target.value)}
                      placeholder="https://example.com/thumbnail.jpg"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-white
                               focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500
                               transition-all duration-150 text-gray-900 placeholder-gray-400 text-sm"
                    />
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
                      className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
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
                      className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
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
                      className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
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
                      className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
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
                      className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
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
                             focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500
                             transition-all duration-150 text-gray-900 placeholder-gray-400"
                  />
                </div>
              )}

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
                             focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500
                             transition-all duration-150 text-gray-900"
                  />
                </div>
              </div>

              {/* Save button in advanced fields */}
              <div className="pt-4 border-t border-gray-200 flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !title.trim()}
                  className="flex-1 px-4 py-2.5 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? 'Saving...' : mode === 'edit' ? 'Update Post' : 'Create Post'}
                </button>
                <button
                  onClick={() => setShowAdvancedFields(false)}
                  className="px-4 py-2.5 bg-white text-gray-700 font-medium border border-gray-300 rounded-lg 
                           hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer - only show when not in advanced fields */}
        {!showAdvancedFields && (
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
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg 
                         hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !title.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : mode === 'edit' ? 'Update' : 'Publish'}
              </button>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
