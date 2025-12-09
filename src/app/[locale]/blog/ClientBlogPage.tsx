'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MagnifyingGlassIcon, ArrowRightIcon, XMarkIcon, EllipsisVerticalIcon, ShareIcon, BookmarkIcon, LinkIcon } from '@heroicons/react/24/outline';
import { getPostUrl } from '@/lib/postUtils';
import { getOrganizationId } from '@/lib/supabase';
import { useProductTranslations } from '@/components/product/useProductTranslations';
import { useSettings } from '@/context/SettingsContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import Loading from '@/ui/Loading';
import Button from '@/ui/Button';
import BlogCardSkeleton from './BlogCardSkeleton';

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
  last_modified?: string | null;
  author_name?: string | null;
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
  initialPosts?: BlogPost[];
  initialTotal?: number;
  initialHasMore?: boolean;
  organizationIdProp?: string | null;
}

const POSTS_PER_PAGE = 12;

const ClientBlogPage: React.FC<ClientBlogPageProps> = ({
  organizationType,
  initialPosts,
  initialTotal,
  initialHasMore,
  organizationIdProp,
}) => {
  // Format time ago from last_modified date
  const getTimeAgo = (lastModified: string | null | undefined): string => {
    if (!lastModified) return '';
    
    const now = new Date();
    const modified = new Date(lastModified);
    
    // Reset time to midnight for accurate day comparison
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const modifiedDate = new Date(modified.getFullYear(), modified.getMonth(), modified.getDate());
    
    const diffMs = nowDate.getTime() - modifiedDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  };

  const { t } = useProductTranslations();
  const router = useRouter();
  const { settings } = useSettings();
  const themeColors = useThemeColors();
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts || []);
  const [loading, setLoading] = useState(!initialPosts || initialPosts.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(initialHasMore || false);
  const [total, setTotal] = useState(initialTotal || (initialPosts ? initialPosts.length : 0));
  
  // Debug logging
  React.useEffect(() => {
    console.log('[ClientBlogPage] State:', {
      postsLength: posts.length,
      total,
      initialTotal,
      hasMore,
      initialHasMore
    });
  }, [posts.length, total, initialTotal, hasMore, initialHasMore]);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Highlight search terms in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() 
        ? `<mark class="bg-yellow-200 px-0.5 rounded">${part}</mark>`
        : part
    ).join('');
  };

  // Listen for search modal open event from Header
  useEffect(() => {
    const handleOpenSearch = () => setIsSearchModalOpen(true);
    window.addEventListener('openBlogSearch', handleOpenSearch);
    
    // Load recent searches from localStorage
    const saved = localStorage.getItem('blog_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches');
      }
    }
    
    return () => window.removeEventListener('openBlogSearch', handleOpenSearch);
  }, []);

  // Keyboard shortcuts and autocomplete navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Arrow navigation in autocomplete
      if (showAutocomplete && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        // Calculate suggestions inline to avoid dependency issues
        const suggestions = searchQuery 
          ? posts
              .filter(post => 
                post.title && 
                post.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
                post.display_this_post !== false &&
                post.display_as_blog_post !== false
              )
              .slice(0, 5)
              .map(post => post.title!)
          : recentSearches;
        if (suggestions.length === 0) return;
        
        if (e.key === 'ArrowDown') {
          setActiveIndex(prev => (prev + 1) % suggestions.length);
        } else {
          setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        }
        return;
      }
      // Enter to select active suggestion
      if (e.key === 'Enter' && showAutocomplete && activeIndex >= 0) {
        e.preventDefault();
        // Calculate suggestions inline to avoid dependency issues
        const suggestions = searchQuery
          ? posts
              .filter(post => 
                post.title && 
                post.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
                post.display_this_post !== false &&
                post.display_as_blog_post !== false
              )
              .slice(0, 5)
              .map(post => post.title!)
          : recentSearches;
        if (suggestions[activeIndex]) {
          setSearchQuery(suggestions[activeIndex]);
          setShowAutocomplete(false);
          setActiveIndex(-1);
        }
        return;
      }
      // Cmd+K or Ctrl+K to open search on desktop
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (window.innerWidth >= 640) {
          // Desktop: focus search input
          const searchInput = document.querySelector('input[placeholder="Search posts..."]') as HTMLInputElement;
          if (searchInput) searchInput.focus();
        } else {
          // Mobile: open modal
          setIsSearchModalOpen(true);
        }
      }
      // / key to focus search (when not typing in an input)
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        if (window.innerWidth >= 640) {
          const searchInput = document.querySelector('input[placeholder="Search posts..."]') as HTMLInputElement;
          if (searchInput) searchInput.focus();
        } else {
          setIsSearchModalOpen(true);
        }
      }
      // ESC to close autocomplete or clear search
      if (e.key === 'Escape') {
        if (showAutocomplete) {
          setShowAutocomplete(false);
          setActiveIndex(-1);
        } else if (searchQuery) {
          setSearchQuery('');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, showAutocomplete, activeIndex, recentSearches, posts]);

  // Toggle sticky bar layering based on scroll position
  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Handle search bar toggle
  const closeSearchModal = () => {
    setIsSearchModalOpen(false);
  };

  // Close mobile search when clicking outside
  useEffect(() => {
    if (!isSearchModalOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const searchBar = document.querySelector('[data-mobile-search-bar]');
      const searchIcon = document.querySelector('[data-blog-search-trigger]');
      
      if (searchBar && !searchBar.contains(e.target as Node) && 
          searchIcon && !searchIcon.contains(e.target as Node)) {
        setIsSearchModalOpen(false);
      }
    };
    
    // Small delay to avoid immediate closure from the opening click
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);
    
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isSearchModalOpen]);

  // Close card menu on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openMenuId !== null) {
        setOpenMenuId(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [openMenuId]);

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

  // Initial fetch only if no server-provided posts
  useEffect(() => {
    if (initialPosts && initialPosts.length > 0) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetchPosts = async () => {
      try {
        const organizationId = organizationIdProp || await getOrganizationId(baseUrl);
        if (!organizationId) throw new Error('Organization not found');
        const response = await fetch(`/api/posts?organization_id=${organizationId}&limit=${POSTS_PER_PAGE}&offset=0`);
        if (response.ok) {
          const data = await response.json();
          if (!cancelled) {
            if (!data.posts || !Array.isArray(data.posts)) {
              console.error('Expected posts array, got:', data);
              setError('Invalid data format');
              return;
            }
            setPosts(data.posts);
            setHasMore(data.hasMore || false);
            setTotal(data.total || 0);
          }
        } else {
          let errorMessage = 'Failed to fetch posts';
          try {
            const text = await response.text();
            if (text) {
              const parsed = JSON.parse(text);
              errorMessage = parsed?.message || errorMessage;
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
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPosts();
    return () => { cancelled = true; };
  }, [initialPosts, organizationIdProp, baseUrl]);

  // Debounce search query
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(searchQuery), 180);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const organizationId = organizationIdProp || await getOrganizationId(baseUrl);
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
      const query = debouncedQuery.toLowerCase();
      // Note: Posts are already filtered server-side, so we don't need to check display flags again
      // unless they came from an old API response. For safety, keep the checks but they should all pass.
      return (
        (title.toLowerCase().includes(query) || description.toLowerCase().includes(query) || subsection.toLowerCase().includes(query))
      );
    });

  // Group posts by category (subsection)
  const categorizedPosts = React.useMemo(() => {
    const categories = new Map<string, typeof filteredPosts>();
    const seenIds = new Set<number>();
    
    filteredPosts.forEach(post => {
      // Skip duplicate posts
      if (seenIds.has(post.id)) {
        return;
      }
      seenIds.add(post.id);
      
      const category = post.subsection || 'Other';
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(post);
    });

    // Sort posts within each category by last_modified (newest first)
    categories.forEach((posts, category) => {
      posts.sort((a, b) => {
        const dateA = new Date(a.last_modified || 0).getTime();
        const dateB = new Date(b.last_modified || 0).getTime();
        return dateB - dateA;
      });
    });

    // Sort categories by latest post's last_modified, then alphabetically
    const sortedCategories = Array.from(categories.entries()).sort(([catA, postsA], [catB, postsB]) => {
      const latestA = new Date(postsA[0]?.last_modified || 0).getTime();
      const latestB = new Date(postsB[0]?.last_modified || 0).getTime();
      
      if (latestA !== latestB) {
        return latestB - latestA; // Newest category first
      }
      return catA.localeCompare(catB); // Alphabetical if same date
    });

    return new Map(sortedCategories);
  }, [filteredPosts]);

  // Calculate initial display: first 12 posts distributed across categories (4 per category)
  const initialDisplayCount = 12;
  const getInitialPostsPerCategory = React.useMemo(() => {
    const result = new Map<string, number>();
    let totalCount = 0;
    
    for (const [category, categoryPosts] of categorizedPosts.entries()) {
      if (totalCount >= initialDisplayCount) {
        result.set(category, 0);
      } else {
        const postsToShow = Math.min(4, categoryPosts.length, initialDisplayCount - totalCount);
        result.set(category, postsToShow);
        totalCount += postsToShow;
      }
    }
    
    return result;
  }, [categorizedPosts]);

  // Calculate how many posts are currently visible across all categories
  const visiblePostsCount = React.useMemo(() => {
    let count = 0;
    categorizedPosts.forEach((categoryPosts, category) => {
      const isExpanded = expandedCategories.has(category);
      const initialCount = getInitialPostsPerCategory.get(category) || 0;
      count += isExpanded ? categoryPosts.length : initialCount;
    });
    return count;
  }, [categorizedPosts, expandedCategories, getInitialPostsPerCategory]);

  // Check if we need to load more posts
  // Load more when: visible posts are close to total loaded posts AND there are more posts on server
  const shouldShowLoadMore = !searchQuery && hasMore && visiblePostsCount >= posts.length - 4;

  // Autocomplete suggestions (top 5 matching titles)
  const autocompleteSuggestions = searchQuery.trim() && showAutocomplete
    ? posts
        .filter(post => 
          post.title && 
          post.title.toLowerCase().includes(searchQuery.toLowerCase())
          // Posts are already filtered server-side
        )
        .slice(0, 5)
        .map(post => post.title!)
    : [];

  if (loading) {
    return (
      <div className="pt-8 sm:pt-6 pb-16">
        {/* Sticky header placeholder */}
        <div className="h-16 mb-6" />
        
        {/* Skeleton cards grid */}
        <div className="grid gap-8 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <BlogCardSkeleton key={i} />
          ))}
        </div>
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
      {/* Spacer to keep global header above at page start */}
      <div className="hidden sm:block h-16" />
      {/* Sticky header on desktop - full width bar with centered content matching cards container width */}
      <div className={`sticky top-0 ${isScrolled ? 'z-50' : 'z-30'} hidden sm:block w-full bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 py-3`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="relative group">
              <h1 className="text-xl font-extrabold text-gray-900 tracking-wide mb-1">NEWS</h1>
              <p className="text-sm font-bold bg-gradient-to-r from-gray-600 via-gray-400 to-gray-500 bg-clip-text text-transparent">
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }).toUpperCase()}
              </p>
            </div>
            <div className="relative max-w-sm flex-1">
              {/* Search Icon */}
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <MagnifyingGlassIcon className={`h-5 w-5 transition-all duration-200 ${
                  searchQuery ? 'text-gray-600 scale-110' : 'text-gray-400'
                }`} />
              </span>
              
              {/* Search Input */}
              <input
                type="text"
                role="search"
                aria-label="Search blog posts"
                aria-controls="search-autocomplete"
                aria-expanded={showAutocomplete}
                aria-activedescendant={activeIndex >= 0 ? `search-suggestion-${activeIndex}` : undefined}
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowAutocomplete(true);
                  setActiveIndex(-1);
                }}
                onFocus={(e) => {
                  setShowAutocomplete(true);
                  setActiveIndex(-1);
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${themeColors.cssVars.primary.base}20`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = '';
                  setTimeout(() => {
                    setShowAutocomplete(false);
                    setActiveIndex(-1);
                  }, 200);
                }}
                className="w-full pl-12 pr-24 py-3.5 text-base border bg-white border-gray-100 rounded-xl focus:outline-none focus:border-transparent transition-all duration-200"
                style={{
                  '--tw-ring-color': themeColors.cssVars.primary.base,
                } as React.CSSProperties}
              />
              
              {/* Right Side Icons */}
              <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-4">
                {/* Loading Spinner */}
                {isSearching && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600" />
                )}
                
                {/* Clear Button */}
                {searchQuery && !isSearching && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Clear search"
                  >
                    <XMarkIcon className="h-4 w-4 text-gray-500" />
                  </button>
                )}
                
                {/* Keyboard Shortcut Hint */}
                <span className="hidden xl:flex items-center gap-0.5 px-2.5 py-1 text-xs text-gray-500 font-medium bg-gray-100 rounded-md">
                  <kbd>⌘</kbd><kbd>K</kbd>
                </span>
              </div>
              
              {/* Autocomplete Dropdown */}
              {showAutocomplete && (autocompleteSuggestions.length > 0 || recentSearches.length > 0) && (
                <div 
                  id="search-autocomplete"
                  role="listbox"
                  className="absolute top-full left-0 right-0 mt-3 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto"
                >
                  {/* Recent Searches */}
                  {!searchQuery && recentSearches.length > 0 && (
                    <div className="p-2">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 py-2">Recent</div>
                      {recentSearches.map((search, idx) => (
                        <button
                          key={idx}
                          id={`search-suggestion-${idx}`}
                          role="option"
                          aria-selected={activeIndex === idx}
                          onClick={() => {
                            setSearchQuery(search);
                            setShowAutocomplete(false);
                            setActiveIndex(-1);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 flex items-center gap-2 transition-colors ${
                            activeIndex === idx ? 'bg-gray-100' : 'hover:bg-gray-50'
                          }`}
                          style={activeIndex === idx ? { backgroundColor: `${themeColors.cssVars.primary.base}15` } : {}}
                        >
                          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                          {search}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Autocomplete Suggestions */}
                  {searchQuery && autocompleteSuggestions.length > 0 && (
                    <div className="p-2">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 py-2">Suggestions</div>
                      {autocompleteSuggestions.map((title, idx) => (
                        <button
                          key={idx}
                          id={`search-suggestion-${idx}`}
                          role="option"
                          aria-selected={activeIndex === idx}
                          onClick={() => {
                            setSearchQuery(title);
                            setShowAutocomplete(false);
                            setActiveIndex(-1);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 transition-colors ${
                            activeIndex === idx ? 'bg-gray-100' : 'hover:bg-gray-50'
                          }`}
                          style={activeIndex === idx ? { backgroundColor: `${themeColors.cssVars.primary.base}15` } : {}}
                        >
                          {title}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Search Tips */}
                  {!searchQuery && recentSearches.length === 0 && (
                    <div className="p-4 text-center text-sm text-gray-500">
                      <p className="font-medium mb-1">Search tips:</p>
                      <p className="text-xs">Try searching by title, description, or category</p>
                      <p className="text-xs mt-2 text-gray-400">Use ↑↓ arrows to navigate</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile search bar - slides down when opened */}
      <div 
        data-mobile-search-bar
        className="sm:hidden fixed left-0 right-0 z-40 bg-white transition-all duration-300" 
        style={{ 
          top: isSearchModalOpen ? '64px' : '-100%',
          opacity: isSearchModalOpen ? 1 : 0
        }}
      >
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <MagnifyingGlassIcon className={`h-5 w-5 transition-all duration-200 ${
                searchQuery ? 'text-gray-600 scale-110' : 'text-gray-400'
              }`} />
            </span>
            <input
              type="text"
              role="search"
              aria-label="Search blog posts"
              aria-controls="mobile-search-autocomplete"
              aria-expanded={showAutocomplete}
              aria-activedescendant={activeIndex >= 0 ? `mobile-suggestion-${activeIndex}` : undefined}
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowAutocomplete(true);
                setActiveIndex(-1);
              }}
              onFocus={(e) => {
                setShowAutocomplete(true);
                setActiveIndex(-1);
                e.currentTarget.style.boxShadow = `0 0 0 3px ${themeColors.cssVars.primary.base}20`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = '';
                setTimeout(() => {
                  setShowAutocomplete(false);
                  setActiveIndex(-1);
                }, 200);
              }}
              autoFocus={isSearchModalOpen}
              className="w-full pl-12 pr-20 py-3.5 text-base border bg-white border-gray-100 rounded-xl focus:outline-none focus:border-transparent transition-all duration-200"
              style={{
                '--tw-ring-color': themeColors.cssVars.primary.base,
              } as React.CSSProperties}
            />
            
            {/* Right Side Icons */}
            <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-4">
              {/* Loading Spinner */}
              {isSearching && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600" />
              )}
              
              {/* Clear Button */}
              {searchQuery && !isSearching && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Clear search"
                >
                  <XMarkIcon className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>
          
          {/* Mobile Autocomplete Dropdown */}
          {showAutocomplete && isSearchModalOpen && (autocompleteSuggestions.length > 0 || recentSearches.length > 0) && (
            <div 
              id="mobile-search-autocomplete"
              role="listbox"
              className="mt-3 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-80 overflow-y-auto"
            >
              {/* Recent Searches */}
              {!searchQuery && recentSearches.length > 0 && (
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 py-2">Recent</div>
                  {recentSearches.map((search, idx) => (
                    <button
                      key={idx}
                      id={`mobile-suggestion-${idx}`}
                      role="option"
                      aria-selected={activeIndex === idx}
                      onClick={() => {
                        setSearchQuery(search);
                        setShowAutocomplete(false);
                        setActiveIndex(-1);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 flex items-center gap-2 transition-colors ${
                        activeIndex === idx ? '' : 'hover:bg-gray-50'
                      }`}
                      style={activeIndex === idx ? { backgroundColor: `${themeColors.cssVars.primary.base}15` } : {}}
                    >
                      <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                      {search}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Autocomplete Suggestions */}
              {searchQuery && autocompleteSuggestions.length > 0 && (
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 py-2">Suggestions</div>
                  {autocompleteSuggestions.map((title, idx) => (
                    <button
                      key={idx}
                      id={`mobile-suggestion-${idx}`}
                      role="option"
                      aria-selected={activeIndex === idx}
                      onClick={() => {
                        setSearchQuery(title);
                        setShowAutocomplete(false);
                        setActiveIndex(-1);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 transition-colors ${
                        activeIndex === idx ? '' : 'hover:bg-gray-50'
                      }`}
                      style={activeIndex === idx ? { backgroundColor: `${themeColors.cssVars.primary.base}15` } : {}}
                    >
                      {title}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Search Tips */}
              {!searchQuery && recentSearches.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500">
                  <p className="font-medium mb-1">Search tips:</p>
                  <p className="text-xs">Try searching by title, description, or category</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-8 sm:pt-6 pb-16">
        {/* Mobile header (non-sticky) */}
        <div className="flex sm:hidden items-center justify-between mb-6">
          <div className="relative group">
            <h1 className="text-xl font-extrabold text-gray-900 tracking-wide mb-1">NEWS</h1>
            <p className="text-sm font-bold bg-gradient-to-r from-gray-600 via-gray-400 to-gray-500 bg-clip-text text-transparent">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Result Count */}
        {debouncedQuery && filteredPosts.length > 0 && (
          <div className="mb-4 text-sm text-gray-600" role="status" aria-live="polite">
            Found {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
          </div>
        )}

        {posts.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No posts available
          </div>
        ) : filteredPosts.length === 0 && searchQuery ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-500 mb-4">No results for "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium transition-colors"
              style={{ color: themeColors.cssVars.primary.base }}
              onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.hover}
              onMouseLeave={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.base}
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {Array.from(categorizedPosts.entries()).map(([category, categoryPosts]) => {
              const isExpanded = expandedCategories.has(category);
              const initialCount = getInitialPostsPerCategory.get(category) || 0;
              const displayedPosts = isExpanded ? categoryPosts : categoryPosts.slice(0, initialCount);
              const hasMore = categoryPosts.length > initialCount;
              
              // Skip categories that have 0 initial posts (beyond the first 12)
              if (!isExpanded && initialCount === 0) {
                return null;
              }
              
              return (
                <div key={category} className="space-y-6">
                  {/* Category Header */}
                  <h2 
                    className="text-lg font-semibold uppercase tracking-wide"
                    style={{ color: themeColors.cssVars.primary.base }}
                  >
                    {category}
                  </h2>
                  
                  {/* Posts Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayedPosts.map((post) => {
              // Determine which image to use: main_photo or organization logo
              const imageUrl = post.main_photo && post.main_photo.trim() !== '' ? post.main_photo : settings?.image;
              // Check if the image is SVG format
              const isSvg = imageUrl?.toLowerCase().endsWith('.svg');
              
              // Check for Unsplash attribution in either location
              const unsplashAttr = post.media_config?.unsplash_attribution || post.attrs?.unsplash_attribution;
              
              // console.log('🔍 Post debug:', {
              //   title: post.title,
              //   has_media_config: !!post.media_config,
              //   media_config: post.media_config,
              //   has_attrs: !!post.attrs,
              //   attrs: post.attrs,
              //   unsplashAttr: unsplashAttr
              // });
              // 
              // if (unsplashAttr) {
              //   console.log('✅ Post HAS Unsplash attribution:', post.title, unsplashAttr);
              // } else {
              //   console.log('❌ Post MISSING Unsplash attribution:', post.title);
              // }
              
              return (
              <div key={`${category}-${post.id}`} className="group relative">
                <Link href={getPostUrl(post)} prefetch={false} className="block"
                  onMouseEnter={() => router.prefetch(getPostUrl(post))}>
                  <div className="h-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    {imageUrl ? (
                      <div className="relative w-full aspect-square flex-shrink-0 bg-gray-100 overflow-hidden flex items-center justify-center group/img">
                        <Image
                          src={imageUrl}
                          alt={post.title ?? 'Blog post image'}
                          fill
                          priority={posts.indexOf(post) < 2}
                          className={isSvg ? 'object-contain max-h-60 max-w-[60%]' : 'object-cover'}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                      </div>
                    ) : (
                    <div className="w-full aspect-square flex-shrink-0 flex items-center justify-center" style={{ background: `linear-gradient(to bottom right, ${themeColors.cssVars.primary.lighter}, ${themeColors.cssVars.primary.light})` }}>
                      <span className="text-6xl">📄</span>
                    </div>
                  )}
                  <div className="flex flex-col p-6 flex-grow">
                    <h2 
                      className="tracking-tight text-lg line-clamp-2 font-semibold text-gray-900 transition-colors"
                      dangerouslySetInnerHTML={{ __html: highlightText(post.title ?? 'Untitled', debouncedQuery) }}
                      onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.base}
                      onMouseLeave={(e) => e.currentTarget.style.color = ''}
                    />
                  </div>
                  <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-transparent flex-shrink-0 flex justify-between items-center relative">
                    {/* Time ago and author */}
                    <span className="text-xs font-medium text-gray-500 tracking-wide">
                      {getTimeAgo(post.last_modified)}
                      {post.author_name && (
                        <>
                          <span className="mx-1.5">•</span>
                          <span className="text-gray-700">{post.author_name}</span>
                        </>
                      )}
                    </span>
                    
                    {/* Three dots menu button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === post.id ? null : post.id);
                      }}
                      className="p-2 rounded-lg hover:bg-white/50 active:bg-white/70 transition-all duration-200"
                      aria-label="Post options"
                    >
                      <EllipsisVerticalIcon className="w-5 h-5 text-gray-600" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {openMenuId === post.id && (
                      <>
                        {/* Backdrop */}
                        <div 
                          className="fixed inset-0 z-40"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenMenuId(null);
                          }}
                        />
                        
                        {/* Menu */}
                        <div className="absolute bottom-full right-0 mb-2 z-50 bg-white/30 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-2xl p-2 min-w-[180px] animate-in fade-in slide-in-from-bottom-2 duration-200">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (navigator.share) {
                                navigator.share({
                                  title: post.title ?? 'Blog Post',
                                  url: getPostUrl(post),
                                }).catch(() => {});
                              } else {
                                // Fallback: copy to clipboard
                                navigator.clipboard.writeText(window.location.origin + getPostUrl(post));
                              }
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 active:bg-white/20 transition-all duration-200 rounded-xl group"
                          >
                            <ShareIcon 
                              className="w-5 h-5 text-gray-700 transition-colors"
                              onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.base}
                              onMouseLeave={(e) => e.currentTarget.style.color = ''}
                            />
                            <span 
                              className="text-sm font-semibold text-gray-900 transition-colors"
                              onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.base}
                              onMouseLeave={(e) => e.currentTarget.style.color = ''}
                            >Share Story</span>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // TODO: Implement save functionality
                              console.log('Save story:', post.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 active:bg-white/20 transition-all duration-200 rounded-xl group"
                          >
                            <BookmarkIcon 
                              className="w-5 h-5 text-gray-700 transition-colors"
                              onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.base}
                              onMouseLeave={(e) => e.currentTarget.style.color = ''}
                            />
                            <span 
                              className="text-sm font-semibold text-gray-900 transition-colors"
                              onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.base}
                              onMouseLeave={(e) => e.currentTarget.style.color = ''}
                            >Save Story</span>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigator.clipboard.writeText(window.location.origin + getPostUrl(post));
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 active:bg-white/20 transition-all duration-200 rounded-xl group"
                          >
                            <LinkIcon 
                              className="w-5 h-5 text-gray-700 transition-colors"
                              onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.base}
                              onMouseLeave={(e) => e.currentTarget.style.color = ''}
                            />
                            <span 
                              className="text-sm font-semibold text-gray-900 transition-colors"
                              onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.base}
                              onMouseLeave={(e) => e.currentTarget.style.color = ''}
                            >Copy Link</span>
                          </button>
                        </div>
                      </>
                    )}
                </div>
              </div>
            </Link>
              
              {/* Unsplash Attribution - Outside Link to avoid nested <a> tags */}
              {unsplashAttr && imageUrl && (
                  <div className="absolute top-0 left-0 w-full aspect-square pointer-events-none overflow-hidden rounded-t-xl">
                    <div className="relative w-full h-full">
                      {/* Always visible: Small Unsplash badge */}
                      <a
                        href="https://unsplash.com/?utm_source=codedharmony&utm_medium=referral"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-1.5 right-1.5 bg-white/70 hover:bg-white/90 backdrop-blur-sm rounded p-1 shadow-md hover:shadow-lg transition-all group-hover:opacity-0 z-10 pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                        title="Photo from Unsplash"
                      >
                        <svg className="w-3 h-3 text-black/80" fill="currentColor" viewBox="0 0 32 32">
                          <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"/>
                        </svg>
                      </a>
                      
                      {/* On hover: Full attribution */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent backdrop-blur-md text-white text-xs px-3 py-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="flex items-center gap-1 pointer-events-auto">
                          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 32 32">
                            <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"/>
                          </svg>
                          <span className="text-white/90">Photo by{' '}
                            <a
                              href={`${unsplashAttr.photographer_url}?utm_source=codedharmony&utm_medium=referral`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-white font-medium hover:text-blue-300 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {unsplashAttr.photographer}
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
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
          
          {/* Load More Button for Category */}
          {hasMore && !isExpanded && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => {
                  setExpandedCategories(prev => new Set([...prev, category]));
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-sm group"
              >
                <svg 
                  className="w-5 h-5 transition-colors" 
                  style={{ color: themeColors.cssVars.primary.base }}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span 
                  className="text-sm font-medium transition-colors"
                  style={{ color: themeColors.cssVars.primary.base }}
                >
                  Load More
                </span>
              </button>
            </div>
          )}
        </div>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {shouldShowLoadMore && (
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
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-600" />
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
