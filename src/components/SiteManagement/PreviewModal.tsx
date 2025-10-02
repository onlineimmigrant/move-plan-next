import React, { useState } from 'react';
import { XMarkIcon, ArrowTopRightOnSquareIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Organization } from './types';

interface PreviewModalProps {
  isOpen: boolean;
  organization: Organization | null;
  onClose: () => void;
  onOpenFull?: () => void; // Optional callback to open full EditModal
  isSample?: boolean;
}

export default function PreviewModal({ 
  isOpen, 
  organization, 
  onClose, 
  onOpenFull,
  isSample = false 
}: PreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Handle Escape key to close modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !organization) return null;

  const previewUrl = organization.base_url || organization.base_url_local || '';

  const handleIframeLoad = () => {
    setIsLoading(false);
    setLoadError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setLoadError(true);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <EyeIcon className="w-5 h-5 text-sky-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                {isSample ? 'Sample Preview' : 'Site Preview'}
              </h2>
            </div>
            {isSample && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                Sample
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Site Info */}
            <div className="text-right mr-4">
              <h3 className="font-medium text-gray-900">{organization.name}</h3>
              <p className="text-sm text-gray-500 capitalize">{organization.type}</p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all duration-200"
                  title="Open in new tab"
                >
                  <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                </a>
              )}
              
              {onOpenFull && (
                <button
                  onClick={onOpenFull}
                  className="px-3 py-2 text-sm font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-all duration-200"
                >
                  {isSample ? 'Explore' : 'Edit'}
                </button>
              )}
              
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative bg-gray-100">
          {previewUrl ? (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white">
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto mb-4 rounded-full border-4 border-sky-200 border-t-sky-600 animate-spin"></div>
                    <p className="text-gray-600">Loading preview...</p>
                  </div>
                </div>
              )}
              
              {loadError && (
                <div className="absolute inset-0 flex items-center justify-center bg-white">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                      <XMarkIcon className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Preview Unavailable</h3>
                    <p className="text-gray-600 mb-4">Unable to load the site preview.</p>
                    {previewUrl && (
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-all duration-200"
                      >
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        Open in New Tab
                      </a>
                    )}
                  </div>
                </div>
              )}
              
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title={`Preview of ${organization.name}`}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <EyeIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Preview Available</h3>
                <p className="text-gray-600">This site doesn't have a preview URL configured.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600">
              {previewUrl ? (
                <span>Previewing: <code className="bg-white px-2 py-1 rounded text-xs">{previewUrl}</code></span>
              ) : (
                <span>No URL available for preview</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs">Esc</kbd>
              <span>to close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}