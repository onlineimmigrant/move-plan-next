'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import PostHeader from '@/components/PostPage/PostHeader';
import LandingPostContent from '@/components/PostPage/LandingPostContent';
import TOC from '@/components/PostPage/TOC';
import { getPostUrl } from '@/lib/postUtils';
import { getOrganizationId } from '@/lib/supabase';
import { isAdminClient } from '@/lib/auth';
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
  reviews?: { rating: number; author: string; comment: string }[];
  faqs?: { question: string; answer: string }[];
  organization_id?: string;
  main_photo?: string;
  additional_photo?: string;
}

interface PostPageClientProps {
  post: Post;
  slug: string;
}

const PostPageClient: React.FC<PostPageClientProps> = memo(({ post, slug }) => {
  console.log('🔥 [ClientSide] PostPageClient component loaded');
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const baseUrl = useMemo(() =>
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    []
  );

  // Check admin status client-side
  useEffect(() => {
    const checkAdminStatus = async () => {
      const adminStatus = await isAdminClient();
      console.log('Admin status:', adminStatus);
      setIsAdmin(adminStatus);
    };
    checkAdminStatus();
  }, []);

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
    if (!post || !post.content) return [];
    const tocItems: TOCItem[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(post.content, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5');

    headings.forEach((heading, index) => {
      const tagName = heading.tagName.toLowerCase();
      const tagText = heading.textContent || '';
      const tagId = heading.id || `${tagName}-${index + 1}`;

      if (!heading.id) {
        heading.id = tagId;
      }

      tocItems.push({
        tag_name: tagName,
        tag_text: tagText,
        tag_id: tagId,
      });
    });

    console.log('Generated TOC:', tocItems);
    return tocItems;
  }, [post]);

  // Memoized scroll handler
  const handleScrollTo = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      console.log('Scrolling to:', id);
      const yOffset = -100;
      const yPosition = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: yPosition, behavior: 'smooth' });
    } else {
      console.error('Element not found for ID:', id);
    }
  }, []);

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
  const shouldShowMainContent = useMemo(() => 
    post && (!post.section || post.section !== 'Landing') && post.content?.length > 0,
    [post]
  );

  const isLandingPost = useMemo(() => 
    post?.section === 'Landing',
    [post?.section]
  );

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <main className="px-4 sm:pt-4 sm:pb-16">
      {!isLandingPost ? (
        <div className="grid lg:grid-cols-8 gap-x-4">
          {/* TOC Sidebar */}
          <aside className="lg:col-span-2 space-y-8 pb-8 sm:px-4">
            {toc.length > 0 && (
              <div className="hidden sm:block mt-16 sticky top-32">
                <TOC toc={toc} handleScrollTo={handleScrollTo} />
              </div>
            )}
          </aside>

          {/* Main Content */}
          <section className="py-16 lg:col-span-4 text-base leading-7 text-gray-900">
            {shouldShowMainContent ? (
              <>
                <div
                  onMouseEnter={() => setIsHeaderHovered(true)}
                  onMouseLeave={() => setIsHeaderHovered(false)}
                  className="relative"
                >
                  <PostHeader
                    post={{
                      section: post.section || '',
                      subsection: post.subsection || 'Subsection',
                      title: post.title,
                      created_on: post.created_on,
                      is_with_author: post.is_with_author,
                      is_company_author: post.is_company_author,
                      author: post.author,
                      description: post.description,
                    }}
                    isAdmin={isAdmin}
                    showMenu={isHeaderHovered}
                    editHref={`/admin/edit/${slug}`}
                    createHref="/admin/create-post"
                  />
                </div>
                <article
                  ref={contentRef}
                  className="prose prose-sm sm:prose lg:prose-xl font-light text-gray-600 table-scroll-container"
                  onDoubleClick={makeEditable}
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </>
            ) : (
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
            )}
          </section>

          {/* Right Sidebar */}
          <aside className="lg:col-span-2"></aside>
        </div>
      ) : post.content ? (
        <LandingPostContent post={post} />
      ) : (
        <div></div>
      )}
    </main>
  );
});

PostPageClient.displayName = 'PostPageClient';

export default PostPageClient;
