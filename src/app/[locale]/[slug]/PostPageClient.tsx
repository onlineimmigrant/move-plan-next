'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import PostHeader from '@/components/PostPage/PostHeader';
import AdminButtons from '@/components/PostPage/AdminButtons';
import LandingPostContent from '@/components/PostPage/LandingPostContent';
import TOC from '@/components/PostPage/TOC';
import MasterTOC from '@/components/PostPage/MasterTOC';
import DocumentSetNavigation from '@/components/PostPage/DocumentSetNavigation';
import CodeBlockCopy from '@/components/CodeBlockCopy';
import { getPostUrl } from '@/lib/postUtils';
import { getOrganizationId } from '@/lib/supabase';
import { isAdminClient } from '@/lib/auth';
import { getBaseUrl } from '@/lib/utils';
import { useThemeColors } from '@/hooks/useThemeColors';
import Loading from '@/ui/Loading';

interface TOCItem {
  tag_name: string;
  tag_text: string;
  tag_id: string;
}

interface Post {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  section?: string;
  subsection?: string;
  created_on: string;
  is_with_author: boolean;
  is_company_author: boolean;
  author?: { first_name: string; last_name: string };
  excerpt?: string;
  featured_image?: string;
  keywords?: string;
  section_id?: string | null;
  last_modified: string;
  display_this_post: boolean;
  type?: 'default' | 'minimal' | 'landing' | 'doc_set';
  reviews?: { rating: number; author: string; comment: string }[];
  faqs?: { question: string; answer: string }[];
  organization_id?: string;
  main_photo?: string;
  additional_photo?: string;
  doc_set?: string | null;
  doc_set_order?: number | null;
  doc_set_title?: string | null;
}

interface PostPageClientProps {
  post: Post;
  slug: string;
}

