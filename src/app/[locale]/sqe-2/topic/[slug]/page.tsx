'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';

import PostHeader from '@/components/PostPage/PostHeader';
import LandingPostContent from '@/components/PostPage/LandingPostContent';
import TOC from '@/components/PostPage/TOC';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Button from '@/ui/Button';
import RightArrowDynamic from '@/ui/RightArrowDynamic';
import LeftArrowDynamic from '@/ui/LeftArrowDynamic';
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
  id: number;
  title: string;
  slug: string;
  content: string;
  description: string;
  display_this_post?: boolean;
  display_as_blog_post?: boolean;
  main_photo?: string | null;
  order?: number | null;
  section_id: string;
  subsection: string;
  is_with_author: boolean;
  is_company_author: boolean;
  faq_section_is_title?: boolean;
  author?: { first_name: string; last_name: string };
  author_id?: number | null;
  cta_card_one_id?: number | null;
  cta_card_two_id?: number | null;
  cta_card_three_id?: number | null;
  cta_card_four_id?: number | null;
  product_1_id?: number | null;
  product_2_id?: number | null;
  created_on: string;
  organization_id?: string;
  faqs?: { question: string; answer: string }[];
  reviews?: { rating: number; author: string; comment: string }[]; // Added reviews property
}

interface AdjacentPost {
  slug: string;
  title: string;
}

