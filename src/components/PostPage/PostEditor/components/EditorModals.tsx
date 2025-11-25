'use client';

import React from 'react';
import ImageGalleryModal from '@/components/modals/ImageGalleryModal';
import LinkModal from '../ui/LinkModal';
import Button from '@/ui/Button';
import type { UnsplashAttribution } from '@/components/modals/ImageGalleryModal/UnsplashImageSearch';
import type { PexelsAttributionData } from '@/components/MediaAttribution';
import type { CarouselMediaItem } from '../types';

interface EditorModalsProps {
  showImageGallery: boolean;
  showVideoGallery: boolean;
  showCarouselGallery: boolean;
  showCarouselImagePicker: boolean;
  showLinkModal: boolean;
  showContentTypeModal: boolean;
  carouselMediaItems: CarouselMediaItem[];
  currentLinkUrl: string;
  initialContentType: string;
  pendingContentType: string | null;
  themeColors: any;
  setShowImageGallery: (value: boolean) => void;
  setShowVideoGallery: (value: boolean) => void;
  setShowCarouselGallery: (value: boolean) => void;
  setShowCarouselImagePicker: (value: boolean) => void;
  setShowLinkModal: (value: boolean) => void;
  setCarouselMediaItems: (items: CarouselMediaItem[]) => void;
  handleImageSelect: (url: string, attribution?: UnsplashAttribution | PexelsAttributionData, isVideo?: boolean, videoData?: any) => void;
  handleVideoSelect: (url: string, attribution?: UnsplashAttribution | PexelsAttributionData, isVideo?: boolean, videoData?: any) => void;
  handleCarouselMediaSelect: (url: string, attribution?: UnsplashAttribution | PexelsAttributionData, isVideo?: boolean, videoData?: any) => void;
  handleLinkSave: (url: string) => void;
  handleUnlink: () => void;
  removeCarouselMediaItem: (index: number) => void;
  finishCarouselCreation: () => void;
  cancelContentTypeChange: () => void;
  confirmContentTypeChange: () => void;
}

export const EditorModals: React.FC<EditorModalsProps> = ({
  showImageGallery,
  showVideoGallery,
  showCarouselGallery,
  showCarouselImagePicker,
  showLinkModal,
  showContentTypeModal,
  carouselMediaItems,
  currentLinkUrl,
  initialContentType,
  pendingContentType,
  themeColors,
  setShowImageGallery,
  setShowVideoGallery,
  setShowCarouselGallery,
  setShowCarouselImagePicker,
  setShowLinkModal,
  setCarouselMediaItems,
  handleImageSelect,
  handleVideoSelect,
  handleCarouselMediaSelect,
  handleLinkSave,
  handleUnlink,
  removeCarouselMediaItem,
  finishCarouselCreation,
  cancelContentTypeChange,
  confirmContentTypeChange,
}) => {
  return (
    <>
      {/* Image Gallery Modal */}
      <ImageGalleryModal
        isOpen={showImageGallery}
        onClose={() => setShowImageGallery(false)}
        onSelectImage={handleImageSelect}
      />

      {/* Video Gallery Modal */}
      <ImageGalleryModal
        isOpen={showVideoGallery}
        onClose={() => setShowVideoGallery(false)}
        onSelectImage={handleVideoSelect}
        defaultTab="videos"
      />

      {/* Media Carousel Builder Modal */}
      {showCarouselGallery && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Build Media Carousel ({carouselMediaItems.length} items)
              </h3>
              <button
                onClick={() => {
                  setShowCarouselGallery(false);
                  setCarouselMediaItems([]);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Selected Media Preview */}
              {carouselMediaItems.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Selected Media:
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {carouselMediaItems.map((item, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                          {item.type === 'image' ? (
                            <img src={item.url} alt={`Item ${index + 1}`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeCarouselMediaItem(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Media Button */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {carouselMediaItems.length === 0 
                    ? 'Add media items to your carousel' 
                    : 'Add more items or finish creating carousel'}
                </p>
                <Button
                  variant="primary"
                  onClick={() => setShowCarouselImagePicker(true)}
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${themeColors.cssVars.primary.base}, ${themeColors.cssVars.primary.light})`
                  }}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Media to Carousel
                </Button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCarouselGallery(false);
                  setCarouselMediaItems([]);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={finishCarouselCreation}
                disabled={carouselMediaItems.length === 0}
                style={{
                  backgroundImage: carouselMediaItems.length > 0 
                    ? `linear-gradient(135deg, ${themeColors.cssVars.primary.base}, ${themeColors.cssVars.primary.light})`
                    : undefined
                }}
              >
                Insert Carousel ({carouselMediaItems.length} items)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Carousel Image Picker Modal - Separate from builder */}
      <ImageGalleryModal
        isOpen={showCarouselImagePicker}
        onClose={() => setShowCarouselImagePicker(false)}
        onSelectImage={handleCarouselMediaSelect}
      />

      {/* Link Modal */}
      <LinkModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onSave={handleLinkSave}
        onUnlink={handleUnlink}
        initialUrl={currentLinkUrl}
        hasExistingLink={!!currentLinkUrl}
      />

      {/* Content Type Change Confirmation Modal */}
      {showContentTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  Change Content Type?
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  You are about to change the content type from <strong>{(initialContentType || 'html').toUpperCase()}</strong> to <strong>{pendingContentType?.toUpperCase()}</strong>.
                </p>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-amber-900 mb-2">⚠️ Important Warning</h4>
              <ul className="text-sm text-amber-800 space-y-1.5">
                <li>• This change may affect how your content is displayed</li>
                <li>• Some formatting or styling may be lost during conversion</li>
                <li>• Make sure to review your content after switching</li>
                <li>• Consider saving a backup before proceeding</li>
              </ul>
            </div>

            {/* Additional Info */}
            <div className="text-xs text-gray-500 bg-gray-50 rounded p-3">
              <strong>What happens:</strong>
              {pendingContentType === 'markdown' ? (
                <p className="mt-1">HTML will be converted to Markdown format. Complex HTML structures, inline styles, and custom classes may be simplified or removed.</p>
              ) : (
                <p className="mt-1">Markdown will be converted to HTML format. Basic markdown syntax will be preserved, but you'll have more formatting options available.</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                onClick={cancelContentTypeChange}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmContentTypeChange}
                variant="primary"
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Proceed with Change
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
