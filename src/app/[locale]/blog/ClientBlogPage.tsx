'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { getPostUrl } from '@/lib/postUtils';
import { getOrganizationId } from '@/lib/supabase';
import { useProductTranslations } from '@/components/product/useProductTranslations';
import { useSettings } from '@/context/SettingsContext';
import Loading from '@/ui/Loading';
import Button from '@/ui/Button';

interface BlogPost {
  id: number;
  slug: string;
  title: string | null;
  description: string | null;
  display_this_post?: boolean;
  display_as_blog_post?: boolean;
  is_displayed_first_page?: boolean;
  main_photo?: string | null;
  subsection?: string | null;
  order?: number | null;
  section_id?: string | null;
  organization_id?: string;
  media_config?: {
    main_photo?: string | null;
    unsplash_attribution?: {
      photographer: string;
      photographer_url: string;
      photo_url: string;
      download_location: string;
    };
  };
  attrs?: {
    unsplash_attribution?: {
      photographer: string;
      photographer_url: string;
      photo_url: string;
      download_location: string;
    };
    [key: string]: any;
  };
}

interface ClientBlogPageProps {
  organizationType: string;
}

const POSTS_PER_PAGE = 8;

const ClientBlogPage: React.FC<ClientBlogPageProps> = ({ organizationType }) => {
  const { t } = useProductTranslations();
  const { settings } = useSettings();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Read search parameter from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const searchParam = urlParams.get('search');
      if (searchParam) {
        setSearchQuery(searchParam);
      }
    }
  }, []);

  // Function to get page title based on organization type
  const getPageTitle = (orgType: string): string => {
    switch (orgType) {
      case 'immigration':
        return (t as any).immigrationNewsUpdates || 'Immigration News & Updates';
      case 'solicitor':
        return (t as any).legalNewsInsights || 'Legal News & Insights';
      case 'finance':
        return (t as any).financialNewsAnalysis || 'Financial News & Analysis';
      case 'education':
        return (t as any).educationalArticlesResources || 'Educational Articles & Resources';
      case 'job':
        return (t as any).careerNewsOpportunities || 'Career News & Opportunities';
      case 'beauty':
        return (t as any).beautyTipsTrends || 'Beauty Tips & Trends';
      case 'doctor':
        return (t as any).medicalNewsHealthTips || 'Medical News & Health Tips';
      case 'services':
        return (t as any).serviceUpdatesNews || 'Service Updates & News';
      case 'realestate':
        return (t as any).realEstateNewsMarketUpdates || 'Real Estate News & Market Updates';
      case 'general':
        return (t as any).latestNewsArticles || 'Latest News & Articles';
      default:
        return (t as any).blogPosts || 'Blog Posts'; // Fallback to translated blog posts title
    }
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Fetch organization_id
        const organizationId = await getOrganizationId(baseUrl);
        if (!organizationId) {
          throw new Error('Organization not found');
        }

        const response = await fetch(
          `/api/posts?organization_id=${organizationId}&limit=${POSTS_PER_PAGE}&offset=0`
        );
        if (response.ok) {
          const data = await response.json();
          // Validate that data contains posts array
          if (!data.posts || !Array.isArray(data.posts)) {
            console.error('Expected posts array, got:', data);
            setError('Invalid data format');
            return;
          }
          console.log('📊 Blog posts loaded:', data.posts.length, 'Sample post:', data.posts[0]);
          setPosts(data.posts);
          setHasMore(data.hasMore || false);
          setTotal(data.total || 0);
        } else {
          // Handle empty response body
          let errorMessage = 'Failed to fetch posts';
          try {
            const text = await response.text();
            if (text) {
              const errorData = JSON.parse(text);
              errorMessage = errorData.error || errorMessage;
              console.error('Failed to fetch posts:', response.status, response.statusText, errorData);
            } else {
              console.error('Failed to fetch posts: Empty response body', response.status, response.statusText);
            }
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
          }
          setError(errorMessage);
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

  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const organizationId = await getOrganizationId(baseUrl);
      if (!organizationId) {
        throw new Error('Organization not found');
      }

      const response = await fetch(
        `/api/posts?organization_id=${organizationId}&limit=${POSTS_PER_PAGE}&offset=${posts.length}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.posts && Array.isArray(data.posts)) {
          setPosts((prevPosts) => [...prevPosts, ...data.posts]);
          setHasMore(data.hasMore || false);
          setTotal(data.total || 0);
        }
      } else {
        console.error('Failed to load more posts');
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  };

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
          <div className="relative group">
            <h1 className="text-center text-xl font-bold text-gray-900 tracking-wide mb-6 sm:mb-0">
              {getPageTitle(organizationType)}
              <span className="absolute bottom-4 sm:-bottom-2 left-1/2 sm:left-1/3 -translate-x-1/2 w-16 h-1 bg-sky-600 rounded-full" />
            </h1>
          </div>
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
            {filteredPosts.map((post) => {
              // Determine which image to use: main_photo or organization logo
              const imageUrl = post.main_photo && post.main_photo.trim() !== '' ? post.main_photo : settings?.image;
              // Check if the image is SVG format
              const isSvg = imageUrl?.toLowerCase().endsWith('.svg');
              
              // Check for Unsplash attribution in either location
              const unsplashAttr = post.media_config?.unsplash_attribution || post.attrs?.unsplash_attribution;
              
              console.log('🔍 Post debug:', {
                title: post.title,
                has_media_config: !!post.media_config,
                media_config: post.media_config,
                has_attrs: !!post.attrs,
                attrs: post.attrs,
                unsplashAttr: unsplashAttr
              });
              
              if (unsplashAttr) {
                console.log('✅ Post HAS Unsplash attribution:', post.title, unsplashAttr);
              } else {
                console.log('❌ Post MISSING Unsplash attribution:', post.title);
              }
              
              return (
              <Link key={post.id} href={getPostUrl(post)} className="group">
                <div className="h-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
                  {imageUrl ? (
                    <div className="relative w-full h-48 flex-shrink-0 bg-gray-100 overflow-hidden flex items-center justify-center group/img">
                      <img
                        src={imageUrl}
                        alt={post.title ?? 'Blog post image'}
                        className={isSvg ? 'max-w-[60%] max-h-[60%] object-contain' : 'w-full h-full object-cover'}
                        onError={(e) => {
                          // Silently handle image load failure with fallback UI
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.classList.add('bg-gradient-to-br', 'from-sky-50', 'to-blue-100');
                            const fallbackIcon = document.createElement('div');
                            fallbackIcon.className = 'absolute inset-0 flex items-center justify-center text-6xl';
                            fallbackIcon.textContent = '📄';
                            parent.appendChild(fallbackIcon);
                          }
                        }}
                      />
                      
                      {/* Unsplash Attribution - Two-tier design */}
                      {(post.media_config?.unsplash_attribution || post.attrs?.unsplash_attribution) && (
                        <>
                          {/* Always visible: Small Unsplash badge */}
                          <a
                            href="https://unsplash.com/?utm_source=codedharmony&utm_medium=referral"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute bottom-1.5 right-1.5 bg-white/70 hover:bg-white/90 backdrop-blur-sm rounded p-1 shadow-md hover:shadow-lg transition-all group-hover/img:opacity-0 z-10"
                            onClick={(e) => e.stopPropagation()}
                            title="Photo from Unsplash"
                          >
                            <svg className="w-3 h-3 text-black/80" fill="currentColor" viewBox="0 0 32 32">
                              <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"/>
                            </svg>
                          </a>
                          
                          {/* On hover: Full attribution */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent backdrop-blur-md text-white text-xs px-3 py-2.5 opacity-0 group-hover/img:opacity-100 transition-all duration-300">
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 32 32">
                                <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"/>
                              </svg>
                              <span className="text-white/90">Photo by{' '}
                                <a
                                  href={`${(post.media_config?.unsplash_attribution || post.attrs?.unsplash_attribution)?.photographer_url}?utm_source=codedharmony&utm_medium=referral`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-white font-medium hover:text-blue-300 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {(post.media_config?.unsplash_attribution || post.attrs?.unsplash_attribution)?.photographer}
                                </a>
                                {' '}on{' '}
                                <a
                                  href="https://unsplash.com/?utm_source=codedharmony&utm_medium=referral"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-white font-medium hover:text-blue-300 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Unsplash
                                </a>
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-48 flex-shrink-0 bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center">
                      <span className="text-6xl">📄</span>
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
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {!searchQuery && hasMore && filteredPosts.length > 0 && (
          <div className="flex justify-center mt-12">
            <Button
              onClick={loadMorePosts}
              disabled={loadingMore}
              variant="primary"
              size="lg"
              className="min-w-[200px]"
            >
              {loadingMore ? (
                <div className="flex items-center gap-2">
                  <Loading />
                  <span>Loading...</span>
                </div>
              ) : (
                `Load More (${posts.length} of ${total})`
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientBlogPage;