const PostPage: React.FC<{ params: Promise<{ slug: string }> }> = ({ params }) => {
  const { slug } = React.use(params);
  const [post, setPost] = useState<Post | null>(null);
  const [prevPost, setPrevPost] = useState<AdjacentPost | null>(null);
  const [nextPost, setNextPost] = useState<AdjacentPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isHeaderHovered, setHeaderHovered] = useState(false);
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

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      console.log('Fetching post for slug:', slug);
      try {
        const organizationId = await getOrganizationId(baseUrl);
        if (!organizationId) {
          throw new Error('Organization not found');
        }

        const response = await fetch(`/api/sqe-2/topic/${slug}?organization_id=${organizationId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched post:', data);
          const postUrl = getPostUrl({ section_id: data.section_id, slug });
          if (postUrl !== `/sqe-2/topic/${slug}`) {
            redirect(postUrl);
          }
          setPost({
            ...data,
            section_id: data.section_id || 'Criminal Litigation',
            subsection: data.subsection || '',
            description: data.description || '',
            created_on: data.created_on || new Date().toISOString(),
            is_with_author: data.is_with_author ?? false,
            is_company_author: data.is_company_author ?? false,
            author: data.author || undefined,
            organization_id: data.organization_id || organizationId,
            faqs: data.faqs || [],
            reviews: data.reviews || [], // Ensure reviews is included
          });
        } else {
          console.error('Post fetch failed:', response.status, await response.text());
          notFound();
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug, baseUrl]);

  // Fetch adjacent posts
  useEffect(() => {
    const fetchAdjacentPosts = async () => {
      if (!post?.section_id || post?.order === undefined || post?.order === null || !post?.organization_id) {
        console.log('Skipping adjacent posts fetch: missing section_id, order, or organization_id', {
          section_id: post?.section_id,
          order: post?.order,
          organization_id: post?.organization_id,
        });
        return;
      }

      console.log('Fetching posts for section:', post.section_id, 'organization_id:', post.organization_id);

      try {
        const response = await fetch(
          `/api/sqe-2/topics?section_id=${encodeURIComponent(post.section_id)}&organization_id=${post.organization_id}&limit=100`
        );
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched posts response:', data);

          const posts = data.posts
            .filter((p: Post) => p.order !== null && Number.isInteger(p.order))
            .sort((a: Post, b: Post) => (a.order || 0) - (b.order || 0));

          const currentIndex = posts.findIndex((p: Post) => p.order === post.order && p.slug === post.slug);

          console.log('Posts:', posts, 'Current index:', currentIndex);

          setPrevPost(
            currentIndex > 0 ? { slug: posts[currentIndex - 1].slug, title: posts[currentIndex - 1].title } : null
          );
          setNextPost(
            currentIndex < posts.length - 1
              ? { slug: posts[currentIndex + 1].slug, title: posts[currentIndex + 1].title }
              : null
          );
        } else {
          console.error('Failed to fetch posts:', response.status, await response.text());
        }
      } catch (error) {
        console.error('Error fetching adjacent posts:', error);
      }
    };

    fetchAdjacentPosts();
  }, [post?.section_id, post?.order, post?.slug, post?.organization_id]);

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
      setPost((prev) => (prev ? { ...prev, content: updatedContent } : prev));
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
    if (!contentRef.current || !post || !isAdmin) return;

    const updatedContent = contentRef.current.innerHTML;
    console.log('Original content:', post.content);
    console.log('Updated content:', updatedContent);

    try {
      const organizationId = await getOrganizationId(baseUrl);
      if (!organizationId) {
        throw new Error('Organization not found');
      }

      const response = await fetch(`/api/sqe-2/topic/${slug}`, {
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

  const shouldShowMainContent = post.section_id !== 'Landing' && post.content?.length > 0;

  return (
    <div className="post-page-container px-4 sm:pt-4 sm:pb-16">
      {post.section_id !== 'Landing' ? (
        <div className="grid lg:grid-cols-8 gap-x-4">
          <aside className="lg:col-span-2 space-y-8 pb-8 sm:px-4">
            {toc.length > 0 && (
              <div className="hidden sm:block mt-16 sticky top-32">
                <TOC toc={toc} handleScrollTo={handleScrollTo} />
              </div>
            )}
          </aside>
          <main className="pb-8 sm:pb-12 lg:py-8 lg:col-span-4 text-base leading-7 text-gray-900">
            {shouldShowMainContent ? (
              <>
                <div
                  onMouseEnter={() => setHeaderHovered(true)}
                  onMouseLeave={() => setHeaderHovered(false)}
                  className="relative"
                >
                  <PostHeader
                    post={{
                      section: post.section_id,
                      subsection: post.subsection,
                      title: post.title,
                      created_on: post.created_on,
                      is_with_author: post.is_with_author,
                      is_company_author: post.is_company_author,
                      author: post.author,
                      description: post.description,
                    }}
                    isAdmin={isAdmin}
                    showAdminButtons={isHeaderHovered}
                  />
                  {post.main_photo && (
                    <div className="max-w-xl mx-auto mt-16 lg:mt-16">
                      <img className="w-full" src={post.main_photo} alt={post.title} />
                    </div>
                  )}
                </div>
                <div
                  ref={contentRef}
                  className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl font-light text-gray-600"
                  onDoubleClick={makeEditable}
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </>
            ) : (
              <span></span>
            )}
            {/* Pagination Navigation */}
            <div className="flex justify-between items-start mt-12 border-t border-gray-200 pt-6 space-x-4">
              <div className="flex flex-col items-start space-y-2 group">
                {prevPost ? (
                  <Button
                    variant="primary"
                    className="px-6 py-2 flex items-center"
                    aria-label={`Go to previous post: ${prevPost.title}`}
                  >
                    <Link href={`/sqe-2/topic/${prevPost.slug}`} className="flex items-center">
                      <LeftArrowDynamic />
                      Prev
                    </Link>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="cursor-not-allowed"
                    disabled
                    aria-label="No previous post available"
                  >
                    <LeftArrowDynamic className="text-gray-400" />
                    Prev
                  </Button>
                )}
                {prevPost && (
                  <span className="text-base font-light text-gray-400 line-clamp-2">
                    {prevPost.title}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end space-y-2 group">
                {nextPost ? (
                  <Button
                    variant="primary"
                    className="px-6 py-2 flex items-center"
                    aria-label={`Go to next post: ${nextPost.title}`}
                  >
                    <Link href={`/sqe-2/topic/${nextPost.slug}`} className="flex items-center">
                      Next
                      <RightArrowDynamic />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="cursor-not-allowed flex items-center"
                    disabled
                    aria-label="No next post available"
                  >
                    Next
                    <RightArrowDynamic className="text-gray-400" />
                  </Button>
                )}
                {nextPost && (
                  <span className="text-base font-light text-gray-400 line-clamp-2 text-right">
                    {nextPost.title}
                  </span>
                )}
              </div>
            </div>
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