const PostPageClient: React.FC<PostPageClientProps> = memo(({ post, slug }) => {
  console.log('🔥 [ClientSide] PostPageClient component loaded');
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const [hasTemplateSections, setHasTemplateSections] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const themeColors = useThemeColors();

  const baseUrl = useMemo(() =>
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    []
  );

  // Set mounted state on client-side only
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle hash navigation on page load and slug changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      // Reduced delay for faster hash navigation
      setTimeout(() => {
        const hash = window.location.hash.substring(1);
        const element = document.getElementById(hash);
        if (element) {
          const yOffset = -100;
          const yPosition = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: yPosition, behavior: 'smooth' });
        }
      }, 100); // Reduced from 300ms to 100ms
    }
  }, [post.slug]); // Added dependency to trigger on page navigation

  // Check admin status client-side
  useEffect(() => {
    const checkAdminStatus = async () => {
      const adminStatus = await isAdminClient();
      console.log('Admin status:', adminStatus);
      setIsAdmin(adminStatus);
    };
    checkAdminStatus();
  }, []);

  // Listen for post-updated events (like Hero component does)
  useEffect(() => {
    const handlePostUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[PostPageClient] Received post-updated event:', customEvent.detail);
      
      // Reload the page to fetch fresh post data
      window.location.reload();
    };

    window.addEventListener('post-updated', handlePostUpdate);

    return () => {
      window.removeEventListener('post-updated', handlePostUpdate);
    };
  }, []);

  // Check if there are any template sections or headings for this page
  useEffect(() => {
    const checkTemplateSections = async () => {
      try {
        const clientBaseUrl = getBaseUrl(false);
        const urlPage = `/${slug}`;
        
        const [sectionsResponse, headingsResponse] = await Promise.all([
          fetch(`${clientBaseUrl}/api/template-sections?url_page=${encodeURIComponent(urlPage)}`),
          fetch(`${clientBaseUrl}/api/template-heading-sections?url_page=${encodeURIComponent(urlPage)}`),
        ]);

        if (sectionsResponse.ok && headingsResponse.ok) {
          const sectionsData = await sectionsResponse.json();
          const headingsData = await headingsResponse.json();
          
          const hasSections = sectionsData.length > 0 || headingsData.length > 0;
          console.log('Template sections check:', { 
            sections: sectionsData.length, 
            headings: headingsData.length,
            hasSections 
          });
          setHasTemplateSections(hasSections);
        }
      } catch (error) {
        console.error('Error checking template sections:', error);
      }
    };

    checkTemplateSections();
  }, [slug]);

  // Touch handler for table scrolling
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const wrapper = (e.target as HTMLElement).closest('.table-wrapper') as HTMLElement;
      if (!wrapper) return;

      const startX = e.touches[0].clientX;
      const scrollStart = wrapper.scrollLeft;

      const handleTouchMove = (moveEvent: TouchEvent) => {
        moveEvent.preventDefault();
        moveEvent.stopPropagation();
        const currentX = moveEvent.touches[0].clientX;
        const deltaX = startX - currentX;
        wrapper.scrollLeft = scrollStart + deltaX;
      };

      const handleTouchEnd = () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };

      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  // Generate TOC
  const toc: TOCItem[] = useMemo(() => {
    // Check if we're in the browser (client-side only)
    if (typeof window === 'undefined') return [];
    if (!post || !post.content) return [];
    
    const tocItems: TOCItem[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(post.content, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5');

    console.log('🔍 TOC Generation - Total headings found:', headings.length);

    headings.forEach((heading, index) => {
      const tagName = heading.tagName.toLowerCase();
      const tagText = heading.textContent || '';
      const tagId = heading.id || `${tagName}-${index + 1}`;

      if (!heading.id) {
        heading.id = tagId;
      }

      console.log(`  ${index + 1}. ${tagName.toUpperCase()}: "${tagText}" → ID: "${tagId}"`);

      tocItems.push({
        tag_name: tagName,
        tag_text: tagText,
        tag_id: tagId,
      });
    });

    console.log('📋 Generated TOC items:', tocItems.map(t => `${t.tag_id}: ${t.tag_text}`));
    return tocItems;
  }, [post]);

    // Apply IDs to rendered headings to match TOC
  useEffect(() => {
    if (!contentRef.current || toc.length === 0) {
      console.log('⏭️ Skipping ID application:', { hasContentRef: !!contentRef.current, tocLength: toc.length });
      return;
    }

    // Use setTimeout to ensure DOM is fully rendered
    const timeoutId = setTimeout(() => {
      console.log('🔧 Applying IDs to rendered DOM...');
      const headings = contentRef.current!.querySelectorAll('h1, h2, h3, h4, h5');
      console.log('   Total rendered headings:', headings.length);
      console.log('   TOC expects', toc.length, 'headings');
      
      if (headings.length !== toc.length) {
        console.warn('⚠️ MISMATCH: DOM has', headings.length, 'headings but TOC has', toc.length);
      }
      
      headings.forEach((heading, index) => {
        const tagName = heading.tagName.toLowerCase();
        const oldId = heading.id;
        // Use global counter like TOC generation does
        const expectedId = heading.id || `${tagName}-${index + 1}`;
        
        // Set ID to match TOC
        heading.id = expectedId;
        console.log(`   ${index + 1}. ${tagName.toUpperCase()}: ${oldId ? `"${oldId}"` : '(no id)'} → "${expectedId}"`);
      });
      
      console.log('✅ Final IDs in DOM:', Array.from(headings).map(h => h.id));
      console.log('📋 TOC expects these IDs:', toc.map(t => t.tag_id));
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [toc, post?.content]);

  // Memoized scroll handler
  const handleScrollTo = useCallback((id: string) => {
    console.log('Attempting to scroll to ID:', id);
    
    // First try to find by ID
    let element = document.getElementById(id);
    
    // If not found, try to find the heading by matching it with TOC
    if (!element && contentRef.current) {
      const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5');
      const allHeadings = Array.from(headings);
      
      console.log('All headings in DOM:', allHeadings.map((h, i) => ({
        index: i,
        tag: h.tagName.toLowerCase(),
        id: h.id || '(none)',
        text: h.textContent?.substring(0, 50)
      })));
      
      // Find the matching heading from TOC
      const tocIndex = toc.findIndex(t => t.tag_id === id);
      if (tocIndex !== -1 && allHeadings[tocIndex]) {
        element = allHeadings[tocIndex] as HTMLElement;
        // Apply the ID so it works next time
        element.id = id;
        console.log('✅ Found heading by index, applied ID:', id);
      }
    }
    
    if (element) {
      console.log('Scrolling to element');
      const yOffset = -100;
      const yPosition = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: yPosition, behavior: 'smooth' });
    } else {
      console.error('❌ Element not found for ID:', id);
      console.error('Available IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id).filter(Boolean));
    }
  }, [toc]);

  // Memoized content update handler
  const handleContentUpdate = useCallback(async () => {
    if (!contentRef.current || !post || !isAdmin) return;

    const updatedContent = contentRef.current.innerHTML;

    try {
      const organizationId = await getOrganizationId(baseUrl);
      if (!organizationId) {
        throw new Error('Organization not found');
      }

      const response = await fetch(`/api/posts/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: updatedContent, organization_id: organizationId }),
      });

      if (response.ok) {
        console.log('Content updated successfully');
      } else {
        console.error('Failed to update content:', await response.json());
      }
    } catch (error) {
      console.error('Error updating content:', error);
    }
  }, [baseUrl, slug, post, isAdmin]);

  // Memoized editable handler
  const makeEditable = useCallback((e: React.MouseEvent) => {
    if (!isAdmin) return;
    const target = e.target as HTMLElement;
    console.log('Double-clicked:', target.tagName, 'ID:', target.id);
    
    if (['H1', 'H2', 'H3', 'H4', 'H5', 'P', 'UL', 'LI'].includes(target.tagName)) {
      target.contentEditable = 'true';
      target.focus();
      
      const handleBlur = () => {
        console.log('Blur on:', target.tagName, 'ID:', target.id, 'Content:', target.innerHTML);
        target.contentEditable = 'false';
        handleContentUpdate();
      };

      const handleKeyDown = (ev: KeyboardEvent) => {
        if (ev.key === 'Enter' && !ev.shiftKey) {
          console.log('Enter pressed on:', target.tagName, 'ID:', target.id);
          ev.preventDefault();
          target.blur();
        }
      };

      target.addEventListener('blur', handleBlur, { once: true });
      target.addEventListener('keydown', handleKeyDown);
    }
  }, [isAdmin, handleContentUpdate]);

  // Memoized content checks
  const postType = useMemo(() => post?.type || 'default', [post?.type]);
  
  const shouldShowMainContent = useMemo(() => 
    post && post.content?.length > 0,
    [post]
  );

  const shouldShowNoContentMessage = useMemo(() =>
    post && 
    (!post.content || post.content.length === 0) &&
    !hasTemplateSections,
    [post, hasTemplateSections]
  );

  const isLandingPost = useMemo(() => 
    postType === 'landing',
    [postType]
  );
  
  const isMinimalPost = useMemo(() => 
    postType === 'minimal',
    [postType]
  );
  
  const showTOC = useMemo(() => 
    (postType === 'default' || postType === 'doc_set') && toc.length > 0,
    [postType, toc.length]
  );
  
  const showPostHeader = useMemo(() => 
    postType === 'default' || postType === 'minimal' || postType === 'doc_set',
    [postType]
  );

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <main className="px-4 sm:pt-4 sm:pb-16 bg-white">
      {!isLandingPost ? (
        // Only render the grid if we have content or need to show the empty message
        (shouldShowMainContent || shouldShowNoContentMessage) ? (
          <div className="grid lg:grid-cols-8 gap-x-4">
            {/* TOC Sidebar - Show Master TOC for document sets, regular TOC otherwise */}
            <aside className="lg:col-span-2 space-y-8 pb-8 sm:px-4">
              {isMounted && showTOC && (
                <div className="hidden lg:block mt-16 sticky top-32 pr-4 lg:border-r lg:border-gray-100">
                  {(() => {
                    const shouldShowMasterTOC = (post.doc_set || post.type === 'doc_set') && post.organization_id;
                    console.log('[PostPageClient] TOC Render Check:', {
                      shouldShowMasterTOC,
                      doc_set: post.doc_set,
                      type: post.type,
                      organization_id: post.organization_id,
                      slug: post.slug
                    });
                    
                    return shouldShowMasterTOC && post.organization_id ? (
                      <MasterTOC
                        currentSlug={post.slug}
                        docSet={post.doc_set || post.slug}
                        organizationId={post.organization_id}
                        handleScrollTo={handleScrollTo}
                        currentArticleTOC={toc.map(item => ({
                          level: parseInt(item.tag_name.substring(1)),
                          text: item.tag_text,
                          id: item.tag_id
                        }))}
                      />
                    ) : (
                      <TOC toc={toc} handleScrollTo={handleScrollTo} />
                    );
                  })()}
                </div>
              )}
            </aside>

            {/* Main Content */}
            <section className="py-16 lg:col-span-4 text-base leading-7 text-gray-900 bg-white">
              {shouldShowMainContent ? (
                <>
                  {showPostHeader && (
                    <div
                      onMouseEnter={() => setIsHeaderHovered(true)}
                      onMouseLeave={() => setIsHeaderHovered(false)}
                      className="relative"
                    >
                      <PostHeader
                        post={post}
                        isAdmin={isAdmin}
                        showAdminButtons={isHeaderHovered}
                        minimal={isMinimalPost}
                      />
                    </div>
                  )}
                  
                  <article
                    ref={contentRef}
                    className="prose prose-sm sm:prose lg:prose-xl font-light text-gray-600 table-scroll-container"
                    onDoubleClick={makeEditable}
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                
                {/* Code block copy functionality */}
                <CodeBlockCopy />
                
                {/* Document Set Navigation - Only show if post belongs to a document set */}
                {post.organization_id && (post.doc_set || post.type === 'doc_set') && (
                  <DocumentSetNavigation
                    currentSlug={post.slug}
                    docSet={post.doc_set || post.slug}
                    organizationId={post.organization_id}
                    isDocSetType={post.type === 'doc_set'}
                  />
                )}
                
                {/* Mobile TOC - Below Content - Show Master TOC for document sets, regular TOC otherwise */}
                {isMounted && showTOC && (
                  <div className="lg:hidden mt-12 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg 
                        className="w-5 h-5 mr-2" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        style={{ color: themeColors.cssVars.primary.base }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      Table of Contents
                    </h3>
                    {((post.doc_set || post.type === 'doc_set') && post.organization_id) ? (
                      <MasterTOC
                        currentSlug={post.slug}
                        docSet={post.doc_set || post.slug}
                        organizationId={post.organization_id}
                        handleScrollTo={handleScrollTo}
                        currentArticleTOC={toc.map(item => ({
                          level: parseInt(item.tag_name.substring(1)),
                          text: item.tag_text,
                          id: item.tag_id
                        }))}
                      />
                    ) : (
                      <TOC toc={toc} handleScrollTo={handleScrollTo} />
                    )}
                  </div>
                )}
              </>
            ) : shouldShowNoContentMessage ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Content Available</h3>
                  <p className="text-gray-500">This post doesn't have any content yet.</p>
                </div>
              </div>
            ) : null}
          </section>

          {/* Right Sidebar */}
          <aside className="lg:col-span-2"></aside>
        </div>
        ) : null
      ) : post.content ? (
        <div className="relative">
          {isAdmin && (
            <div className="absolute top-4 right-4 z-50">
              <AdminButtons post={post} />
            </div>
          )}
          <LandingPostContent post={post} />
        </div>
      ) : null}
    </main>
  );
});

PostPageClient.displayName = 'PostPageClient';

export default PostPageClient;
