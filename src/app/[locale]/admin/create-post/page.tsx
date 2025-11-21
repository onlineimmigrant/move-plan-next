'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Button from '@/ui/Button';
import { ArrowLeftIcon, DocumentCheckIcon, ClockIcon } from '@heroicons/react/24/outline';

// Lazy load PostEditor - loads @tiptap only when this admin page is accessed
const PostEditor = dynamic(() => import('@/components/PostPage/PostEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  )
});


const CreatePostPage: React.FC = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [mediaConfig, setMediaConfig] = useState<{
    main_photo?: string;
    unsplash_attribution?: {
      photographer: string;
      photographer_url: string;
      photo_url: string;
      download_location: string;
    };
  }>({});
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auto-save functionality (draft save)
  const autoSave = useCallback(async () => {
    if (!hasUnsavedChanges || !title.trim()) return;
    
    setAutoSaving(true);
    try {
      // Could implement draft saving to localStorage or a drafts API here
      localStorage.setItem('draft_post', JSON.stringify({
        title,
        slug,
        description,
        content,
        timestamp: new Date().toISOString()
      }));
      setLastSaved(new Date());
      setError(null);
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      setAutoSaving(false);
    }
  }, [title, slug, description, content, hasUnsavedChanges]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    
    const timer = setTimeout(autoSave, 30000);
    return () => clearTimeout(timer);
  }, [autoSave, hasUnsavedChanges]);

  // Generate slug from title
  useEffect(() => {
    if (title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    } else {
      setSlug('');
    }
  }, [title]);

  // Track changes
  useEffect(() => {
    setHasUnsavedChanges(title.trim() !== '' || description.trim() !== '' || content.trim() !== '');
  }, [title, description, content, mediaConfig]);

  // Load draft on component mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem('draft_post');
      if (draft) {
        const parsed = JSON.parse(draft);
        const draftAge = new Date().getTime() - new Date(parsed.timestamp).getTime();
        // Load draft if it's less than 24 hours old
        if (draftAge < 24 * 60 * 60 * 1000) {
          setTitle(parsed.title || '');
          setSlug(parsed.slug || '');
          setDescription(parsed.description || '');
          setContent(parsed.content || '');
        }
      }
    } catch (err) {
      console.error('Failed to load draft:', err);
    }
  }, []);

  const handleSave = async (newContent?: string) => {
    setSaving(true);
    setError(null);
    
    const postData = {
      title,
      slug,
      description,
      content: newContent || content,
      section_id: 1,
      media_config: mediaConfig,
    };

    console.log('Sending POST request to /api/posts with data:', postData);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const text = await response.text();
      console.log('Raw response text:', text);

      if (response.ok) {
        const newPost = JSON.parse(text);
        console.log('Post created successfully:', newPost);
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        setSuccess('Post created successfully!');
        
        // Clear draft
        localStorage.removeItem('draft_post');
        
        setTimeout(() => {
          router.push(`/${slug}`);
        }, 1500);
      } else {
        try {
          const errorData = JSON.parse(text);
          setError(errorData.error || 'Failed to create post');
          console.error('Error response:', errorData);
        } catch (jsonError) {
          setError('Invalid response from server');
          console.error('Failed to parse error response as JSON:', text);
        }
      }
    } catch (error) {
      setError('An error occurred while creating the post');
      console.error('Fetch error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDraftSave = async () => {
    await autoSave();
    setSuccess('Draft saved locally!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.back();
      }
    } else {
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
                className="mr-4"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Create New Post</h1>
                <div className="flex items-center text-sm text-gray-500">
                  {autoSaving && (
                    <>
                      <ClockIcon className="w-4 h-4 mr-1" />
                      <span>Auto-saving draft...</span>
                    </>
                  )}
                  {lastSaved && !autoSaving && (
                    <>
                      <DocumentCheckIcon className="w-4 h-4 mr-1" />
                      <span>Draft saved: {lastSaved.toLocaleTimeString()}</span>
                    </>
                  )}
                  {hasUnsavedChanges && !autoSaving && (
                    <span className="text-amber-600">• Unsaved changes</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {error && (
                <div className="bg-red-50 text-red-600 px-3 py-1 rounded-md text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 text-green-600 px-3 py-1 rounded-md text-sm">
                  {success}
                </div>
              )}
              <Button
                onClick={handleDraftSave}
                disabled={saving || !hasUnsavedChanges}
                variant="outline"
                size="sm"
              >
                {autoSaving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button
                onClick={() => handleSave()}
                disabled={saving || !title.trim()}
                size="sm"
              >
                {saving ? 'Publishing...' : 'Publish Post'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Post Meta */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Post Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter post title..."
                  className="w-full text-2xl sm:text-3xl font-bold border-0 bg-transparent p-0 focus:ring-0 placeholder-gray-400 resize-none"
                  style={{ outline: 'none', boxShadow: 'none' }}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Post Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of your post..."
                  className="w-full text-lg text-gray-700 border-0 bg-transparent p-0 focus:ring-0 placeholder-gray-400 resize-none min-h-[60px]"
                  style={{ outline: 'none', boxShadow: 'none' }}
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                  URL Slug
                </label>
                <div className="flex items-center">
                  <span className="text-gray-500 text-sm mr-2">/{slug && slug}</span>
                  <input
                    id="slug"
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    placeholder="auto-generated-from-title"
                    className="flex-1 text-sm border-0 bg-transparent p-0 focus:ring-0 placeholder-gray-400"
                    style={{ outline: 'none', boxShadow: 'none' }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Automatically generated from title, but you can edit it</p>
              </div>
            </div>
          </div>

          {/* Post Editor */}
          <div className="p-0">
            <PostEditor 
              onSave={handleSave} 
              initialContent={content}
              mediaConfig={mediaConfig}
              onMediaConfigChange={setMediaConfig}
              onContentChange={(newContent) => {
                setContent(newContent);
                setHasUnsavedChanges(true);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostPage;