'use client';

import React, { useMemo, memo, lazy, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { PostPageSkeleton } from '@/components/PostPage/PostPageSkeleton';
import { OptimizedPostImage } from '@/components/PostPage/OptimizedPostImage';
import { LazyMarkdownRenderer } from '@/components/PostPage/LazyMarkdownRenderer';
import Loading from '@/ui/Loading';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useDocumentSetLogic } from '@/hooks/useDocumentSetLogic';
import { 
  usePostPageTOC, 
  usePostPageVisibility, 
  usePostPageAdmin, 
  usePostPageEffects 
} from './hooks';
import { useReadingProgress } from './hooks/useReadingProgress';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';

// Lazy load PerformanceBudget (admin-only, heavy component)
const PerformanceBudget = lazy(() => import('@/components/PostPage/PerformanceBudget').then(mod => ({ default: mod.PerformanceBudget })));

// Lazy load heavy components for better performance
const PostHeader = lazy(() => import('@/components/PostPage/PostHeader'));
const LandingPostContent = lazy(() => import('@/components/PostPage/LandingPostContent'));
const TOC = lazy(() => import('@/components/PostPage/TOC'));
const CodeBlockCopy = lazy(() => import('@/components/CodeBlockCopy'));
const DocumentSetNavigation = lazy(() => import('@/components/PostPage/DocumentSetNavigation'));
const BottomSheetTOC = lazy(() => import('@/components/PostPage/BottomSheetTOC').then(mod => ({ default: mod.BottomSheetTOC })));
const ReadingProgressBar = lazy(() => import('@/components/PostPage/ReadingProgressBar').then(mod => ({ default: mod.ReadingProgressBar })));
const MasterTOC = lazy(() => import('@/components/PostPage/MasterTOC'));

// Lazy load admin-only components (only loads for admins)
const AdminButtons = lazy(() => import('@/components/PostPage/AdminButtons'));

/**
 * Utility function to get translated content
 * @param defaultContent - The default content (fallback)
 * @param translations - JSONB object with translations
 * @param locale - Current locale
 * @param field - Field name (title, description, content)
 * @returns Translated content or default content
 */
const getTranslatedContent = (
  defaultContent: string | undefined,
  translations: Record<string, { title?: string; description?: string; content?: string }> | undefined,
  locale: string,
  field: 'title' | 'description' | 'content'
): string | undefined => {
  // If no default content, return undefined
  if (!defaultContent) {
    return undefined;
  }

  // List of supported locales
  const supportedLocales = ['en', 'es', 'fr', 'de', 'ru', 'pt', 'it', 'nl', 'pl', 'ja', 'zh'];
  
  // Only consider it a locale if it's exactly 2 characters AND in our supported list
  const isValidLocale = locale && locale.length === 2 && supportedLocales.includes(locale);
  
  // If no valid locale, return default content
  if (!isValidLocale) {
    console.log('Translation: No valid locale provided, using default content');
    return defaultContent;
  }

  // If no translations object exists, return default content
  if (!translations) {
    console.log('Translation: No translations available, using default content');
    return defaultContent;
  }

  // Try to get translation for the current locale
  const localeTranslations = translations[locale];
  
  // If translation exists for locale and field is not empty, use it
  if (localeTranslations && localeTranslations[field] && localeTranslations[field]!.trim() !== '') {
    console.log(`Translation: Found ${field} translation for locale '${locale}', using translated content`);
    return localeTranslations[field];
  }

  // If no translation for current locale, return the original default content
  console.log(`Translation: No ${field} translation found for locale '${locale}', using default content`);
  return defaultContent;
};

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
  translations?: Record<string, { title?: string; description?: string; content?: string }>;
}

interface PostPageClientProps {
  post: Post;
  slug: string;
  locale: string;
}

