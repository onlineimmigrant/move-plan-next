import React, { useEffect, useState } from 'react';
import { ComputerDesktopIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { Settings } from './types';

interface LivePreviewProps {
  settings: Settings;
  organizationUrl?: string;
  previewMode?: 'desktop' | 'mobile';
  onPreviewModeChange?: (mode: 'desktop' | 'mobile') => void;
}

export default function LivePreview({ 
  settings, 
  organizationUrl, 
  previewMode = 'desktop', 
  onPreviewModeChange 
}: LivePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (organizationUrl) {
      // Add preview parameters to the URL to show the changes
      const url = new URL(organizationUrl);
      url.searchParams.set('preview', 'true');
      
      // Add settings as preview parameters
      if (settings.primary_color) {
        url.searchParams.set('preview_primary_color', settings.primary_color);
      }
      if (settings.secondary_color) {
        url.searchParams.set('preview_secondary_color', settings.secondary_color);
      }
      if (settings.header_style) {
        url.searchParams.set('preview_header_style', settings.header_style);
      }
      if (settings.footer_color) {
        url.searchParams.set('preview_footer_color', settings.footer_color);
      }
      if (settings.site) {
        url.searchParams.set('preview_site_title', settings.site);
      }
      if (settings.image) {
        url.searchParams.set('preview_logo_url', settings.image);
      }
      if (settings.menu_width) {
        url.searchParams.set('preview_menu_width', settings.menu_width);
      }
      if (settings.font_family) {
        url.searchParams.set('preview_font_family', settings.font_family);
      }
      
      setPreviewUrl(url.toString());
    } else {
      setPreviewUrl('');
    }
  }, [settings, organizationUrl]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  if (!organizationUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Live Preview</h3>
          <p className="text-gray-600">
            No website URL available for preview.
            <br />
            Add a website URL to see live changes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-100 pb-8 ">
      {/* Preview Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        {/* Wide Layout - Single Row */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="flex space-x-1 flex-shrink-0">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-mono truncate min-w-0">
              {organizationUrl}
            </div>
            {/* Mode Information - Wide Layout */}
            <div className="flex items-center space-x-1 text-xs text-gray-600 border-l border-gray-200 pl-3">

            </div>
          </div>
          <div className="flex items-center space-x-3 flex-shrink-0">
                        {isLoading && (
              <span className="text-xs text-gray-500">Loading...</span>
            )}
            {/* Preview Mode Toggle - Wide Layout */}
            {onPreviewModeChange && (
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => onPreviewModeChange('desktop')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                    previewMode === 'desktop'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  title="Desktop Preview (Maximize preview)"
                >
                  <ComputerDesktopIcon className="w-4 h-4" />
                  <span>Desktop</span>
                </button>
                <button
                  onClick={() => onPreviewModeChange('mobile')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                    previewMode === 'mobile'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  title="Mobile Preview (Maximize settings)"
                >
                  <DevicePhoneMobileIcon className="w-4 h-4" />
                  <span>Mobile</span>
                </button>
              </div>
            )}


          </div>
        </div>

        {/* Narrow Layout - Two Rows */}
        <div className="lg:hidden">
          {/* First Row - Browser Controls and URL */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="flex space-x-1 flex-shrink-0">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-mono truncate min-w-0">
                {organizationUrl}
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">

              {isLoading && (
                <span className="text-xs text-gray-500 hidden sm:inline">Loading...</span>
              )}
            </div>
          </div>
          
          {/* Second Row - Preview Mode Toggle and Status */}
          <div className="hidden items-center justify-between">
            {/* Preview Mode Toggle */}
            {onPreviewModeChange ? (
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => onPreviewModeChange('desktop')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                    previewMode === 'desktop'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  title="Desktop Preview (Maximize preview)"
                >
                  <ComputerDesktopIcon className="w-4 h-4" />
                  <span className="hidden md:inline">Desktop</span>
                </button>
                <button
                  onClick={() => onPreviewModeChange('mobile')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                    previewMode === 'mobile'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  title="Mobile Preview (Maximize settings)"
                >
                  <DevicePhoneMobileIcon className="w-4 h-4" />
                  <span className="hidden md:inline">Mobile</span>
                </button>
              </div>
            ) : (
              <div></div>
            )}
            
            {/* Mode Information and Status */}
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              {isLoading && (
                <span className="flex items-center space-x-1 sm:hidden">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                  <span>Loading</span>
                </span>
              )}
              <span className="flex items-center space-x-1">
                {previewMode === 'mobile' ? (
                  <>
                    <DevicePhoneMobileIcon className="w-3 h-3" />
                    <span className="hidden sm:inline">Mobile Preview</span>
                    <span className="sm:hidden">Mobile</span>
                  </>
                ) : (
                  <>
                    <ComputerDesktopIcon className="w-3 h-3" />
                    <span className="hidden sm:inline">Desktop Preview</span>
                    <span className="sm:hidden">Desktop</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
            <div className="text-center">

              <p className="text-gray-600">Loading preview...</p>
            </div>
          </div>
        )}
        
        {previewUrl && (
          <div className={`w-full h-full flex ${previewMode === 'mobile' ? 'justify-center items-start' : ''}`}>
            <iframe
              src={previewUrl}
              className={`border-0 transition-all duration-300 ${
                previewMode === 'mobile' 
                  ? 'w-80 h-full max-w-full rounded-lg shadow-lg mt-4' 
                  : 'w-full h-full'
              }`}
              onLoad={handleIframeLoad}
              title="Live Preview"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          </div>
        )}
      </div>
    </div>
  );
}
