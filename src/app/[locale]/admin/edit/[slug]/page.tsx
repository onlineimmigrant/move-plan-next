'use client';

import React, { useState, useEffect, useCallback } from 'react';
import PostEditor from '@/components/PostPage/PostEditor';
import { useRouter } from 'next/navigation';
import Button from '@/ui/Button';
import { ArrowLeftIcon, DocumentCheckIcon, ClockIcon } from '@heroicons/react/24/outline';


const EditPostPage: React.FC<{ params: Promise<{ slug: string }> }> = ({ params }) => {
  const router = useRouter();
  const { slug } = React.use(params);
  const [title, setTitle] = useState('');
  const [slugState, setSlugState] = useState(slug);
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!hasUnsavedChanges) return;
    
    setAutoSaving(true);
    try {
      const response = await fetch(`/api/posts/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug: slugState,
          description,
          content,
        }),
      });

      if (response.ok) {
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        setError(null);
      }
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      setAutoSaving(false);
    }
  }, [title, slugState, description, content, hasUnsavedChanges, slug]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    
    const timer = setTimeout(autoSave, 30000);
    return () => clearTimeout(timer);
  }, [autoSave, hasUnsavedChanges]);

  // Track changes
  useEffect(() => {
    if (loading) return;
    setHasUnsavedChanges(true);
  }, [title, slugState, description, content, loading]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/posts/${slug}`);
        if (response.ok) {
          const post = await response.json();
          setTitle(post.title);
          setSlugState(post.slug);
          setDescription(post.description || '');
          setContent(post.content);
          setHasUnsavedChanges(false);
        } else {
          setError('Failed to fetch post');
        }
      } catch (err) {
        setError('An error occurred while fetching the post');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  const handleSave = async (newContent?: string) => {
    setSaving(true);
    setError(null);
    
    const postData = {
      title,
      slug: slugState,
      description,
      content: newContent || content,
    };

    try {
      const response = await fetch(`/api/posts/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        setSuccess('Post saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update post');
      }
    } catch (error) {
      setError('An error occurred while updating the post');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    await handleSave();
    if (!error) {
      router.push(`/${slugState}`);
    }
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !title) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Post</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
                <h1 className="text-xl font-semibold text-gray-900">Edit Post</h1>
                <div className="flex items-center text-sm text-gray-500">
                  {autoSaving && (
                    <>
                      <ClockIcon className="w-4 h-4 mr-1" />
                      <span>Auto-saving...</span>
                    </>
                  )}
                  {lastSaved && !autoSaving && (
                    <>
                      <DocumentCheckIcon className="w-4 h-4 mr-1" />
                      <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
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
                onClick={() => handleSave()}
                disabled={saving || !hasUnsavedChanges}
                variant="outline"
                size="sm"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button
                onClick={handlePublish}
                disabled={saving}
                size="sm"
              >
                {saving ? 'Publishing...' : 'Save & View'}
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
                  <span className="text-gray-500 text-sm mr-2">/{slugState && slugState}</span>
                  <input
                    id="slug"
                    type="text"
                    value={slugState}
                    onChange={(e) => setSlugState(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    placeholder="post-url-slug"
                    className="flex-1 text-sm border-0 bg-transparent p-0 focus:ring-0 placeholder-gray-400"
                    style={{ outline: 'none', boxShadow: 'none' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Post Editor */}
          <div className="p-0">
            <PostEditor 
              onSave={handleSave} 
              initialContent={content} 
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

export default EditPostPage;