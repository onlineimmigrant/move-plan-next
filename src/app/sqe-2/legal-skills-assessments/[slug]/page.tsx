// app/sqe-2/practice-area/[slug]/page.tsx
'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useSettings } from '@/context/SettingsContext';
import PostHeader from '@/components/PostPage/PostHeader';
import LandingPostContent from '@/components/PostPage/LandingPostContent';
import TOC from '@/components/PostPage/TOC';
import Breadcrumbs from '@/components/Breadcrumbs';
import { notFound } from 'next/navigation';

interface TOCItem {
  tag_name: string;
  tag_text: string;
  tag_id: string;
}

const PostPage: React.FC<{ params: Promise<{ slug: string }> }> = ({ params }) => {
  const { slug } = React.use(params);
  const { settings } = useSettings();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(true); // Replace with real admin check later
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/sqe-2/legal-skills-assessments/${slug}`); // Updated API route
        if (response.ok) {
          const data = await response.json();
          setPost(data);
        } else if (response.status === 404 || response.status === 403) {
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
      setPost((prev: any) => (prev ? { ...prev, content: updatedContent } : prev));
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
    console.log('Original content:', post.content);
    console.log('Updated content:', updatedContent);

    try {
      const response = await fetch(`/api/sqe-2/legal-skills-assessments/${slug}`, { // Updated API route
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
  if (!post) notFound();

  const shouldShowMainContent = post.section !== 'Landing' && post.content?.length > 0;
  const path = `/sqe-2/legal-skills-assessments/${post.slug}`;

  return (
    <div className="post-page-container px-4 sm:pt-4 sm:pb-16">
      {post.section !== 'Landing' ? (
        <div className="grid lg:grid-cols-8 gap-x-4">
          <aside className="lg:col-span-2 space-y-8 pb-8 sm:px-4">
            {toc.length > 0 && (
              <div className="hidden sm:block mt-16 sticky top-32">
                <TOC toc={toc} handleScrollTo={handleScrollTo} />
              </div>
            )}
          </aside>
          <main className="mt-24 lg:col-span-4 text-base leading-7 text-gray-900">
            {shouldShowMainContent ? (
              <>
                <div
                  onMouseEnter={() => setIsHeaderHovered(true)}
                  onMouseEnter={() => setIsHeaderHovered(true)}
                  onMouseLeave={() => setIsHeaderHovered(false)}
                  className="relative"
                >
                  <PostHeader
                    post={post}
                    isAdmin={isAdmin}
                    showMenu={isHeaderHovered}
                    editHref={`/admin/edit/${slug}`}
                    createHref="/admin/create-post"
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
          </main>
          <aside className="lg:col-span-2"></aside> {/* Empty right column */}
        </div>
      ) : (
        <LandingPostContent post={post} />
      )}
    </div>
  );
};

export default PostPage;