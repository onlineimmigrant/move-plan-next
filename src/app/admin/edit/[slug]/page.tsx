// src/app/admin/edit/[slug]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import PostEditor from '@/components/PostEditor';
import { useRouter } from 'next/navigation';


const EditPostPage: React.FC<{ params: Promise<{ slug: string }> }> = ({ params }) => {
  const router = useRouter();
  const { slug } = React.use(params);
  const [title, setTitle] = useState('');
  const [slugState, setSlugState] = useState(slug);
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleSave = async (newContent: string) => {
    const postData = {
      title,
      slug: slugState,
      description,
      content: newContent,
    };

    try {
      const response = await fetch(`/api/posts/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        // Redirect to the updated post's page using the current slug
        router.push(`/${slugState}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update post');
      }
    } catch (error) {
      setError('An error occurred while updating the post');
    }
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
<div>
    <h1 className="absolute top-0 right-2 text-xl font-bold mb-6 text-right">Edit Post</h1>
    <div className="edit-post-page p-4 max-w-5xl mx-auto">
      
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-400">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full text-3xl sm:text-4xl font-bold tracking-tight border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-400">
            Post Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full text-xl sm:text-2xl text-gray-700  border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
          />
        </div>
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-400">
            Post Slug
          </label>
          <input
            id="slug"
            type="text"
            value={slugState}
            onChange={(e) => setSlugState(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <PostEditor onSave={handleSave} initialContent={content} />
      </div>
    </div>
    </div>
  );
};

export default EditPostPage;