'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import PostHeader from '@/components/PostPage/PostHeader';
import LandingPostContent from '@/components/PostPage/LandingPostContent';
import TOC from '@/components/PostPage/TOC';
import { notFound, redirect } from 'next/navigation';
import '@/components/PostEditor.css';
import { getPostUrl } from '@/lib/postUtils';
import { useSEO } from '@/context/SEOContext';

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
  section?: string; // Made optional to handle undefined/null
  subsection: string;
  created_on: string;
  is_with_author: boolean;
  is_company_author: boolean;
  author?: { first_name: string; last_name: string };
  excerpt?: string;
  featured_image?: string;
  keywords?: string;
  section_id?: number | null;
  last_modified: string;
  display_this_post: boolean;
  reviews?: { rating: number; author: string; comment: string }[];
  faqs?: { question: string; answer: string }[];
}

const PostPage: React.FC<{ params: Promise<{ slug: string }> }> = ({ params }) => {
  const { slug } = React.use(params);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(true); // Replace with real admin check later
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { setSEOData } = useSEO();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const activeLanguages = ['en', 'es', 'fr'];

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
        const response = await fetch(`/api/posts/${slug}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched post:', data); // Debug log
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
  }, [slug]);

  // Set SEO data
  useEffect(() => {
    if (!post) return;

    const postUrl = `${baseUrl}${getPostUrl({ section_id: post.section_id, slug: post.slug })}`;
    setSEOData({
      title: post.title || 'Default Title',
      description: post.description || post.excerpt || 'Default description for the post.',
      keywords: post.keywords || 'default, keywords',
      image: post.featured_image || undefined,
      canonicalUrl: postUrl,
      noindex: !post.display_this_post,
      faqs: post.faqs || [],
      hreflang: activeLanguages.map((lang) => ({
        href: `${baseUrl}/${lang}${getPostUrl({ section_id: post.section_id, slug: post.slug })}`,
        hreflang: lang,
      })),
      structuredData: [
        // Article Schema
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title || 'Default Title',
          description: post.description || post.excerpt || 'Default description',
          image: post.featured_image || '/default-og-image.jpg',
          datePublished: post.created_on || post.last_modified || new Date().toISOString(),
          dateModified: post.last_modified || new Date().toISOString(),
          author: post.is_with_author
            ? post.is_company_author
              ? {
                  '@type': 'Organization',
                  name: 'Your Site Name',
                }
              : {
                  '@type': 'Person',
                  name: post.author
                    ? `${post.author.first_name} ${post.author.last_name}`
                    : 'Unknown Author',
                }
            : {
                '@type': 'Organization',
                name: 'Your Site Name',
              },
          publisher: {
            '@type': 'Organization',
            name: 'Your Site Name',
            logo: {
              '@type': 'ImageObject',
              url: `${baseUrl}/images/logo.svg`,
            },
          },
          url: postUrl,
        },
        // BreadcrumbList Schema
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: `${baseUrl}/`,
            },
            ...(post.section
              ? [
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: post.section,
                    item:
                      post.subsection === 'SQE2'
                        ? `${baseUrl}/sqe-2/specification`
                        : `${baseUrl}/${post.section.toLowerCase()}`,
                  },
                ]
              : []),
            {
              '@type': 'ListItem',
              position: post.section ? 3 : 2,
              name: post.subsection,
              item:
                post.subsection === 'SQE2'
                  ? `${baseUrl}/sqe-2/specification`
                  : `${baseUrl}/${post.subsection.toLowerCase()}`,
            },
            {
              '@type': 'ListItem',
              position: post.section ? 4 : 3,
              name: post.title,
              item: postUrl,
            },
          ],
        },
        // Review Schema (if reviews exist)
        ...(post.reviews?.length
          ? [
              {
                '@context': 'https://schema.org',
                '@type': 'Review',
                reviewRating: {
                  '@type': 'Rating',
                  ratingValue: post.reviews[0].rating,
                  bestRating: 5,
                },
                author: {
                  '@type': 'Person',
                  name: post.reviews[0].author,
                },
                reviewBody: post.reviews[0].comment,
                itemReviewed: {
                  '@type': 'Article',
                  headline: post.title,
                  url: postUrl,
                },
              },
            ]
          : []),
      ],
    });

    // Cleanup on unmount
    return () => setSEOData(null);
  }, [post, setSEOData, baseUrl, slug]);

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
    if (!contentRef.current || !post) return;

    const updatedContent = contentRef.current.innerHTML;

    try {
      const response = await fetch(`/api/posts/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: updatedContent }),
      });

      if (response.ok) {
        setPost({ ...post, content: updatedContent });
      } else {
        console.error('Failed to update content:', await response.json());
      }
    } catch (error) {
      console.error('Error updating content:', error);
    }
  };

  const handlePostHeaderClick = (href: string) => {
    window.location.href = href;
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

  if (loading) return <div className="py-32 text-center text-gray-500">Loading...</div>;
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
          <main className="my-8 lg:col-span-4 text-base leading-7 text-gray-900">
            {shouldShowMainContent ? (
              <>
                <div
                  onMouseEnter={() => setIsHeaderHovered(true)}
                  onMouseLeave={() => setIsHeaderHovered(false)}
                  className="relative"
                >
                  <PostHeader
                    post={{
                      section: post.section || 'Section', // Fallback for PostHeader
                      subsection: post.subsection,
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