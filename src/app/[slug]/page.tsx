// src/app/posts/[slug]/page.tsx
'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import PostHeader from '@/components/PostPage/PostHeader';
import LandingPostContent from '@/components/PostPage/LandingPostContent';
import TOC from '@/components/PostPage/TOC';
import { notFound, redirect } from 'next/navigation';
import '@/components/PostPage/PostEditor.css';
import { getPostUrl } from '@/lib/postUtils';
import { getOrganizationId } from '@/lib/supabase';
import { isAdminClient } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
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
}

const PostPage: React.FC<{ params: Promise<{ slug: string }> }> = ({ params }) => {
  const { slug } = React.use(params);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // State for admin status
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const activeLanguages = ['en', 'es', 'fr'];

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

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const organizationId = await getOrganizationId(baseUrl);
        if (!organizationId) {
          throw new Error('Organization not found');
        }

        const response = await fetch(`/api/posts/${slug}?organization_id=${organizationId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched post:', data);
          const postUrl = getPostUrl({ section_id: data.section_id, slug });
          if (postUrl !== `/${slug}`) {
            redirect(postUrl);
          }
          setPost(data);
        } else if (response.status === 404) {
          notFound();
        } else {
          notFound();
        }
      } catch (error) {
        console.error('An error occurred:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug, baseUrl]);

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

    const updatedContent = doc.body.innerHTML;
    if (updatedContent !== post?.content) {
      setPost((prev: Post | null) => (prev ? { ...prev, content: updatedContent } : prev));
    }

    console.log('Generated TOC:', tocItems);
    return tocItems;
  }, [post]);

  const handleScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      console.log('Scrolling to:', id);
      const yOffset = -100;
      const yPosition = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: yPosition, behavior: 'smooth' });
    } else {
      console.error('Element not found for ID:', id);
    }
  };

  const handleContentUpdate = async () => {
    if (!contentRef.current || !post || !isAdmin) return; // Guard against non-admins

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
        setPost({ ...post, content: updatedContent });
        console.log('Content updated successfully');
      } else {
        console.error('Failed to update content:', await response.json());
      }
    } catch (error) {
      console.error('Error updating content:', error);
    }
  };

  const makeEditable = (e: React.MouseEvent) => {
    if (!isAdmin) return;
    const target = e.target as HTMLElement;
    console.log('Double-clicked:', target.tagName, 'ID:', target.id);
    if (['H1', 'H2', 'H3', 'H4', 'H5', 'P', 'UL', 'LI'].includes(target.tagName)) {
      target.contentEditable = 'true';
      target.focus();
      target.addEventListener(
        'blur',
        () => {
          console.log('Blur on:', target.tagName, 'ID:', target.id, 'Content:', target.innerHTML);
          target.contentEditable = 'false';
          handleContentUpdate();
        },
        { once: true }
      );
      target.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' && !ev.shiftKey) {
          console.log('Enter pressed on:', target.tagName, 'ID:', target.id);
          ev.preventDefault();
          target.blur();
        }
      });
    }
  };

  if (loading) return <div className="py-32 text-center text-gray-500"><Loading /></div>;
  if (!post || !post.display_this_post) notFound();

  const shouldShowMainContent = (!post.section || post.section !== 'Landing') && post.content?.length > 0;

  return (
    <div className="px-4 sm:pt-4 sm:pb-16">
      {(!post.section || post.section !== 'Landing') ? (
        <div className="grid lg:grid-cols-8 gap-x-4">
          <aside className="lg:col-span-2 space-y-8 pb-8 sm:px-4">
            {toc.length > 0 && (
              <div className="hidden sm:block mt-16 sticky top-32">
                <TOC toc={toc} handleScrollTo={handleScrollTo} />
              </div>
            )}
          </aside>
          <main className="py-16 lg:col-span-4 text-base leading-7 text-gray-900">
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
                <div
                  ref={contentRef}
                  className="prose prose-sm sm:prose lg:prose-xl font-light text-gray-600 table-scroll-container"
                  onDoubleClick={makeEditable}
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </>
            ) : (
              <span></span>
            )}
          </main>
          <aside className="lg:col-span-2"></aside>
        </div>
      ) : (
        <LandingPostContent post={post} />
      )}
    </div>
  );
};

export default PostPage;