const PostPageClient: React.FC<PostPageClientProps> = memo(({ post, slug, locale }) => {
  // Apply translations based on locale
  const translatedPost = useMemo(() => ({
    ...post,
    title: getTranslatedContent(post.title, post.translations, locale, 'title'),
    description: getTranslatedContent(post.description, post.translations, locale, 'description'),
    content: getTranslatedContent(post.content, post.translations, locale, 'content'),
  }), [post, locale]);

  // Theme and base URL
  const themeColors = useThemeColors();
  const baseUrl = useMemo(() =>
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    []
  );

  // Custom hooks for organized logic
  const { toc, handleScrollTo, contentRef } = usePostPageTOC(translatedPost);
  const visibility = usePostPageVisibility(translatedPost, toc.length);
  const { isAdmin, isHeaderHovered, setIsHeaderHovered, makeEditable } = usePostPageAdmin(translatedPost, slug, baseUrl);
  const { shouldShowMainContent, shouldShowNoContentMessage } = usePostPageEffects(translatedPost, slug);
  const docSet = useDocumentSetLogic(translatedPost);
  
  // Reading progress tracking (only for default and doc_set posts)
  const showProgress = visibility.postType === 'default' || visibility.postType === 'doc_set';
  const { progress, readingTime, isComplete } = useReadingProgress(
    slug, 
    contentRef
  );

  // Performance monitoring (enabled for admins)
  const performanceVitals = usePerformanceMonitoring(isAdmin);

  // Set data attribute immediately if we can detect landing page from initial post prop
  useEffect(() => {
    // Set immediately based on post.type if available
    if (post?.type === 'landing') {
      document.body.setAttribute('data-landing-page', 'true');
    }
  }, [post?.type]);

  // Set data attribute on body for landing pages to hide header/footer/breadcrumbs
  useEffect(() => {
    if (visibility.isLandingPost) {
      console.log('🎯 Setting data-landing-page attribute');
      document.body.setAttribute('data-landing-page', 'true');
      // Also log the wrapper element
      const wrapper = document.querySelector('.main-content-wrapper');
      console.log('🎯 main-content-wrapper element:', wrapper);
      console.log('🎯 main-content-wrapper computed marginTop:', wrapper ? window.getComputedStyle(wrapper).marginTop : 'not found');
    } else {
      console.log('🎯 Removing data-landing-page attribute');
      document.body.removeAttribute('data-landing-page');
    }
    return () => {
      document.body.removeAttribute('data-landing-page');
    };
  }, [visibility.isLandingPost]);

  if (!translatedPost) {
    // For landing pages, show clean loading instead of skeleton
    if (post?.type === 'landing') {
      return <Loading />;
    }
    return <PostPageSkeleton />;
  }

  // For minimal posts with no header and no content, return empty fragment
  if (visibility.isMinimalPost && !visibility.hasHeaderContent && !translatedPost?.content) {
    return <></>;
  }

  return (
    <main className={visibility.mainPaddingClass}>
      {!visibility.isLandingPost ? (
        // Only render the grid if we have content or need to show the empty message
        (shouldShowMainContent || shouldShowNoContentMessage) ? (
          <div className="grid lg:grid-cols-8 gap-x-4 w-full max-w-full">
            {/* TOC Sidebar - Show Master TOC for document sets, regular TOC otherwise */}
            <aside className={visibility.asidePaddingClass}>
              {visibility.isMounted && visibility.showTOC && (
                <div className={visibility.tocPaddingClass}>
                  <div 
                    className="lg:fixed lg:w-[calc((100vw-1280px)/2+256px)] lg:max-w-[256px] top-24 pr-4 lg:border-r lg:border-gray-100 overflow-y-auto"
                    style={{ maxHeight: visibility.tocMaxHeight }}
                  >
                    {docSet.showMasterTOC ? (
                      <Suspense fallback={<div className="h-96 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />}>
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
                      </Suspense>
                    ) : (
                      <Suspense fallback={<div className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />}>
                        <TOC toc={toc} handleScrollTo={handleScrollTo} />
                      </Suspense>
                    )}
                  </div>
                </div>
              )}
            </aside>

            {/* Main Content */}
            <section className={visibility.sectionPaddingClass}>
              {shouldShowMainContent ? (
                <>
                  {visibility.showPostHeader && visibility.hasHeaderContent && (
                    <div
                      className="relative px-4 sm:px-6 lg:px-0 group"
                    >
                      <Suspense fallback={<div className="h-32 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg mb-8" />}>
                        <PostHeader
                          post={translatedPost}
                          isAdmin={isAdmin}
                          showAdminButtons={isAdmin}
                          minimal={visibility.isMinimalPost}
                        />
                      </Suspense>
                    </div>
                  )}
                  
                  {translatedPost.content && (
                    <article
                      ref={contentRef}
                      className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl font-light text-gray-600 table-scroll-container px-4 sm:px-6 lg:px-0 w-full max-w-full overflow-x-hidden break-words"
                      onDoubleClick={(e) => makeEditable(e, contentRef.current)}
                      style={{
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        maxWidth: '100%',
                      }}
                    >
                      {translatedPost.content_type === 'markdown' ? (
                        <LazyMarkdownRenderer
                          content={translatedPost.content}
                          components={{
                            img: ({node, ...props}) => (
                              <OptimizedPostImage
                                src={props.src}
                                alt={props.alt}
                                className="max-w-full h-auto rounded-lg shadow-sm"
                                style={{maxWidth: '100%', height: 'auto'}}
                              />
                            ),
                            table: ({node, ...props}) => (
                              <div className="overflow-x-auto -mx-4 sm:mx-0">
                                <table {...props} />
                              </div>
                            ),
                            pre: ({node, ...props}) => (
                              <pre {...props} className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-6" />
                            ),
                            p: ({node, children, ...props}) => {
                              // Check if paragraph contains only an image
                              const hasOnlyImage = node?.children?.length === 1 && 
                                node.children[0].type === 'element' && 
                                node.children[0].tagName === 'img';
                              
                              // If paragraph contains only image, render as div to avoid nesting issues
                              if (hasOnlyImage) {
                                return <div {...props} className="break-words my-4">{children}</div>;
                              }
                              
                              return <p {...props} className="break-words" />;
                            },
                          }}
                        />
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: translatedPost.content }} />
                      )}
                    </article>
                  )}
                
                <CodeBlockCopy />
                
                {/* Document Set Navigation - Lazy loaded */}
                {docSet.showMasterTOC && (
                  <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse rounded-lg mt-8" />}>
                    <DocumentSetNavigation
                      currentSlug={post.slug}
                      docSet={docSet.docSetSlug}
                      organizationId={post.organization_id!}
                      isDocSetType={docSet.isDocSetType}
                    />
                  </Suspense>
                )}
                
                {/* Mobile TOC - Below Content */}
                {visibility.isMounted && visibility.showTOC && (
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
                      <Suspense fallback={<div className="h-96 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />}>
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
                      </Suspense>
                    ) : (
                      <Suspense fallback={<div className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />}>
                        <TOC toc={toc} handleScrollTo={handleScrollTo} />
                      </Suspense>
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
          <aside className={visibility.rightSidebarOuterClass}>
            <div className={visibility.rightSidebarInnerClass}>
              {/* TODO: Related articles temporarily disabled */}
            </div>
          </aside>
        </div>
        ) : null
      ) : (translatedPost.content && (
        <div className="relative group landing-page-container">
          {isAdmin && (
            <div className="absolute top-4 right-4 z-50">
              <Suspense fallback={null}>
                <AdminButtons post={post} />
              </Suspense>
            </div>
          )}
          <Suspense fallback={<Loading />}>
            <LandingPostContent post={{ ...translatedPost, content: translatedPost.content }} />
          </Suspense>
        </div>
      ))}

      {/* Reading Progress Bar - Always render Suspense to avoid hydration mismatch */}
      <Suspense fallback={null}>
        {showProgress && (
          <ReadingProgressBar
            progress={progress}
            readingTime={readingTime}
            isComplete={isComplete}
          />
        )}
      </Suspense>

      {/* Bottom Sheet TOC for Mobile - Always render Suspense to avoid hydration mismatch */}
      <Suspense fallback={null}>
        {visibility.showTOC && toc.length > 0 && (
          <BottomSheetTOC
            toc={toc}
            handleScrollTo={handleScrollTo}
            title={docSet.showMasterTOC ? 'Document Navigation' : 'Table of Contents'}
          />
        )}
      </Suspense>

      {/* Performance Budget (Admin Only) */}
      <Suspense fallback={null}>
        <PerformanceBudget enabled={isAdmin} metrics={performanceVitals} />
      </Suspense>
    </main>
  );
});

PostPageClient.displayName = 'PostPageClient';

export default PostPageClient;
