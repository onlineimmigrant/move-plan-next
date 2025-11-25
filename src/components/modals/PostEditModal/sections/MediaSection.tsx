// sections/MediaSection.tsx - Media section following Shop modal pattern

import React from 'react';
import Image from 'next/image';
import { PostFormData } from '../types';
import { PencilIcon } from '@heroicons/react/24/outline';
import PostMediaCarousel, { PostMediaCarouselHandle } from '@/components/PostMediaCarousel';

interface MediaSectionProps {
  formData: PostFormData;
  updateField: <K extends keyof PostFormData>(field: K, value: PostFormData[K]) => void;
  onOpenImageGallery: () => void;
  onOpenMediaGallery?: () => void;
  postSlug?: string;
  carouselRef?: React.RefObject<PostMediaCarouselHandle>;
}

export function MediaSection({ 
  formData, 
  updateField, 
  onOpenImageGallery, 
  onOpenMediaGallery,
  postSlug,
  carouselRef 
}: MediaSectionProps) {
  const isEditMode = postSlug !== undefined;

  return (
    <div className="grid gap-6 grid-cols-1">
      {/* Main Photo Section */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          Main Photo
        </h3>
        <div className="space-y-3">
          <div
            className="relative w-full h-48 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed 
                     border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 
                     transition-colors cursor-pointer group overflow-hidden flex items-center justify-center"
            onClick={onOpenImageGallery}
          >
            {formData.mainPhoto ? (
              <>
                <div className="relative h-full max-w-full flex items-center justify-center">
                  <Image
                    src={formData.mainPhoto}
                    alt="Main photo"
                    width={0}
                    height={0}
                    sizes="100vw"
                    style={{ width: 'auto', height: '100%', maxWidth: '100%' }}
                    className="object-contain rounded-lg"
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                  <PencilIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 group-hover:text-purple-600 transition-colors">
                <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <p className="text-sm font-medium">Click to select image</p>
                <p className="text-xs text-gray-400 mt-1">Choose from gallery</p>
              </div>
            )}
          </div>
          {formData.mainPhoto && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1 mr-2" title={formData.mainPhoto}>
                {formData.mainPhoto}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateField('mainPhoto', '');
                  updateField('mediaConfig', {});
                }}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Media Carousel Section - Only show when editing existing post */}
      {isEditMode && postSlug && carouselRef && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Media
            </h3>
            <button
              type="button"
              onClick={onOpenMediaGallery || (() => console.warn('⚠️ onOpenMediaGallery not provided'))}
              className="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              +Add
            </button>
          </div>
          <PostMediaCarousel
            ref={carouselRef}
            postSlug={postSlug}
            onAddMedia={() => {}}
          />
        </div>
      )}
    </div>
  );
}
