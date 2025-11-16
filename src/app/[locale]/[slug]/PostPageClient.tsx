'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { renderToStaticMarkup } from 'react-dom/server';
import PostHeader from '@/components/PostPage/PostHeader';
import AdminButtons from '@/components/PostPage/AdminButtons';
import LandingPostContent from '@/components/PostPage/LandingPostContent';
import TOC from '@/components/PostPage/TOC';
import MasterTOC from '@/components/PostPage/MasterTOC';
import DocumentSetNavigation from '@/components/PostPage/DocumentSetNavigation';
import { BottomSheetTOC } from '@/components/PostPage/BottomSheetTOC';
import { PostPageSkeleton } from '@/components/PostPage/PostPageSkeleton';
// import { RelatedArticles } from '@/components/PostPage/RelatedArticles'; // TODO: Temporarily disabled - will be activated later
import CodeBlockCopy from '@/components/CodeBlockCopy';
import { getPostUrl } from '@/lib/postUtils';
import { getOrganizationId } from '@/lib/supabase';
import { isAdminClient } from '@/lib/auth';
import { getBaseUrl } from '@/lib/utils';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useDocumentSetLogic } from '@/hooks/useDocumentSetLogic';
import { generateTOC, applyTOCIds, type TOCItem } from '@/utils/generateTOC';
import { debug } from '@/utils/debug';
import Loading from '@/ui/Loading';

