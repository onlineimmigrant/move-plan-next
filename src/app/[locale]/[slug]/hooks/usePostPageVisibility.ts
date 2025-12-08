'use client';

import { useState, useEffect, useMemo } from 'react';

interface Post {
  type?: 'default' | 'minimal' | 'landing' | 'doc_set';
  content?: string;
  title?: string;
  description?: string;
}

/**
 * Custom hook for managing visibility states and scroll behavior
 * Handles TOC visibility, scroll positioning, and dynamic height adjustments
 * 
 * @param post - Post data for visibility calculations
 * @param tocLength - Number of TOC items
 * @returns Visibility states and computed classes
 */
export function usePostPageVisibility(post: Post | null, tocLength: number) {
  const [isMounted, setIsMounted] = useState(false);
  const [tocMaxHeight, setTocMaxHeight] = useState('calc(100vh - 10rem)');

  const postType = useMemo(() => post?.type || 'default', [post?.type]);
  const isLandingPost = useMemo(() => postType === 'landing', [postType]);
  const isMinimalPost = useMemo(() => postType === 'minimal', [postType]);

  // Set mounted state on client-side only
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Dynamically adjust TOC height to stop before footer
  useEffect(() => {
    if (!isMounted) return;

    const adjustTocHeight = () => {
      const footer = document.querySelector('footer');
      if (footer) {
        const footerTop = footer.getBoundingClientRect().top;
        const viewportHeight = window.innerHeight;
        const tocTop = 96; // top-24 = 96px
        
        // Calculate available height: from TOC top to footer top, with some padding
        const availableHeight = footerTop - tocTop - 24; // 24px padding before footer
        const maxHeight = Math.min(availableHeight, viewportHeight - tocTop - 24);
        
        if (maxHeight > 200) { // Minimum height threshold
          const newHeight = `${maxHeight}px`;
          // Only update if the value has actually changed
          setTocMaxHeight(prev => prev === newHeight ? prev : newHeight);
        }
      }
    };

    // Run on mount and scroll
    adjustTocHeight();
    window.addEventListener('scroll', adjustTocHeight, { passive: true });
    window.addEventListener('resize', adjustTocHeight, { passive: true });

    return () => {
      window.removeEventListener('scroll', adjustTocHeight);
      window.removeEventListener('resize', adjustTocHeight);
    };
  }, [isMounted]);

  const showTOC = useMemo(() => 
    (postType === 'default' || postType === 'doc_set') && tocLength > 0,
    [postType, tocLength]
  );

  const showPostHeader = useMemo(() => 
    postType === 'default' || postType === 'minimal' || postType === 'doc_set',
    [postType]
  );

  // Determine if we should show any header content at all (for spacing purposes)
  const hasHeaderContent = useMemo(() => {
    if (!post) return false;
    // For minimal posts, only show header if there's title or description
    if (isMinimalPost) {
      return !!(post.title || post.description);
    }
    // For other post types, always show header
    return true;
  }, [post, isMinimalPost]);

  // Determine section padding based on content presence
  const sectionPaddingClass = useMemo(() => {
    // If minimal post with no header content and no post content, remove vertical padding
    if (isMinimalPost && !hasHeaderContent && !post?.content) {
      return 'lg:col-span-4 text-base leading-7 text-gray-900 bg-white overflow-hidden';
    }
    // Default padding
    return 'py-16 lg:col-span-4 text-base leading-7 text-gray-900 bg-white overflow-hidden';
  }, [isMinimalPost, hasHeaderContent, post?.content]);

  // Determine main padding based on content presence
  const mainPaddingClass = useMemo(() => {
    // Landing pages should have no padding
    if (isLandingPost) {
      return 'w-full max-w-full overflow-x-hidden';
    }
    // If minimal post with no header content and no post content, remove padding
    if (isMinimalPost && !hasHeaderContent && !post?.content) {
      return 'px-4 bg-white w-full max-w-full overflow-x-hidden';
    }
    // Default padding
    return 'px-4 sm:pt-4 sm:pb-16 bg-white w-full max-w-full overflow-x-hidden';
  }, [isLandingPost, isMinimalPost, hasHeaderContent, post?.content]);

  // Determine TOC padding
  const tocPaddingClass = useMemo(() => {
    // If minimal post with no header content and no post content, remove top padding
    if (isMinimalPost && !hasHeaderContent && !post?.content) {
      return 'hidden lg:block';
    }
    // Default padding
    return 'hidden lg:block pt-16';
  }, [isMinimalPost, hasHeaderContent, post?.content]);

  // Determine aside padding
  const asidePaddingClass = useMemo(() => {
    // If minimal post with no header content and no post content, remove bottom padding
    if (isMinimalPost && !hasHeaderContent && !post?.content) {
      return 'lg:col-span-2 w-full relative';
    }
    // Default padding
    return 'lg:col-span-2 pb-8 w-full relative';
  }, [isMinimalPost, hasHeaderContent, post?.content]);

  // Determine right sidebar padding
  const rightSidebarOuterClass = useMemo(() => {
    // If minimal post with no header content and no post content, remove padding
    if (isMinimalPost && !hasHeaderContent && !post?.content) {
      return 'lg:col-span-2 space-y-8 sm:px-4';
    }
    // Default padding
    return 'lg:col-span-2 space-y-8 pb-8 sm:px-4';
  }, [isMinimalPost, hasHeaderContent, post?.content]);

  const rightSidebarInnerClass = useMemo(() => {
    // If minimal post with no header content and no post content, remove top margin
    if (isMinimalPost && !hasHeaderContent && !post?.content) {
      return 'hidden lg:block sticky top-32 pl-4';
    }
    // Default padding
    return 'hidden lg:block mt-16 sticky top-32 pl-4';
  }, [isMinimalPost, hasHeaderContent, post?.content]);

  return {
    isMounted,
    tocMaxHeight,
    postType,
    isLandingPost,
    isMinimalPost,
    showTOC,
    showPostHeader,
    hasHeaderContent,
    sectionPaddingClass,
    mainPaddingClass,
    tocPaddingClass,
    asidePaddingClass,
    rightSidebarOuterClass,
    rightSidebarInnerClass,
  };
}
