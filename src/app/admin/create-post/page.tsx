// src/app/admin/create-post/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import PostEditor from '@/components/PostEditor';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const CreatePostPage: React.FC = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

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

  const handleSave = async (content: string) => {
    const postData = {
      title,
      slug,
      description,
      content,
      section_id: 1,
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

      const text = await response.text(); // Get raw response text first
      console.log('Raw response text:', text);

      if (response.ok) {
        const newPost = JSON.parse(text); // Parse only if response is OK
        console.log('Post created successfully:', newPost);
        // Redirect to the newly created post's page
        router.push(`/${slug}`);
      } else {
        try {
          const errorData = JSON.parse(text);
          setError(errorData.error || 'Failed to save post');
          console.error('Error response:', errorData);
        } catch (jsonError) {
          setError('Invalid response from server');
          console.error('Failed to parse error response as JSON:', text);
        }
      }
    } catch (error) {
      setError('An error occurred while saving the post');
      console.error('Fetch error:', error);
    }
  };

  return (
    <div className="create-post-page p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Post</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Post Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title"
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
            Post Slug (auto-generated)
          </label>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Post slug will be generated from title"
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Post Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter a brief description of the post"
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
          />
        </div>
        <PostEditor onSave={handleSave} />
      </div>
    </div>
  );
};

export default CreatePostPage;