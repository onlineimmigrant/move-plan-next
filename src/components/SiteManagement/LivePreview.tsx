import React, { useEffect, useState } from 'react';
import { ComputerDesktopIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { Settings } from './types';
import { HeaderStyle } from '@/types/settings';

interface LivePreviewProps {
  settings: Settings;
  organizationUrl?: string;
  previewMode?: 'desktop' | 'mobile';
  onPreviewModeChange?: (mode: 'desktop' | 'mobile') => void;
  refreshKey?: string | number; // Add refresh key to force reload
  customUrl?: string; // Custom URL for Site Map navigation
}

// Helper function to validate if a string is a valid URL
const isValidUrl = (urlString: string): boolean => {
  if (!urlString || urlString.trim() === '') return false;
  
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
};

export default function LivePreview({ 
  settings, 
  organizationUrl, 
  previewMode = 'desktop', 
  onPreviewModeChange,
  refreshKey,
  customUrl
}: LivePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [debouncedOrganizationUrl, setDebouncedOrganizationUrl] = useState<string>(organizationUrl || '');

  // Force reload when refreshKey changes
  useEffect(() => {
    if (refreshKey !== undefined) {
      setIsLoading(true);
    }
  }, [refreshKey]);

  // Debounce the organization URL to avoid constant re-renders while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedOrganizationUrl(organizationUrl || '');
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [organizationUrl]);

  useEffect(() => {
    // Priority: customUrl (from Site Map) > debouncedOrganizationUrl
    const baseUrl = customUrl || debouncedOrganizationUrl;
    
    if (baseUrl && isValidUrl(baseUrl)) {
      try {
        // Validate URL before processing
        const url = new URL(baseUrl);
        
        // Only add preview parameters if not using customUrl (Site Map navigation)
        if (!customUrl) {
          url.searchParams.set('preview', 'true');
          
          // Add settings as preview parameters
          if (settings.primary_color) {
            url.searchParams.set('preview_primary_color', settings.primary_color);
          }
          if (settings.secondary_color) {
            url.searchParams.set('preview_secondary_color', settings.secondary_color);
          }
          // Pass header_style as JSON string (JSONB object)
          if (settings.header_style) {
            const headerStyleStr = typeof settings.header_style === 'object' 
              ? JSON.stringify(settings.header_style)
              : settings.header_style;
            url.searchParams.set('preview_header_style', headerStyleStr);
          }
          // Pass footer_style as JSON string (JSONB object)
          if (settings.footer_style) {
            const footerStyleStr = typeof settings.footer_style === 'object'
              ? JSON.stringify(settings.footer_style)
              : settings.footer_style;
            url.searchParams.set('preview_footer_style', footerStyleStr);
          }
          if (settings.site) {
            url.searchParams.set('preview_site_title', settings.site);
          }
          if (settings.image) {
            url.searchParams.set('preview_logo_url', settings.image);
          }
          // Use menu_width from header_style JSONB, fallback to old field for backward compatibility
          let menuWidth: string | undefined;
          if (typeof settings.header_style === 'object' && settings.header_style !== null) {
            const headerStyle = settings.header_style as HeaderStyle;
            menuWidth = headerStyle.menu_width;
          } else {
            menuWidth = settings.menu_width;
          }
          if (menuWidth) {
            url.searchParams.set('preview_menu_width', menuWidth);
          }
          if (settings.font_family) {
            url.searchParams.set('preview_font_family', settings.font_family);
          }
        }
        
        setPreviewUrl(url.toString());
      } catch (error) {
        // If URL is invalid (e.g., user is still typing), don't update preview
        console.log('Invalid URL format:', baseUrl);
        setPreviewUrl('');
      }
    } else {
      setPreviewUrl('');
    }
  }, [settings, debouncedOrganizationUrl, customUrl]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  if (!organizationUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-white/95 backdrop-blur-sm">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100/60 rounded-xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-gray-200/60">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-light text-gray-900 mb-3 tracking-tight">Live Preview</h3>
          <p className="text-gray-500 font-light leading-relaxed">
            No website URL available for preview.
            <br />
            Add a website URL to see live changes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white/95 backdrop-blur-sm pb-8">
      {/* Preview Header */}
      <div className="bg-white/80 border-b border-gray-200/60 px-4 py-3 backdrop-blur-xl">
        {/* Wide Layout - Single Row */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="flex space-x-1 flex-shrink-0">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
            <div className="text-sm text-gray-600 bg-gray-50/60 px-3 py-1 rounded-full font-mono truncate min-w-0 backdrop-blur-sm border border-gray-200/40">
              {organizationUrl}
            </div>
            {/* Mode Information - Wide Layout */}
            <div className="flex items-center space-x-1 text-xs text-gray-500 border-l border-gray-200/60 pl-3 font-light">

            </div>
          </div>
          <div className="flex items-center space-x-3 flex-shrink-0">
                        {isLoading && (
              <span className="text-xs text-gray-400 font-light">Loading...</span>
            )}
            {/* Preview Mode Toggle - Wide Layout */}
            {onPreviewModeChange && (
              <div className="flex items-center bg-gray-50/60 rounded-lg p-1 backdrop-blur-sm border border-gray-200/40">
                <button
                  onClick={() => onPreviewModeChange('desktop')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-light transition-all duration-200 ${
                    previewMode === 'desktop'
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                  }`}
                  title="Desktop Preview (Maximize preview)"
                >
                  <ComputerDesktopIcon className="w-4 h-4" />
                  <span>Desktop</span>
                </button>
                <button
                  onClick={() => onPreviewModeChange('mobile')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-light transition-all duration-200 ${
                    previewMode === 'mobile'
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
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
              <div className="text-sm text-gray-600 bg-gray-50/60 px-3 py-1 rounded-full font-mono truncate min-w-0 backdrop-blur-sm border border-gray-200/40">
                {organizationUrl}
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">

              {isLoading && (
                <span className="text-xs text-gray-400 hidden sm:inline font-light">Loading...</span>
              )}
            </div>
          </div>
          
          {/* Second Row - Preview Mode Toggle and Status */}
          <div className="hidden items-center justify-between">
            {/* Preview Mode Toggle */}
            {onPreviewModeChange ? (
              <div className="flex items-center bg-gray-50/60 rounded-lg p-1 backdrop-blur-sm border border-gray-200/40">
                <button
                  onClick={() => onPreviewModeChange('desktop')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-light transition-all duration-200 ${
                    previewMode === 'desktop'
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                  }`}
                  title="Desktop Preview (Maximize preview)"
                >
                  <ComputerDesktopIcon className="w-4 h-4" />
                  <span className="hidden md:inline">Desktop</span>
                </button>
                <button
                  onClick={() => onPreviewModeChange('mobile')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-light transition-all duration-200 ${
                    previewMode === 'mobile'
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
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
            <div className="flex items-center space-x-3 text-xs text-gray-400 font-light">
              {isLoading && (
                <span className="flex items-center space-x-1 sm:hidden">
                  <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse"></div>
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
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-500 font-light">Loading preview...</p>
            </div>
          </div>
        )}
        
        {previewUrl && (
          <div className={`w-full h-full flex ${previewMode === 'mobile' ? 'justify-center items-start' : ''}`}>
            <iframe
              key={refreshKey} // Add key to force reload when refreshKey changes
              src={previewUrl}
              className={`border-0 transition-all duration-300 ${
                previewMode === 'mobile' 
                  ? 'w-80 h-full max-w-full rounded-xl shadow-lg shadow-gray-200/50 mt-4 border border-gray-200/60' 
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
