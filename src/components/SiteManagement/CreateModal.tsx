import React, { useState, useEffect, useRef, useCallback } from 'react';
import { XMarkIcon, InformationCircleIcon, Cog6ToothIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { Organization, organizationTypes } from './types';
import { OrganizationTypeSelect } from './OrganizationTypeSelect';
import LivePreview from './LivePreview';
import Button from '@/ui/Button';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (orgData: Partial<Organization>) => void;
  isLoading: boolean;
}

export default function CreateModal({ isOpen, onClose, onSubmit, isLoading }: CreateModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    base_url_local: 'http://localhost:3100',
    type: 'services' as const
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(40); // 40% for form, 60% for preview
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number>(0);
  const dragStartWidth = useRef<number>(0);
  const animationFrameId = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  // Check for mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true);
        setLeftPanelWidth(100);
      } else {
        setIsCollapsed(false);
        setLeftPanelWidth(40);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        base_url_local: 'http://localhost:3100',
        type: 'services' as const
      });
      setPreviewUrl('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTypeChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePreviewUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreviewUrl(e.target.value);
  };

  const toggleCollapse = () => {
    if (isMobile) {
      setIsCollapsed(!isCollapsed);
    } else {
      setIsCollapsed(!isCollapsed);
      if (!isCollapsed) {
        setLeftPanelWidth(0);
      } else {
        setLeftPanelWidth(40);
      }
    }
  };

  const handleDoubleClick = () => {
    if (isMobile) return;
    setLeftPanelWidth(40);
    setIsCollapsed(false);
  };

  const handlePreviewModeChange = (mode: 'desktop' | 'mobile') => {
    setPreviewMode(mode);
    if (mode === 'desktop') {
      setLeftPanelWidth(30);
    } else {
      setLeftPanelWidth(60);
    }
  };

  // Optimized mouse handlers using refs to avoid circular dependencies
  const handleMouseMoveRef = useRef<(e: MouseEvent) => void>();
  const handleMouseUpRef = useRef<() => void>();

  handleMouseMoveRef.current = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current || isCollapsed || isMobile) return;

    // Cancel any pending animation frame
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }

    // Use requestAnimationFrame to throttle updates
    animationFrameId.current = requestAnimationFrame(() => {
      if (!containerRef.current || !isDraggingRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStartX.current;
      const deltaWidthPercent = (deltaX / containerRect.width) * 100;
      const newWidth = dragStartWidth.current + deltaWidthPercent;
      
      // Constrain between 20% and 75% to ensure both panels have minimum usable width
      const constrainedWidth = Math.min(75, Math.max(20, newWidth));
      setLeftPanelWidth(constrainedWidth);
    });
  }, [isCollapsed, isMobile]);

  handleMouseUpRef.current = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
    
    // Cancel any pending animation frame
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    
    // Clean up immediately
    if (handleMouseMoveRef.current) {
      document.removeEventListener('mousemove', handleMouseMoveRef.current);
    }
    if (handleMouseUpRef.current) {
      document.removeEventListener('mouseup', handleMouseUpRef.current);
    }
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    (document.body.style as any).webkitUserSelect = '';
    (document.body.style as any).mozUserSelect = '';
    (document.body.style as any).msUserSelect = '';
  }, []);

  // Create stable event handler references
  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleMouseMoveRef.current?.(e);
  }, []);

  const handleMouseUp = useCallback(() => {
    handleMouseUpRef.current?.();
  }, []);

  // Resize functionality - optimized
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!containerRef.current || isMobile || isCollapsed) return;
    
    dragStartX.current = e.clientX;
    dragStartWidth.current = leftPanelWidth;
    isDraggingRef.current = true;
    setIsDragging(true);
    
    // Add event listeners immediately
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp, { passive: false });
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    (document.body.style as any).webkitUserSelect = 'none';
    (document.body.style as any).mozUserSelect = 'none';
    (document.body.style as any).msUserSelect = 'none';
  }, [isMobile, isCollapsed, leftPanelWidth, handleMouseMove, handleMouseUp]);

  // Cleanup animation frame on unmount only
  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      // Cleanup any lingering drag state
      isDraggingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      (document.body.style as any).webkitUserSelect = '';
      (document.body.style as any).mozUserSelect = '';
      (document.body.style as any).msUserSelect = '';
    };
  }, [handleMouseMove, handleMouseUp]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white/95 backdrop-blur-sm w-full h-full flex flex-col font-light" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-3 sm:px-4 py-2.5 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            {/* Left Side - Title and Description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                {/* Default Icon */}
                <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center text-white font-light text-lg shadow-sm">
                  +
                </div>
                
                {/* Title Section */}
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg font-light tracking-tight text-gray-900 truncate">
                    {isMobile ? 'Create New Site' : 'Create New Site'}
                  </h1>
                  <p className="text-sm font-light text-gray-600/80 mt-0.5 truncate">
                    {isMobile ? 'Set up your organization' : 'Set up your organization and preview inspirational sites'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side - Actions */}
            <div className="flex items-center space-x-2 ml-4">
              {/* Create Button */}
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !formData.name.trim()}
                className={`px-4 py-2 rounded-xl text-sm font-light tracking-wide transition-all duration-300 shadow-sm hover:shadow-md transform ${
                  !isLoading && formData.name.trim()
                    ? 'bg-sky-500 hover:bg-sky-600 text-white hover:scale-105'
                    : 'bg-gray-200/60 text-gray-500 cursor-not-allowed'
                } disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:scale-100`}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="hidden sm:inline font-light">Creating...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden sm:inline font-light">Create Site</span>
                    <span className="sm:hidden font-light">Create</span>
                  </div>
                )}
              </Button>

              {/* Close Button */}
              <button
                onClick={onClose}
                disabled={isLoading}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                title="Close"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className={`flex-1 flex overflow-hidden ${isDragging ? 'pointer-events-none' : ''}`} ref={containerRef}>
          {/* Collapsed Form Button (Desktop) */}
          {isCollapsed && !isMobile && (
            <div className="w-16 bg-white/60 backdrop-blur-sm border-r border-gray-200/60 flex flex-col items-center justify-start pt-6">
              <button
                onClick={toggleCollapse}
                className="w-10 h-10 bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-sm transition-all duration-300 hover:scale-105 flex items-center justify-center group"
                title="Open Form"
              >
                <Cog6ToothIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          )}

          {/* Mobile Form Overlay */}
          {isMobile && isCollapsed && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  toggleCollapse();
                }
              }}
            >
              <div className="bg-white/95 backdrop-blur-sm w-full h-full flex flex-col font-light" onMouseDown={(e) => e.stopPropagation()}>
                <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center text-white font-light text-sm">
                      +
                    </div>
                    <h3 className="text-lg font-light tracking-tight text-gray-900">Create Site</h3>
                  </div>
                  <button
                    onClick={toggleCollapse}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-xl hover:bg-white/60 backdrop-blur-sm"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 pb-12 space-y-1" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                  {/* Mobile Form Content */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Preview URL Field */}
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <label htmlFor="preview-url-mobile" className="block text-sm font-light text-gray-700">
                          Inspiration Site URL (Optional)
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <InformationCircleIcon className="w-4 h-4" />
                          </button>
                          {showTooltip && (
                            <div className="absolute z-10 w-64 p-3 text-sm font-light text-white bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg -top-2 left-6">
                              You can preview any website for design inspiration. Please respect registered trademarks and author rights. You carry full legal responsibility for content usage.
                              <div className="absolute top-2 -left-1 w-2 h-2 bg-gray-800/90 rotate-45"></div>
                            </div>
                          )}
                        </div>
                      </div>
                      <input
                        type="url"
                        id="preview-url-mobile"
                        value={previewUrl}
                        onChange={handlePreviewUrlChange}
                        className="w-full px-4 py-3 border border-gray-200/60 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 font-light"
                        placeholder="https://example.com"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Organization Name */}
                    <div>
                      <label htmlFor="name-mobile" className="block text-sm font-light text-gray-700 mb-3">
                        Organization Name *
                      </label>
                      <input
                        type="text"
                        id="name-mobile"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-200/60 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 font-light"
                        placeholder="Enter organization name"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Local URL */}
                    <div>
                      <label htmlFor="base_url_local-mobile" className="block text-sm font-light text-gray-700 mb-3">
                        Local URL *
                      </label>
                      <input
                        type="url"
                        id="base_url_local-mobile"
                        name="base_url_local"
                        value={formData.base_url_local}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-200/60 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 font-light"
                        placeholder="http://localhost:3100"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Organization Type */}
                    <OrganizationTypeSelect
                      label="Organization Type *"
                      name="type"
                      value={formData.type}
                      onChange={handleTypeChange}
                    />
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Left Panel - Form (Desktop) */}
          {!isCollapsed && !isMobile && (
            <div 
              className={`overflow-y-auto border-r border-gray-200/60 bg-white/50 backdrop-blur-sm ${
                isDragging ? 'transition-none' : 'transition-all duration-150 ease-out'
              }`}
              style={{ 
                width: `${leftPanelWidth}%`,
                willChange: isDragging ? 'width' : 'auto',
                contain: isDragging ? 'layout style' : 'none'
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pb-12 p-6 font-light" onMouseDown={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-light tracking-tight text-gray-900">Site Details</h3>
                  <button
                    onClick={toggleCollapse}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-xl hover:bg-white/60 backdrop-blur-sm"
                    title="Minimize to icon"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                </div>
                <div onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Preview URL Field */}
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <label htmlFor="preview-url" className="block text-sm font-light text-gray-700">
                          Inspiration Site URL (Optional)
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <InformationCircleIcon className="w-4 h-4" />
                          </button>
                          {showTooltip && (
                            <div className="absolute z-10 w-64 p-3 text-sm font-light text-white bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg -top-2 left-6">
                              You can preview any website for design inspiration. Please respect registered trademarks and author rights. You carry full legal responsibility for content usage.
                              <div className="absolute top-2 -left-1 w-2 h-2 bg-gray-800/90 rotate-45"></div>
                            </div>
                          )}
                        </div>
                      </div>
                      <input
                        type="url"
                        id="preview-url"
                        value={previewUrl}
                        onChange={handlePreviewUrlChange}
                        className="w-full px-4 py-3 border border-gray-200/60 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 font-light"
                        placeholder="https://example.com"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Organization Name */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-light text-gray-700 mb-3">
                        Organization Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-200/60 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 font-light"
                        placeholder="Enter organization name"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Local URL */}
                    <div>
                      <label htmlFor="base_url_local" className="block text-sm font-light text-gray-700 mb-3">
                        Local URL *
                      </label>
                      <input
                        type="url"
                        id="base_url_local"
                        name="base_url_local"
                        value={formData.base_url_local}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-200/60 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 font-light"
                        placeholder="http://localhost:3100"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Organization Type */}
                    <OrganizationTypeSelect
                      label="Organization Type *"
                      name="type"
                      value={formData.type}
                      onChange={handleTypeChange}
                    />
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Resize Handle (Desktop only, when not collapsed) */}
          {!isCollapsed && !isMobile && (
            <div
              className={`w-2 bg-gray-200/60 hover:bg-sky-400/60 cursor-col-resize transition-all duration-150 relative group ${
                isDragging ? 'bg-sky-500/60 w-3' : ''
              }`}
              onMouseDown={handleMouseDown}
              onDoubleClick={handleDoubleClick}
              title="Drag to resize panels, double-click to reset."
            >
              <div className={`absolute inset-y-0 left-1/2 transform -translate-x-1/2 transition-all duration-150 ${
                isDragging ? 'w-2 bg-sky-600/60' : 'w-1 bg-gray-400/60 group-hover:bg-sky-500/60'
              }`}>
                <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ${
                  isDragging ? 'w-4 h-8 bg-sky-600/80' : 'w-3 h-6 bg-gray-400/60 group-hover:bg-sky-500/60'
                } rounded-full flex items-center justify-center backdrop-blur-sm`}>
                  <div className={`rounded-full transition-all duration-150 ${
                    isDragging ? 'w-1 h-4 bg-white/80' : 'w-0.5 h-3 bg-white/80'
                  }`}></div>
                </div>
              </div>
            </div>
          )}

          {/* Right Panel - Live Preview */}
          <div 
            className={`relative overflow-hidden ${
              isDragging ? 'transition-none' : 'transition-all duration-150 ease-out'
            }`}
            style={{ 
              width: isCollapsed && !isMobile ? '100%' : 
                     isMobile ? '100%' :
                     `${100 - leftPanelWidth}%`,
              willChange: isDragging ? 'width' : 'auto',
              contain: isDragging ? 'layout style' : 'none'
            }}
          >
            {/* Mobile Form Toggle Button */}
            {isMobile && !isCollapsed && (
              <div className="absolute top-3 right-4 z-10">
                <button
                  onClick={toggleCollapse}
                  className="w-11 h-11 bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-sm transition-all duration-300 hover:scale-105 flex items-center justify-center backdrop-blur-sm"
                  title="Open Form"
                >
                  <Cog6ToothIcon className="w-5 h-5" />
                </button>
              </div>
            )}
            
            <LivePreview
              settings={{
                name: formData.name || 'New Site',
                base_url: '',
                base_url_local: formData.base_url_local,
                type: formData.type,
                site: formData.name || 'New Site',
                primary_color: 'emerald',
                secondary_color: 'gray',
                header_style: 'default',
                footer_color: 'gray',
                menu_width: '280px',
                font_family: '',
                image: null,
                favicon: null,
                hero_image: null,
                google_analytics_id: '',
                google_tag: '',
                seo_keywords: '',
                seo_title: '',
                seo_description: '',
                language: 'en',
                supported_locales: ['en'],
                with_language_switch: false,
                contact_email: '',
                contact_phone: ''
              }}
              organizationUrl={previewUrl || 'https://example.com'}
              previewMode={previewMode}
              onPreviewModeChange={handlePreviewModeChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
