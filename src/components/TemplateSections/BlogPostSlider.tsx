'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { getOrganizationId } from '@/lib/supabase';
import { getPostUrl } from '@/lib/postUtils';
import { useSettings } from '@/context/SettingsContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SliderNavigation } from '@/ui/SliderNavigation';
import UnsplashAttribution from '@/components/UnsplashAttribution';

interface BlogPost {
  id: number;
  slug: string;
  title: string | null;
  description: string | null;
  display_config?: {
    display_this_post?: boolean;
    display_as_blog_post?: boolean;
    is_displayed_first_page?: boolean;
  };
  media_config?: {
    main_photo?: string | null;
    unsplash_attribution?: {
      photographer: string;
      photographer_url: string;
      photo_url: string;
      download_location: string;
    };
  };
  organization_config?: {
    subsection?: string | null;
    section_id?: number | null;
  };
  organization_id?: string;
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

interface BlogPostSliderProps {
  backgroundColor?: string;
}

// Cache blog posts to prevent refetching
const postsCache = new Map<string, { posts: BlogPost[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const BlogPostSlider: React.FC<BlogPostSliderProps> = ({ backgroundColor }) => {
  const { settings } = useSettings();
  const themeColors = useThemeColors();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const containerRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch blog posts that should be displayed on first page
  useEffect(() => {
    if (hasLoadedRef.current) return;

    const fetchFeaturedPosts = async () => {
      try {
        const organizationId = await getOrganizationId(baseUrl);
        if (!organizationId) {
          setLoading(false);
          hasLoadedRef.current = true;
          return;
        }

        // Check cache first
        const cached = postsCache.get(organizationId);
        const now = Date.now();
        
        if (cached && (now - cached.timestamp) < CACHE_DURATION) {
          setPosts(cached.posts);
          setLoading(false);
          hasLoadedRef.current = true;
          return;
        }

        const response = await fetch(`/api/posts/featured?organization_id=${organizationId}`);
        if (response.ok) {
          const data = await response.json();

          // Cache the result
          postsCache.set(organizationId, {
            posts: data,
            timestamp: Date.now(),
          });

          setPosts(data);
          hasLoadedRef.current = true;
        }
      } catch (error) {
        console.error('Error fetching featured posts:', error);
        hasLoadedRef.current = true;
      } finally {
        setLoading(false);
      }
    };

    if (!hasLoadedRef.current) {
      // Use IntersectionObserver to only load when visible
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasLoadedRef.current) {
              fetchFeaturedPosts();
              observer.disconnect();
            }
          });
        },
        { rootMargin: '50px' }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => {
        observer.disconnect();
      };
    }
  }, [baseUrl]);

  // Auto-scroll functionality (disabled on mobile)
  useEffect(() => {
    if (posts.length <= 1 || isHovered || isMobile) return;

    autoScrollInterval.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % posts.length);
    }, 5000); // Change slide every 5 seconds

    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, [posts.length, isHovered, isMobile]);

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + posts.length) % posts.length);
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % posts.length);
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  // Touch handlers for mobile swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && posts.length > 1) {
      handleNext();
    }
    if (isRightSwipe && posts.length > 1) {
      handlePrevious();
    }
  };

  if (loading || posts.length === 0) {
    return <div ref={containerRef} />;
  }

  // Determine if we should use the gradient background
  // Use gradient when backgroundColor is undefined, 'transparent', 'white', or any white variant
  const shouldUseGradient = !backgroundColor || 
    backgroundColor === 'transparent' || 
    backgroundColor.toLowerCase() === 'white' ||
    backgroundColor.toLowerCase() === '#ffffff' ||
    backgroundColor.toLowerCase() === '#fff' ||
    backgroundColor.toLowerCase() === 'rgb(255, 255, 255)' ||
    backgroundColor.toLowerCase() === 'rgba(255, 255, 255, 1)';

  // Create gradient background with primary color
  const gradientStyle = shouldUseGradient ? {
    background: `linear-gradient(to bottom right, ${themeColors.cssVars.primary.lighter}, white, ${themeColors.cssVars.primary.lighter})`
  } : {};

  return (
    <section 
      ref={containerRef}
      className="py-8 md:py-12"
      style={gradientStyle}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Slider Container */}
        <div 
          className="relative group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Slides */}
          <div className="overflow-hidden" ref={sliderRef}>
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {posts.map((post) => {
                const imageUrl = post.media_config?.main_photo && post.media_config.main_photo.trim() !== '' 
                  ? post.media_config.main_photo 
                  : settings?.image;
                
                // Check for Unsplash attribution
                const unsplashAttr = post.media_config?.unsplash_attribution || post.attrs?.unsplash_attribution;

                return (
                  <div 
                    key={post.id} 
                    className="min-w-full group"
                  >
                    <div className="relative overflow-hidden">
                      {/* Image Section - Reduced height */}
                      <div className="relative h-[280px] sm:h-[320px] md:h-[360px] lg:h-[400px] group/img">
                        <Link href={getPostUrl(post)} className="absolute inset-0 z-0">
                          <span className="sr-only">View post: {post.title}</span>
                        </Link>
                        {imageUrl ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <img
                              src={imageUrl}
                              alt={post.title ?? 'Blog post'}
                              className="w-full h-full object-contain"
                            />
                            
                            {/* Unsplash Attribution */}
                            {unsplashAttr && (
                              <UnsplashAttribution
                                attribution={unsplashAttr}
                                variant="overlay"
                                position="bottom-right"
                              />
                            )}
                          </div>
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center"
                            style={{
                              background: `linear-gradient(to bottom right, ${themeColors.cssVars.primary.lighter}, ${themeColors.cssVars.primary.light})`
                            }}
                          >
                            <span className="text-5xl md:text-8xl">📄</span>
                          </div>
                        )}
                      </div>

                      {/* Content Section - Reduced spacing on mobile */}
                      <Link href={getPostUrl(post)} className="block p-4 md:p-8 lg:p-10">
                        <div className="max-w-3xl mx-auto">
                          {post.organization_config?.subsection && (
                            <span 
                              className="inline-block px-2.5 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium mb-2 md:mb-4"
                              style={{
                                backgroundColor: themeColors.cssVars.primary.lighter,
                                color: themeColors.cssVars.primary.base
                              }}
                            >
                              {post.organization_config.subsection}
                            </span>
                          )}
                          <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 md:mb-4 group-hover:text-gray-700 transition-colors">
                            {post.title ?? 'Untitled'}
                          </h3>
                          <p className="text-base md:text-lg text-gray-600 line-clamp-2 md:line-clamp-3">
                            {post.description ?? 'No description available'}
                          </p>
                          <div 
                            className="mt-4 md:mt-6 inline-flex items-center text-sm md:text-base font-medium group-hover:opacity-80 transition-opacity"
                            style={{ color: themeColors.cssVars.primary.base }}
                          >
                            Read More
                            <svg className="w-4 h-4 md:w-5 md:h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>



          {/* Navigation */}
          <SliderNavigation
            onPrevious={handlePrevious}
            onNext={handleNext}
            currentIndex={currentIndex}
            totalItems={posts.length}
            onDotClick={handleDotClick}
            showDots={true}
            buttonPosition="bottom-right"
            buttonVariant="minimal"
            dotVariant="default"
          />
        </div>


      </div>
    </section>
  );
};

export default BlogPostSlider;
