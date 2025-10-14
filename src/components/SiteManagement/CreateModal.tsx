import React, { useState, useEffect, useRef, useCallback } from 'react';
import { XMarkIcon, InformationCircleIcon, Cog6ToothIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { Organization } from './types';
import { OrganizationTypeSelect } from './OrganizationTypeSelect';
import LivePreview from './LivePreview';
import Button from '@/ui/Button';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (orgData: Partial<Organization>) => Promise<Organization> | void;
  onOrganizationCreated?: (organization: Organization) => void;
  isLoading: boolean;
  session: any;
}

export default function CreateModal({ isOpen, onClose, onSubmit, onOrganizationCreated, isLoading, session }: CreateModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    base_url_local: 'http://localhost:3100',
    type: 'services' as const,
    // AI Management fields
    ai_endpoint: '',
    ai_model: '',
    ai_chat_enabled: false,
    ai_content_generation: false,
    ai_analytics: false,
    ai_management_url: ''
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(75); // 75% settings, 25% preview
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
        setLeftPanelWidth(75);
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
        type: 'services' as const,
        // AI Management fields
        ai_endpoint: '',
        ai_model: '',
        ai_chat_enabled: false,
        ai_content_generation: false,
        ai_analytics: false,
        ai_management_url: ''
      });
      setPreviewUrl('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('CreateModal: handleSubmit called');
    try {
      const result = onSubmit(formData);
      console.log('CreateModal: onSubmit result:', result);
      
      if (result && typeof result.then === 'function') {
        console.log('CreateModal: Awaiting Promise result');
        const createdOrg = await result;
        console.log('CreateModal: Received created organization:', createdOrg);
        if (createdOrg) {
          if (onOrganizationCreated) {
            console.log('CreateModal: Calling onOrganizationCreated callback');
            onOrganizationCreated(createdOrg);
          }
          onClose();
        }
      }
    } catch (error) {
      console.error('CreateModal: Failed to create organization:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
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
        setLeftPanelWidth(75);
      }
    }
  };

  const handleDoubleClick = () => {
    if (isMobile) return;
    setLeftPanelWidth(75);
    setIsCollapsed(false);
  };

  const handlePreviewModeChange = (mode: 'desktop' | 'mobile') => {
    setPreviewMode(mode);
    if (mode === 'desktop') {
      setLeftPanelWidth(25); // Minimal settings for desktop preview
    } else {
      setLeftPanelWidth(80); // More settings visible for mobile preview
    }
  };

  // Mouse handlers for resize functionality
  const handleMouseMoveRef = useRef<(e: MouseEvent) => void>();
  const handleMouseUpRef = useRef<() => void>();

  handleMouseMoveRef.current = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current || isCollapsed || isMobile) return;

    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }

    animationFrameId.current = requestAnimationFrame(() => {
      if (!containerRef.current || !isDraggingRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStartX.current;
      const deltaWidthPercent = (deltaX / containerRect.width) * 100;
      const newWidth = dragStartWidth.current + deltaWidthPercent;
      
      const constrainedWidth = Math.min(75, Math.max(20, newWidth));
      setLeftPanelWidth(constrainedWidth);
    });
  }, [isCollapsed, isMobile]);

  handleMouseUpRef.current = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
    
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    
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

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleMouseMoveRef.current?.(e);
  }, []);

  const handleMouseUp = useCallback(() => {
    handleMouseUpRef.current?.();
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!containerRef.current || isMobile || isCollapsed) return;
    
    dragStartX.current = e.clientX;
    dragStartWidth.current = leftPanelWidth;
    isDraggingRef.current = true;
    setIsDragging(true);
    
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp, { passive: false });
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    (document.body.style as any).webkitUserSelect = 'none';
    (document.body.style as any).mozUserSelect = 'none';
    (document.body.style as any).msUserSelect = 'none';
  }, [isMobile, isCollapsed, leftPanelWidth, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
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
        <header className="bg-white/95 border-b border-black/6 px-4 sm:px-6 py-4 sticky top-0 z-10 shadow-[0_1px_20px_rgba(0,0,0,0.04)]"
          style={{
            backdropFilter: 'blur(32px) saturate(180%) brightness(105%)',
            WebkitBackdropFilter: 'blur(32px) saturate(180%) brightness(105%)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-semibold text-[20px] antialiased shadow-sm border border-black/5"
                  style={{
                    backdropFilter: 'blur(12px) saturate(150%)',
                    WebkitBackdropFilter: 'blur(12px) saturate(150%)',
                  }}
                >
                  +
                </div>
                
                <div className="min-w-0 flex-1">
                  <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-gray-900 antialiased truncate mb-1">
                    Create New Site
                  </h1>
                  <p className="text-[14px] font-medium text-gray-600 antialiased truncate leading-tight">
                    Set up your organization and preview inspirational sites
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 ml-4">
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !formData.name.trim()}
                className={`px-6 py-3 rounded-2xl text-[14px] font-semibold antialiased tracking-[-0.01em] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-sm ${
                  !isLoading && formData.name.trim()
                    ? 'bg-blue-500 hover:bg-blue-600 text-white hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_20px_rgba(59,130,246,0.15)] hover:shadow-[0_8px_30px_rgba(59,130,246,0.25)]'
                    : 'bg-gray-100/80 text-gray-500 cursor-not-allowed border border-gray-200/50'
                } disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:scale-100`}
                style={!isLoading && formData.name.trim() ? {
                  backdropFilter: 'blur(16px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(16px) saturate(150%)',
                } : undefined}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">Creating...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden sm:inline">Create Site</span>
                    <span className="sm:hidden">Create</span>
                  </div>
                )}
              </Button>

              <button
                onClick={onClose}
                disabled={isLoading}
                className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100/60 rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] border border-gray-200/30"
                style={{
                  backdropFilter: 'blur(12px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(12px) saturate(150%)',
                }}
                title="Close"
              >
                <XMarkIcon className="w-5 h-5" strokeWidth={2} />
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
                    <h3 className="text-lg font-light tracking-tight text-gray-900">
                      Create Site
                    </h3>
                  </div>
                  <button
                    onClick={toggleCollapse}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-xl hover:bg-white/60 backdrop-blur-sm"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 pb-12 space-y-1" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
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

                    {/* AI Management Section */}
                    <div className="pt-6 border-t border-gray-200/60">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          AI Management
                        </h3>
                        <p className="text-sm text-gray-600 font-light">
                          Configure AI settings and management features for this organization
                        </p>
                      </div>
                      
                      {/* AI API Endpoint */}
                      <div className="mb-4">
                        <label htmlFor="ai_endpoint-mobile" className="block text-sm font-light text-gray-700 mb-3">
                          AI API Endpoint
                        </label>
                        <input
                          type="url"
                          id="ai_endpoint-mobile"
                          name="ai_endpoint"
                          value={formData.ai_endpoint || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200/60 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 font-light"
                          placeholder="https://api.openai.com/v1"
                          disabled={isLoading}
                        />
                      </div>

                      {/* AI Model */}
                      <div className="mb-4">
                        <label htmlFor="ai_model-mobile" className="block text-sm font-light text-gray-700 mb-3">
                          AI Model
                        </label>
                        <select
                          id="ai_model-mobile"
                          name="ai_model"
                          value={formData.ai_model || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200/60 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 font-light appearance-none cursor-pointer"
                          disabled={isLoading}
                        >
                          <option value="">Select AI Model</option>
                          <option value="gpt-4">GPT-4</option>
                          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                          <option value="claude-3-opus">Claude 3 Opus</option>
                          <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                          <option value="gemini-pro">Gemini Pro</option>
                        </select>
                      </div>

                      {/* AI Features */}
                      <div className="mb-4">
                        <label className="block text-sm font-light text-gray-700 mb-3">
                          AI Features
                        </label>
                        <div className="space-y-3">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              name="ai_chat_enabled"
                              checked={formData.ai_chat_enabled || false}
                              onChange={handleInputChange}
                              className="w-4 h-4 text-sky-600 bg-white/80 border-gray-300 rounded focus:ring-sky-500 focus:ring-2 transition-colors"
                              disabled={isLoading}
                            />
                            <span className="text-sm font-light text-gray-700">Enable AI Chat</span>
                          </label>
                          
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              name="ai_content_generation"
                              checked={formData.ai_content_generation || false}
                              onChange={handleInputChange}
                              className="w-4 h-4 text-sky-600 bg-white/80 border-gray-300 rounded focus:ring-sky-500 focus:ring-2 transition-colors"
                              disabled={isLoading}
                            />
                            <span className="text-sm font-light text-gray-700">AI Content Generation</span>
                          </label>
                          
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              name="ai_analytics"
                              checked={formData.ai_analytics || false}
                              onChange={handleInputChange}
                              className="w-4 h-4 text-sky-600 bg-white/80 border-gray-300 rounded focus:ring-sky-500 focus:ring-2 transition-colors"
                              disabled={isLoading}
                            />
                            <span className="text-sm font-light text-gray-700">AI Analytics</span>
                          </label>
                        </div>
                      </div>

                      {/* AI Management URL */}
                      <div>
                        <label htmlFor="ai_management_url-mobile" className="block text-sm font-light text-gray-700 mb-3">
                          AI Management URL
                        </label>
                        <input
                          type="url"
                          id="ai_management_url-mobile"
                          name="ai_management_url"
                          value={formData.ai_management_url || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200/60 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 font-light"
                          placeholder="/admin/ai/management"
                          disabled={isLoading}
                        />
                        <p className="mt-2 text-xs text-gray-500 font-light">
                          URL path for AI management interface (relative to base URL)
                        </p>
                      </div>
                    </div>
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
                  <h3 className="text-lg font-light tracking-tight text-gray-900">
                    Site Details
                  </h3>
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

                    {/* AI Management Section */}
                    <div className="pt-6 border-t border-gray-200/60">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          AI Management
                        </h3>
                        <p className="text-sm text-gray-600 font-light">
                          Configure AI settings and management features for this organization
                        </p>
                      </div>
                      
                      {/* AI API Endpoint */}
                      <div className="mb-4">
                        <label htmlFor="ai_endpoint" className="block text-sm font-light text-gray-700 mb-3">
                          AI API Endpoint
                        </label>
                        <input
                          type="url"
                          id="ai_endpoint"
                          name="ai_endpoint"
                          value={formData.ai_endpoint || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200/60 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 font-light"
                          placeholder="https://api.openai.com/v1"
                          disabled={isLoading}
                        />
                      </div>

                      {/* AI Model */}
                      <div className="mb-4">
                        <label htmlFor="ai_model" className="block text-sm font-light text-gray-700 mb-3">
                          AI Model
                        </label>
                        <select
                          id="ai_model"
                          name="ai_model"
                          value={formData.ai_model || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200/60 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 font-light appearance-none cursor-pointer"
                          disabled={isLoading}
                        >
                          <option value="">Select AI Model</option>
                          <option value="gpt-4">GPT-4</option>
                          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                          <option value="claude-3-opus">Claude 3 Opus</option>
                          <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                          <option value="gemini-pro">Gemini Pro</option>
                        </select>
                      </div>

                      {/* AI Features */}
                      <div className="mb-4">
                        <label className="block text-sm font-light text-gray-700 mb-3">
                          AI Features
                        </label>
                        <div className="space-y-3">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              name="ai_chat_enabled"
                              checked={formData.ai_chat_enabled || false}
                              onChange={handleInputChange}
                              className="w-4 h-4 text-sky-600 bg-white/80 border-gray-300 rounded focus:ring-sky-500 focus:ring-2 transition-colors"
                              disabled={isLoading}
                            />
                            <span className="text-sm font-light text-gray-700">Enable AI Chat</span>
                          </label>
                          
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              name="ai_content_generation"
                              checked={formData.ai_content_generation || false}
                              onChange={handleInputChange}
                              className="w-4 h-4 text-sky-600 bg-white/80 border-gray-300 rounded focus:ring-sky-500 focus:ring-2 transition-colors"
                              disabled={isLoading}
                            />
                            <span className="text-sm font-light text-gray-700">AI Content Generation</span>
                          </label>
                          
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              name="ai_analytics"
                              checked={formData.ai_analytics || false}
                              onChange={handleInputChange}
                              className="w-4 h-4 text-sky-600 bg-white/80 border-gray-300 rounded focus:ring-sky-500 focus:ring-2 transition-colors"
                              disabled={isLoading}
                            />
                            <span className="text-sm font-light text-gray-700">AI Analytics</span>
                          </label>
                        </div>
                      </div>

                      {/* AI Management URL */}
                      <div>
                        <label htmlFor="ai_management_url" className="block text-sm font-light text-gray-700 mb-3">
                          AI Management URL
                        </label>
                        <input
                          type="url"
                          id="ai_management_url"
                          name="ai_management_url"
                          value={formData.ai_management_url || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200/60 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 font-light"
                          placeholder="/admin/ai/management"
                          disabled={isLoading}
                        />
                        <p className="mt-2 text-xs text-gray-500 font-light">
                          URL path for AI management interface (relative to base URL)
                        </p>
                      </div>
                    </div>
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
                footer_style: 'gray',
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
