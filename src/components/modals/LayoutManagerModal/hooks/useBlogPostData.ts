import { useState, useEffect, useCallback } from 'react';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  order: number;
  subsection?: string | null;
  main_photo?: string | null;
  organization_id: string;
  created_on?: string;
  last_modified?: string;
}

export type SortOption = 'order' | 'subsection' | 'created_on' | 'last_modified';

export const useBlogPostData = (organizationId: string | null, isOpen: boolean) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('order');

  const loadPosts = useCallback(async () => {
    if (!organizationId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/blog-posts?organization_id=${organizationId}&sort_by=${sortBy}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch blog posts');
      }

      const data = await response.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error('Error loading blog posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load blog posts');
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, sortBy]);

  const savePostOrder = useCallback(async (updatedPosts: BlogPost[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const postsWithOrder = updatedPosts.map((post, index) => ({
        id: post.id,
        order: index,
      }));

      const response = await fetch('/api/blog-posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts: postsWithOrder }),
      });

      if (!response.ok) {
        throw new Error('Failed to save blog post order');
      }

      setPosts(updatedPosts);
      return true;
    } catch (err) {
      console.error('Error saving blog post order:', err);
      setError(err instanceof Error ? err.message : 'Failed to save blog post order');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadPosts();
    } else {
      // Reset state when modal closes
      setPosts([]);
      setError(null);
    }
  }, [isOpen, loadPosts]);

  return {
    posts,
    setPosts,
    isLoading,
    error,
    sortBy,
    setSortBy,
    loadPosts,
    savePostOrder,
  };
};