interface Post {
  id: string;
  slug: string;
  title?: string;
  description?: string;
  content?: string;
  content_type?: 'html' | 'markdown';
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
  const [tocMaxHeight, setTocMaxHeight] = useState('calc(100vh - 10rem)');
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
      debug.log('PostPageClient', 'Received post-updated event:', customEvent.detail);
      
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
          debug.log('PostPageClient', 'Template sections check:', { 
            sections: sectionsData.length, 
            headings: headingsData.length,
            hasSections 
          });
          setHasTemplateSections(hasSections);
        }
      } catch (error) {
        debug.error('PostPageClient', 'Error checking template sections:', error);
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

  // Generate TOC using utility function
  const toc: TOCItem[] = useMemo(() => {
    if (!post?.content) return [];
    
    // If content is Markdown, convert to HTML first for TOC generation
    if (post.content_type === 'markdown') {
      try {
        // Render Markdown to HTML string for TOC parsing
        const htmlContent = renderToStaticMarkup(
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeSanitize]}
          >
            {post.content}
          </ReactMarkdown>
        );
        return generateTOC(htmlContent);
      } catch (error) {
        console.error('Error converting Markdown to HTML for TOC:', error);
        return [];
      }
    }
    
    // For HTML content, use directly
    return generateTOC(post.content);
  }, [post?.content, post?.content_type]);

  // Apply IDs to rendered headings to match TOC
  useEffect(() => {
    if (!contentRef.current || toc.length === 0) {
      debug.log('PostPageClient', '⏭️ Skipping ID application:', { hasContentRef: !!contentRef.current, tocLength: toc.length });
      return;
    }

    // Use setTimeout to ensure DOM is fully rendered
    const timeoutId = setTimeout(() => {
      applyTOCIds(contentRef.current!, toc);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [toc, post?.content]);

  // Memoized scroll handler
  const handleScrollTo = useCallback((id: string) => {
    debug.log('PostPageClient', 'Attempting to scroll to ID:', id);
    
    // First try to find by ID
    let element = document.getElementById(id);
    
    // If not found, try to find the heading by matching it with TOC
    if (!element && contentRef.current) {
      const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5');
      const allHeadings = Array.from(headings);
      
      debug.group('PostPageClient', 'All headings in DOM', () => {
        allHeadings.forEach((h, i) => {
          debug.log('PostPageClient', `  ${i}: ${h.tagName.toLowerCase()} - ID: ${h.id || '(none)'} - Text: ${h.textContent?.substring(0, 50)}`);
        });
      });
      
      // Find the matching heading from TOC
      const tocIndex = toc.findIndex(t => t.tag_id === id);
      if (tocIndex !== -1 && allHeadings[tocIndex]) {
        element = allHeadings[tocIndex] as HTMLElement;
        // Apply the ID so it works next time
        element.id = id;
        debug.log('PostPageClient', '✅ Found heading by index, applied ID:', id);
      }
    }
    
    if (element) {
      debug.log('PostPageClient', 'Scrolling to element');
      const yOffset = -100;
      const yPosition = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: yPosition, behavior: 'smooth' });
    } else {
      debug.error('PostPageClient', '❌ Element not found for ID:', id);
      debug.error('PostPageClient', 'Available IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id).filter(Boolean));
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
        debug.log('PostPageClient', 'Content updated successfully');
      } else {
        debug.error('PostPageClient', 'Failed to update content:', await response.json());
      }
    } catch (error) {
      debug.error('PostPageClient', 'Error updating content:', error);
    }
  }, [baseUrl, slug, post, isAdmin]);

  // Memoized editable handler
  const makeEditable = useCallback((e: React.MouseEvent) => {
    if (!isAdmin) return;
    const target = e.target as HTMLElement;
    debug.log('PostPageClient', 'Double-clicked:', target.tagName, 'ID:', target.id);
    
    if (['H1', 'H2', 'H3', 'H4', 'H5', 'P', 'UL', 'LI'].includes(target.tagName)) {
      target.contentEditable = 'true';
      target.focus();
      
      const handleBlur = () => {
        debug.log('PostPageClient', 'Blur on:', target.tagName, 'ID:', target.id, 'Content:', target.innerHTML);
        target.contentEditable = 'false';
        handleContentUpdate();
      };

      const handleKeyDown = (ev: KeyboardEvent) => {
        if (ev.key === 'Enter' && !ev.shiftKey) {
          debug.log('PostPageClient', 'Enter pressed on:', target.tagName, 'ID:', target.id);
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
  
  // Use document set logic hook
  const docSet = useDocumentSetLogic(post);
  
  const shouldShowMainContent = useMemo(() => 
    post && ((post.content && post.content.length > 0) || hasTemplateSections),
    [post, hasTemplateSections]
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
    // If minimal post with no header content and no post content, remove padding
    if (isMinimalPost && !hasHeaderContent && !post?.content) {
      return 'px-4 bg-white w-full max-w-full overflow-x-hidden';
    }
    // Default padding
    return 'px-4 sm:pt-4 sm:pb-16 bg-white w-full max-w-full overflow-x-hidden';
  }, [isMinimalPost, hasHeaderContent, post?.content]);

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

  if (!post) {
    return <PostPageSkeleton />;
  }

  // For minimal posts with no header and no content, return empty fragment
  if (isMinimalPost && !hasHeaderContent && !post?.content) {
    return <></>;
  }

  return (
    <main className={mainPaddingClass}>
      {!isLandingPost ? (
        // Only render the grid if we have content or need to show the empty message
        (shouldShowMainContent || shouldShowNoContentMessage) ? (
          <div className="grid lg:grid-cols-8 gap-x-4 w-full max-w-full">
            {/* TOC Sidebar - Show Master TOC for document sets, regular TOC otherwise */}
            <aside className={asidePaddingClass}>
              {isMounted && showTOC && (
                <div className={tocPaddingClass}>
                  <div 
                    className="lg:fixed lg:w-[calc((100vw-1280px)/2+256px)] lg:max-w-[256px] top-24 pr-4 lg:border-r lg:border-gray-100 overflow-y-auto"
                    style={{ maxHeight: tocMaxHeight }}
                  >
                    {docSet.showMasterTOC ? (
                      <MasterTOC
                        currentSlug={post.slug}
                        docSet={docSet.docSetSlug}
                        organizationId={post.organization_id!}
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
                </div>
              )}
            </aside>

            {/* Main Content */}
            <section className={sectionPaddingClass}>
              {shouldShowMainContent ? (
                <>
                  {showPostHeader && hasHeaderContent && (
                    <div
                      onMouseEnter={() => setIsHeaderHovered(true)}
                      onMouseLeave={() => setIsHeaderHovered(false)}
                      className="relative px-4 sm:px-6 lg:px-0"
                    >
                      <PostHeader
                        post={post}
                        isAdmin={isAdmin}
                        showAdminButtons={isHeaderHovered}
                        minimal={isMinimalPost}
                      />
                    </div>
                  )}
                  
                  {post.content && (
                    <article
                      ref={contentRef}
                      className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl font-light text-gray-600 table-scroll-container px-4 sm:px-6 lg:px-0 w-full max-w-full overflow-x-hidden break-words"
                      onDoubleClick={makeEditable}
                      style={{
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        maxWidth: '100%',
                      }}
                    >
                      {post.content_type === 'markdown' ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw, rehypeSanitize]}
                          components={{
                            // Ensure images are responsive
                            img: ({node, ...props}) => (
                              <img {...props} alt={props.alt || ''} className="max-w-full h-auto" style={{maxWidth: '100%', height: 'auto'}} />
                            ),
                            // Ensure tables are scrollable on mobile
                            table: ({node, ...props}) => (
                              <div className="overflow-x-auto -mx-4 sm:mx-0">
                                <table {...props} />
                              </div>
                            ),
                            // Ensure code blocks don't overflow
                            pre: ({node, ...props}) => (
                              <pre {...props} className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-6" />
                            ),
                            // Ensure long words break properly
                            p: ({node, ...props}) => (
                              <p {...props} className="break-words" />
                            ),
                          }}
                        >
                          {post.content}
                        </ReactMarkdown>
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: post.content }} />
                      )}
                    </article>
                  )}
                
                {/* Code block copy functionality */}
                <CodeBlockCopy />
                
                {/* Document Set Navigation - Only show if post belongs to a document set */}
                {docSet.showMasterTOC && (
                  <DocumentSetNavigation
                    currentSlug={post.slug}
                    docSet={docSet.docSetSlug}
                    organizationId={post.organization_id!}
                    isDocSetType={docSet.isDocSetType}
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
                    {docSet.showMasterTOC ? (
                      <MasterTOC
                        currentSlug={post.slug}
                        docSet={docSet.docSetSlug}
                        organizationId={post.organization_id!}
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
          <aside className={rightSidebarOuterClass}>
            <div className={rightSidebarInnerClass}>
              {/* TODO: Related articles temporarily disabled - will be activated later */}
              {/* {docSet.showMasterTOC && (
                <RelatedArticles
                  currentSlug={post.slug}
                  docSet={docSet.docSetSlug}
                  organizationId={post.organization_id!}
                  maxArticles={4}
                />
              )} */}
            </div>
          </aside>
        </div>
        ) : null
      ) : (post.content && (
        <div className="relative">
          {isAdmin && (
            <div className="absolute top-4 right-4 z-50">
              <AdminButtons post={post} />
            </div>
          )}
          <LandingPostContent post={{ ...post, content: post.content }} />
        </div>
      ))}

      {/* Bottom Sheet TOC for Mobile */}
      {showTOC && toc.length > 0 && (
        <BottomSheetTOC
          toc={toc}
          handleScrollTo={handleScrollTo}
          title={docSet.showMasterTOC ? 'Document Navigation' : 'Table of Contents'}
        />
      )}
    </main>
  );
});

PostPageClient.displayName = 'PostPageClient';

export default PostPageClient;
