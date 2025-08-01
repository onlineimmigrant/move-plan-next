import React, { useState, useEffect, useRef, useCallback } from 'react';
import { XMarkIcon, Cog6ToothIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Organization, Settings } from './types';
import SettingsFormFields from './SettingsFormFields';
import LivePreview from './LivePreview';
import Button from '@/ui/Button';

interface EditModalProps {
  isOpen: boolean;
  organization: Organization | null;
  onClose: () => void;
  onSave: (settings: Settings) => void;
  isLoading: boolean;
}

export default function EditModal({ 
  isOpen, 
  organization, 
  onClose, 
  onSave, 
  isLoading 
}: EditModalProps) {
  const [settings, setSettings] = useState<Settings>({} as Settings);
  const [originalSettings, setOriginalSettings] = useState<Settings>({} as Settings);
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set());
  const [leftPanelWidth, setLeftPanelWidth] = useState(30); // Changed to 30% initially (minimal)
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop'); // New state for preview mode
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
        setIsCollapsed(true); // Start collapsed on mobile
        setLeftPanelWidth(100); // Full width when expanded on mobile
      } else {
        setIsCollapsed(false);
        setLeftPanelWidth(30); // 30% on desktop
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize settings when organization changes
  useEffect(() => {
    if (organization?.settings) {
      console.log('Loading organization settings:', organization.settings); // Debug log
      setSettings(organization.settings);
      setOriginalSettings(organization.settings);
    } else {
      console.log('No settings found, using defaults'); // Debug log
      // Initialize with default values if no settings exist
      const defaultSettings: Settings = {
        site: organization?.settings?.site || organization?.name || '',
        primary_color: 'sky',
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
        supported_locales: [],
        with_language_switch: false,
        contact_email: '',
        contact_phone: ''
      };
      setSettings(defaultSettings);
      setOriginalSettings(defaultSettings);
    }
    setHasUnsavedChanges(false);
  }, [organization]);

  // Check for changes whenever settings change
  useEffect(() => {
    const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasUnsavedChanges(hasChanges);
  }, [settings, originalSettings]);

  const handleSettingChange = (field: keyof Settings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (field: 'image' | 'favicon' | 'hero_image') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setUploadingImages(prev => new Set(prev).add(field));
        
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('field', field);
          formData.append('organizationId', organization?.id || '');

          const response = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const { url } = await response.json();
            handleSettingChange(field, url);
          } else {
            console.error('Failed to upload image');
          }
        } catch (error) {
          console.error('Error uploading image:', error);
        } finally {
          setUploadingImages(prev => {
            const newSet = new Set(prev);
            newSet.delete(field);
            return newSet;
          });
        }
      }
    };
    
    input.click();
  };

  const handleSave = async () => {
    if (!hasUnsavedChanges) return;
    
    try {
      await onSave(settings);
      // After successful save, update original settings to current settings
      setOriginalSettings({ ...settings });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Save failed:', error);
      // Handle error if needed
    }
  };

  const handleDoubleClick = () => {
    if (isMobile) return; // No double-click reset on mobile
    setLeftPanelWidth(30); // Reset to 30/70 split
    setIsCollapsed(false);
  };

  // Preview mode toggle functions
  const handlePreviewModeChange = (mode: 'desktop' | 'mobile') => {
    setPreviewMode(mode);
    if (mode === 'desktop') {
      // Desktop mode: maximize preview (minimize settings)
      setLeftPanelWidth(20); // Minimal settings panel
    } else {
      // Mobile mode: maximize settings (minimize preview)
      setLeftPanelWidth(70); // Minimal preview panel
    }
  };

  const toggleCollapse = () => {
    if (isMobile) {
      setIsCollapsed(!isCollapsed);
    } else {
      setIsCollapsed(!isCollapsed);
      if (!isCollapsed) {
        // Collapsing - minimize to icon
        setLeftPanelWidth(0);
      } else {
        // Expanding - restore to 30%
        setLeftPanelWidth(30);
      }
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
  }, [isMobile, isCollapsed, leftPanelWidth]);

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

  if (!isOpen || !organization) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white w-full h-full flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side - Title and Description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                {/* Organization Icon/Avatar */}
                <div className="hidden sm:flex w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl items-center justify-center text-white font-bold text-lg shadow-sm">
                  {organization.name.charAt(0).toUpperCase()}
                </div>
                
                {/* Title Section */}
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                    {isMobile ? 'Settings' : `Edit Settings - ${organization.name}`}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5 truncate">
                    {isMobile ? organization.name : 'Configure your site settings and see changes in real-time'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side - Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3 ml-4">
              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={isLoading || !hasUnsavedChanges}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-sm sm:text-base font-medium transition-all duration-300 shadow-sm hover:shadow-md transform ${
                  hasUnsavedChanges && !isLoading
                    ? 'bg-sky-500 hover:bg-sky-600 text-white hover:scale-105'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                } disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:scale-100`}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">Saving...</span>
                  </div>
                ) : hasUnsavedChanges ? (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="hidden sm:inline">Save Changes</span>
                    <span className="sm:hidden">Save</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="hidden sm:inline">No Changes</span>
                    <span className="sm:hidden">Saved</span>
                  </div>
                )}
              </Button>

              {/* Close Button */}
              <button
                onClick={onClose}
                disabled={isLoading}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Close"
              >
                <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Mobile Status Bar */}
          {isMobile && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Live Preview</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${
                      isLoading ? 'bg-amber-400' : 
                      hasUnsavedChanges ? 'bg-orange-400' : 'bg-green-400'
                    }`}></div>
                    <span>
                      {isLoading ? 'Saving' : 
                       hasUnsavedChanges ? 'Changes' : 'Saved'}
                    </span>
                  </span>
                </div>
                <div className="text-gray-400">
                  {organization.base_url || 'Preview Mode'}
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Content */}
        <div className={`flex-1 flex overflow-hidden ${isDragging ? 'pointer-events-none' : ''}`} ref={containerRef}>
          {/* Collapsed Settings Button (Desktop) */}
          {isCollapsed && !isMobile && (
            <div className="w-16 bg-gray-50 border-r border-gray-200 flex flex-col items-center justify-start pt-6">
              <button
                onClick={toggleCollapse}
                className="w-12 h-12 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center group"
                title="Open Settings"
              >
                <Cog6ToothIcon className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          )}

          {/* Mobile Settings Overlay */}
          {isMobile && isCollapsed && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
              <div className="bg-white w-full h-full flex flex-col">
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
                  <button
                    onClick={toggleCollapse}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <SettingsFormFields
                    settings={settings}
                    onChange={handleSettingChange}
                    onImageUpload={handleImageUpload}
                    uploadingImages={uploadingImages}
                    isNarrow={false}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Left Panel - Form (Desktop) */}
          {!isCollapsed && !isMobile && (
            <div 
              className={`overflow-y-auto border-r border-gray-200 ${
                isDragging ? 'transition-none' : 'transition-all duration-150 ease-out'
              }`}
              style={{ 
                width: `${leftPanelWidth}%`,
                willChange: isDragging ? 'width' : 'auto',
                contain: isDragging ? 'layout style' : 'none'
              }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
                  <button
                    onClick={toggleCollapse}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                    title="Minimize to icon"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                </div>
                <SettingsFormFields
                  settings={settings}
                  onChange={handleSettingChange}
                  onImageUpload={handleImageUpload}
                  uploadingImages={uploadingImages}
                  isNarrow={leftPanelWidth < 40}
                />
              </div>
            </div>
          )}

          {/* Resize Handle (Desktop only, when not collapsed) */}
          {!isCollapsed && !isMobile && (
            <div
              className={`w-2 bg-gray-200 hover:bg-sky-400 cursor-col-resize transition-all duration-150 relative group ${
                isDragging ? 'bg-sky-500 w-3' : ''
              }`}
              onMouseDown={handleMouseDown}
              onDoubleClick={handleDoubleClick}
              title="Drag to resize panels, double-click to reset. Use Desktop/Mobile buttons for quick layouts."
            >
              {/* Visual indicator with improved styling */}
              <div className={`absolute inset-y-0 left-1/2 transform -translate-x-1/2 transition-all duration-150 ${
                isDragging ? 'w-2 bg-sky-600' : 'w-1 bg-gray-400 group-hover:bg-sky-500'
              }`}>
                <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ${
                  isDragging ? 'w-4 h-8 bg-sky-600' : 'w-3 h-6 bg-gray-400 group-hover:bg-sky-500'
                } rounded-full flex items-center justify-center`}>
                  <div className={`rounded-full transition-all duration-150 ${
                    isDragging ? 'w-1 h-4 bg-white' : 'w-0.5 h-3 bg-white'
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
            {/* Mobile Settings Toggle Button */}
            {isMobile && !isCollapsed && (
              <div className="absolute top-4 left-4 z-10">
                <button
                  onClick={toggleCollapse}
                  className="w-12 h-12 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center"
                  title="Open Settings"
                >
                  <Cog6ToothIcon className="w-6 h-6" />
                </button>
              </div>
            )}
            
            <LivePreview
              settings={settings}
              organizationUrl={organization.base_url || organization.base_url_local || ''}
              previewMode={previewMode}
              onPreviewModeChange={handlePreviewModeChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
