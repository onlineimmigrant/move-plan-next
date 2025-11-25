// preview/PostPreview.tsx - Live preview component

import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { PostFormData } from '../types';
import { MediaCarouselRenderer } from '@/components/PostPage/PostEditor/ui/MediaCarouselRenderer';

interface PostPreviewProps {
  formData: PostFormData;
  onDoubleClickTitle: (e: React.MouseEvent) => void;
  onDoubleClickDescription: (e: React.MouseEvent) => void;
}

export function PostPreview({
  formData,
  onDoubleClickTitle,
  onDoubleClickDescription,
}: PostPreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Process carousel elements after render
  useEffect(() => {
    if (!contentRef.current || !formData.content) return;

    console.log('🔍 [Preview] Searching for carousel elements...');
    const carouselElements = contentRef.current.querySelectorAll(
      '[data-type="media-carousel"]'
    );
    console.log('🔍 [Preview] Found carousel elements:', carouselElements.length);

    const roots: any[] = [];

    carouselElements.forEach((element, index) => {
      const mediaItemsData = element.getAttribute('data-media-items');
      const align = element.getAttribute('data-align') as 'left' | 'center' | 'right' || 'center';
      const width = element.getAttribute('data-width') || '600px';
      
      console.log(`🎠 [Preview] Processing carousel ${index}:`, { mediaItemsData, align, width });

      if (mediaItemsData) {
        try {
          const mediaItems = JSON.parse(mediaItemsData);
          console.log('🎠 [Preview] Parsed media items:', mediaItems);
          
          // Create a container for the React component
          const container = document.createElement('div');
          element.parentNode?.replaceChild(container, element);
          
          console.log('🎠 [Preview] Rendering MediaCarouselRenderer...');
          // Render the carousel component
          const root = ReactDOM.createRoot(container);
          root.render(
            <MediaCarouselRenderer
              mediaItems={mediaItems}
              align={align}
              width={width}
            />
          );
          roots.push(root);
        } catch (error) {
          console.error('❌ [Preview] Failed to parse carousel data:', error);
        }
      }
    });

    // Cleanup
    return () => {
      roots.forEach(root => {
        try {
          root.unmount();
        } catch (e) {
          // Ignore unmount errors
        }
      });
    };
  }, [formData.content]);

  return (
    <div className="w-full min-h-[400px]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Subsection */}
        {formData.subsection && formData.section !== 'Landing' && (
          <div className="mb-4">
            <span className="text-xs font-medium tracking-widest uppercase text-blue-600 dark:text-blue-400">
              {formData.subsection}
            </span>
          </div>
        )}

        {/* Title */}
        <h1
          className="text-4xl font-bold mb-4 cursor-pointer hover:ring-2 hover:ring-blue-500 dark:hover:ring-blue-400 
                   rounded px-2 py-1 transition-all text-gray-900 dark:text-white"
          onDoubleClick={onDoubleClickTitle}
          title="Double-click to edit"
        >
          {formData.title || 'Untitled Post'}
        </h1>

        {/* Description */}
        <p
          className="text-xl text-gray-600 dark:text-gray-400 mb-8 cursor-pointer hover:ring-2 hover:ring-blue-500 
                   dark:hover:ring-blue-400 rounded px-2 py-1 transition-all"
          onDoubleClick={onDoubleClickDescription}
          title="Double-click to edit"
        >
          {formData.description || 'No description'}
        </p>

        {/* Meta info */}
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
          {formData.authorName && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{formData.authorName}</span>
            </div>
          )}
          {formData.createdOn && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{new Date(formData.createdOn).toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-medium">
              {formData.postType}
            </span>
          </div>
        </div>

        {/* Main Photo */}
        {formData.mainPhoto && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={formData.mainPhoto}
              alt="Main photo"
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Content Preview */}
        <div
          ref={contentRef}
          className="prose dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white 
                   prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-blue-600 dark:prose-a:text-blue-400"
          dangerouslySetInnerHTML={{ __html: formData.content || '<p class="text-gray-400 italic">No content yet...</p>' }}
        />
      </div>
    </div>
  );
}
