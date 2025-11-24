// sections/MediaSection.tsx - Media and images section

import React from 'react';
import Image from 'next/image';
import { PostFormData } from '../types';
import { PencilIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface MediaSectionProps {
  formData: PostFormData;
  updateField: <K extends keyof PostFormData>(field: K, value: PostFormData[K]) => void;
  onOpenImageGallery: () => void;
}

const Tooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ content, children }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  return (
    <div className="relative inline-flex">
      <div onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
        {children}
      </div>
      {isVisible && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 pointer-events-none w-64">
          <div className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-lg py-2.5 px-3.5 shadow-lg border border-gray-200 dark:border-gray-700">
            {content}
          </div>
        </div>
      )}
    </div>
  );
};

export function MediaSection({ formData, updateField, onOpenImageGallery }: MediaSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Main Photo
          <Tooltip content="Primary image for the post - Click to select from gallery">
            <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
          </Tooltip>
        </label>
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
          <div className="flex items-center justify-between mt-2">
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
  );
}
