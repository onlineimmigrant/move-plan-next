'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { getPostUrl } from '@/lib/postUtils';
import { getOrganizationId } from '@/lib/supabase';
import Loading from '@/ui/Loading';

interface BlogPost {
  id: number;
  slug: string;
  title: string | null;
  description: string | null;
  display_this_post?: boolean;
  display_as_blog_post?: boolean;
  main_photo?: string | null;
  subsection?: string | null;
  order?: number | null;
  section_id?: string | null;
  organization_id?: string; // Already included
}

const BlogListPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Fetch organization_id
        const organizationId = await getOrganizationId(baseUrl);
        if (!organizationId) {
          throw new Error('Organization not found');
        }

        const response = await fetch(`/api/posts?organization_id=${organizationId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Raw API response:', data);
          // Validate that data is an array and contains section_id
          if (!Array.isArray(data)) {
            console.error('Expected an array, got:', data);
            setError('Invalid data format');
            return;
          }
          data.forEach((post: BlogPost, index: number) => {
            console.log(`Post ${index}:`, { slug: post.slug, section_id: post.section_id, organization_id: post.organization_id });
          });
          setPosts(data);
        } else {
          const errorData = await response.json();
          console.error('Failed to fetch posts:', response.status, response.statusText, errorData);
          setError(errorData.error || 'Failed to fetch posts');
        }
      } catch (error) {
        console.error('An error occurred:', error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const filteredPosts = posts
    .filter(post => {
      const title = post.title ?? '';
      const description = post.description ?? '';
      const subsection = post.subsection ?? '';
      const query = searchQuery.toLowerCase();
      const shouldDisplay = post.display_this_post !== false;
      const isBlogPost = post.display_as_blog_post !== false;
      console.log('Post:', post, 'display_this_post:', post.display_this_post, 'Should display:', shouldDisplay);
      return (
        shouldDisplay &&
        isBlogPost &&
        (title.toLowerCase().includes(query) || description.toLowerCase().includes(query) || subsection.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      const hasPhotoA = a.main_photo && a.main_photo.trim() !== '';
      const hasPhotoB = b.main_photo && b.main_photo.trim() !== '';
      return hasPhotoB ? 1 : hasPhotoA ? -1 : 0;
    });

  if (loading) {
    return (
      <div className="py-32 text-center text-gray-500">
       <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-32 text-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12">
          <h1 className="text-2xl font-bold text-gray-700 tracking-wide mb-6 sm:mb-0">
            Blog Posts
          </h1>
          <div className="relative w-full sm:w-80 px-4 sm:px-0">
            <span className="absolute inset-y-0 left-4 sm:left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-4 text-base font-light border bg-white border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No posts available
          </div>
        ) : filteredPosts.length === 0 && searchQuery ? (
          <div className="text-center py-16 text-gray-500">
            No posts found matching "{searchQuery}"
          </div>
        ) : (
          <div className="px-4 sm:px-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredPosts.map((post) => (
              <Link key={post.id} href={getPostUrl(post)} className="group">
                <div className="h-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
                  {post.main_photo && post.main_photo.trim() !== '' && (
                    <div className="w-full h-auto p-2 flex-shrink-0">
                      <img
                        src={post.main_photo}
                        alt={post.title ?? 'Blog post image'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Image failed to load:', post.main_photo);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-grow">
                    <h2 className="tracking-tight text-lg line-clamp-1 font-semibold text-gray-900 mb-3 group-hover:text-sky-400">
                      {post.title ?? 'Untitled'}
                    </h2>
                    <p className="tracking-widest text-base text-gray-600 font-light line-clamp-2 flex-grow">
                      {post.description ?? 'No description available'}
                    </p>
                  </div>
                  <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-transparent flex-shrink-0 flex justify-end relative">
                    {post.subsection && post.subsection.trim() !== '' ? (
                      <>
                        <span className="text-gray-500 text-sm font-medium group-hover:opacity-0 transition-opacity duration-200">
                          {post.subsection}
                        </span>
                        <span className="absolute right-6 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <ArrowRightIcon className="h-5 w-5" />
                        </span>
                      </>
                    ) : (
                      <span className="text-sky-400">
                        <ArrowRightIcon className="h-5 w-5" />
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogListPage;