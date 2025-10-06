'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getOrganizationId } from '@/lib/supabase';
import { getPostUrl } from '@/lib/postUtils';
import { useSettings } from '@/context/SettingsContext';

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
  section_id?: string | null;
  organization_id?: string;
}

const BlogPostSlider: React.FC = () => {
  const { settings } = useSettings();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Fetch blog posts that should be displayed on first page
  useEffect(() => {
    const fetchFeaturedPosts = async () => {
      try {
        const organizationId = await getOrganizationId(baseUrl);
        if (!organizationId) {
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/posts/featured?organization_id=${organizationId}`);
        if (response.ok) {
          const data = await response.json();
          setPosts(data);
        }
      } catch (error) {
        console.error('Error fetching featured posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedPosts();
  }, [baseUrl]);

  // Auto-scroll functionality
  useEffect(() => {
    if (posts.length <= 1 || isHovered) return;

    autoScrollInterval.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % posts.length);
    }, 5000); // Change slide every 5 seconds

    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, [posts.length, isHovered]);

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
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 via-white to-blue-50">
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
                const imageUrl = post.main_photo && post.main_photo.trim() !== '' ? post.main_photo : settings?.image;
                const isSvg = imageUrl?.toLowerCase().endsWith('.svg');

                return (
                  <Link 
                    key={post.id} 
                    href={getPostUrl(post)}
                    className="min-w-full group"
                  >
                    <div className="relative overflow-hidden">
                      {/* Image Section */}
                      <div className="relative h-[500px]">
                        {imageUrl ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <img
                              src={imageUrl}
                              alt={post.title ?? 'Blog post'}
                              className={isSvg ? 'max-w-[40%] max-h-[40%] object-contain' : 'w-full h-full object-cover'}
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center">
                            <span className="text-8xl">📄</span>
                          </div>
                        )}
                      </div>

                      {/* Content Section */}
                      <div className="p-8 md:p-12">
                        <div className="max-w-3xl mx-auto">
                          {post.subsection && (
                            <span className="inline-block px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm font-medium mb-4">
                              {post.subsection}
                            </span>
                          )}
                          <h3 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 group-hover:text-gray-700 transition-colors">
                            {post.title ?? 'Untitled'}
                          </h3>
                          <p className="text-lg text-gray-600 line-clamp-3">
                            {post.description ?? 'No description available'}
                          </p>
                          <div className="mt-6 inline-flex items-center text-sky-600 font-medium group-hover:text-sky-700">
                            Read More
                            <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>



          {/* Desktop Navigation Buttons - Bottom Right */}
          {posts.length > 1 && (
            <div className="hidden md:flex absolute bottom-6 right-6 gap-3">
              <button
                onClick={handlePrevious}
                className="text-gray-400/60 hover:text-gray-600/80 transition-all duration-300 ease-in-out hover:scale-125 hover:-translate-x-1 focus:outline-none"
                aria-label="Previous post"
              >
                <ChevronLeftIcon className="w-7 h-7 stroke-2" />
              </button>
              <button
                onClick={handleNext}
                className="text-gray-400/60 hover:text-gray-600/80 transition-all duration-300 ease-in-out hover:scale-125 hover:translate-x-1 focus:outline-none"
                aria-label="Next post"
              >
                <ChevronRightIcon className="w-7 h-7 stroke-2" />
              </button>
            </div>
          )}

          {/* Dots Navigation */}
          {posts.length > 1 && (
            <div className="flex justify-center mt-6 gap-2">
              {posts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-gray-700 w-8'
                      : 'bg-gray-300 hover:bg-gray-500'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>


      </div>
    </section>
  );
};

export default BlogPostSlider;
