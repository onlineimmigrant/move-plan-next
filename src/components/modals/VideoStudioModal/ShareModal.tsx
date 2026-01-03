/**
 * ShareModal Component
 * 
 * Generate shareable links and embed codes for exported videos.
 */

'use client';

import React, { useState } from 'react';
import { XMarkIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

interface ShareModalProps {
  videoUrl: string;
  title?: string;
  onClose: () => void;
}

export default function ShareModal({ videoUrl, title, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const embedCode = `<iframe src="${videoUrl}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;
  
  const responsiveEmbedCode = `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;">
  <iframe src="${videoUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0" allowfullscreen></iframe>
</div>`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Share Video
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Video URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Direct Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={videoUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono"
              />
              <button
                onClick={() => handleCopy(videoUrl, 'url')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {copied === 'url' ? (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Embed Code */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Embed Code (Fixed Size)
            </label>
            <div className="space-y-2">
              <textarea
                value={embedCode}
                readOnly
                rows={3}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono resize-none"
              />
              <button
                onClick={() => handleCopy(embedCode, 'embed')}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {copied === 'embed' ? (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon className="w-4 h-4" />
                    Copy Embed Code
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Responsive Embed Code */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Responsive Embed Code
            </label>
            <div className="space-y-2">
              <textarea
                value={responsiveEmbedCode}
                readOnly
                rows={5}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono resize-none"
              />
              <button
                onClick={() => handleCopy(responsiveEmbedCode, 'responsive')}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {copied === 'responsive' ? (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon className="w-4 h-4" />
                    Copy Responsive Code
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Preview
            </label>
            <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video">
              <video
                src={videoUrl}
                controls
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Download Button */}
          <a
            href={videoUrl}
            download={title || 'video'}
            className="block w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white text-center rounded-lg transition-colors font-medium"
          >
            Download Video
          </a>
        </div>
      </div>
    </div>
  );
}
