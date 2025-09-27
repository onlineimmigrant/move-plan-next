import React, { useState, useEffect, useMemo } from 'react';
import { Organization, Settings } from './types';
import SettingsFormFields from './SettingsFormFields';
import LivePreview from './LivePreview';
import SiteDeployment from './SiteDeployment';
import EditModalHeader from './components/EditModalHeader';
import ResizablePanels from './components/ResizablePanels';
import MobileSettingsOverlay from './components/MobileSettingsOverlay';
import { useResizablePanels } from './hooks/useResizablePanels';
import { useAutoSave } from './hooks/useAutoSave';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import './styles/modal-design-system.css';

interface EditModalProps {
  isOpen: boolean;
  organization: Organization | null;
  onClose: () => void;
  onSave: (settings: Settings) => void;
  isLoading: boolean;
  session: any; // Add session prop
}

export default function EditModal({ 
  isOpen, 
  organization, 
  onClose, 
  onSave, 
  isLoading,
  session 
}: EditModalProps) {
  const [settings, setSettings] = useState<Settings>({} as Settings);
  const [originalSettings, setOriginalSettings] = useState<Settings>({} as Settings);
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<'settings' | 'deployment'>('settings');
  const [previewRefreshKey, setPreviewRefreshKey] = useState<number>(0);
  const [isLoadingDetailedData, setIsLoadingDetailedData] = useState(false);
  const [detailedOrganizationData, setDetailedOrganizationData] = useState<any>(null);
  const [sectionsResetKey, setSectionsResetKey] = useState<number>(0);

  // Use custom hooks for complex functionality
  const resizablePanels = useResizablePanels({ 
    initialWidth: 75, 
    isMobile, 
    isCollapsed 
  });

  // Auto-save functionality
  const autoSave = useAutoSave({
    settings,
    originalSettings,
    onSave: async (newSettings) => {
      await onSave(newSettings);
      setOriginalSettings({ ...newSettings });
      setPreviewRefreshKey(prev => prev + 1);
    },
    debounceMs: 3000,
    enabled: isOpen
  });

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSave: () => handleSave(),
    onClose: onClose,
    disabled: !isOpen || isLoading
  });

  // Fetch detailed organization data including cookies
  const fetchDetailedOrganizationData = async (organizationId: string, sessionToken: string) => {
    if (!sessionToken) return null;
    
    setIsLoadingDetailedData(true);
    try {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch organization data: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[EditModal] Fetched detailed organization data:', data);
      setDetailedOrganizationData(data);
      return data;
    } catch (error) {
      console.error('[EditModal] Error fetching detailed organization data:', error);
      return null;
    } finally {
      setIsLoadingDetailedData(false);
    }
  };

  // Check for mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true); // Start collapsed on mobile
      } else {
        setIsCollapsed(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset section states when modal opens
  useEffect(() => {
    if (isOpen) {
      // Clear all section states to ensure all sections start closed
      sessionStorage.removeItem('siteManagement_sectionStates');
      // Increment resetKey to force SettingsFormFields to re-initialize
      setSectionsResetKey(prev => prev + 1);
      console.log('[EditModal] Modal opened - reset all section states to closed, resetKey incremented');
    }
  }, [isOpen]);

  // Initialize settings when organization changes
  useEffect(() => {
    console.log(`[EditModal] Organization changed:`, organization);
    
    // Fetch detailed organization data if we have an organization ID
    if (organization?.id && session?.access_token) {
      fetchDetailedOrganizationData(organization.id, session.access_token);
    }
    
    if (organization?.settings) {
      console.log('Loading organization settings:', organization.settings); // Debug log
      const loadedSettings = {
        ...organization.settings,
        // Include organization-level fields in settings (use organization values, not settings)
        name: organization.name,
        base_url: organization.base_url || '',
        base_url_local: organization.base_url_local || '',
        type: organization.type,
        // Ensure supported_locales is always an array
        supported_locales: Array.isArray(organization.settings.supported_locales) 
          ? organization.settings.supported_locales 
          : organization.settings.supported_locales 
            ? [organization.settings.supported_locales] 
            : ['en'],
        // Ensure language has a default
        language: organization.settings.language || 'en'
      };
      console.log(`[EditModal] Loaded settings:`, loadedSettings);
      setSettings(loadedSettings);
      setOriginalSettings(loadedSettings);
    } else {
      console.log('No settings found, using defaults'); // Debug log
      // Initialize with default values if no settings exist
      const defaultSettings: Settings = {
        name: organization?.name || '',
        base_url: organization?.base_url || '',
        base_url_local: organization?.base_url_local || 'http://localhost:3100',
        type: organization?.type || 'services',
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
        supported_locales: ['en'], // Default to English array
        with_language_switch: false,
        contact_email: '',
        contact_phone: ''
      };
      setSettings(defaultSettings);
      setOriginalSettings(defaultSettings);
    }
  }, [organization, session]);

  // Expose current settings globally for auto-save functionality
  useEffect(() => {
    (window as any).__currentEditSettings = settings;
  }, [settings]);

  const handleSettingChange = (field: keyof Settings, value: any) => {
    console.log(`[EditModal] Setting change: ${field} = ${value}`);
    if (field === 'cookie_services') {
      console.log(`[EditModal] Cookie services change - new count: ${Array.isArray(value) ? value.length : 0}`);
    }
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [field]: value
      };
      if (field === 'cookie_services') {
        console.log(`[EditModal] Updated settings.cookie_services:`, newSettings.cookie_services);
        console.log(`[EditModal] New cookie services count:`, Array.isArray(newSettings.cookie_services) ? newSettings.cookie_services.length : 0);
      }
      console.log(`[EditModal] New settings state:`, newSettings);
      return newSettings;
    });
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
    if (!autoSave.hasUnsavedChanges) return;
    
    console.log(`[EditModal] Starting save process with settings:`, settings);
    console.log(`[EditModal] Original settings:`, originalSettings);
    
    try {
      await onSave(settings);
      // After successful save, update original settings to current settings
      console.log(`[EditModal] Save successful, updating originalSettings`);
      setOriginalSettings({ ...settings });
      
      // Refresh only the LivePreview component, not the entire modal
      setPreviewRefreshKey(prev => prev + 1);
      console.log('[EditModal] LivePreview refresh triggered');
    } catch (error) {
      console.error('[EditModal] Save failed:', error);
      // Handle error if needed
    }
  };

  // Preview mode toggle functions
  const handlePreviewModeChange = (mode: 'desktop' | 'mobile') => {
    setPreviewMode(mode);
    if (mode === 'desktop') {
      // Desktop mode: maximize preview (minimize settings)
      resizablePanels.setLeftPanelWidth(25);
    } else {
      // Mobile mode: maximize settings (minimize preview)
      resizablePanels.setLeftPanelWidth(80);
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleImageHover = (image: string | null, position?: { x: number; y: number }) => {
    setHoveredImage(image);
    if (position) {
      setMousePosition(position);
    }
  };

  // Tab content rendering
  const renderTabContent = () => {
    if (activeTab === 'settings') {
      return (
        <SettingsFormFields
          settings={settings}
          onChange={handleSettingChange}
          onImageUpload={handleImageUpload}
          uploadingImages={uploadingImages}
          isNarrow={resizablePanels.leftPanelWidth < 40}
          cookieData={detailedOrganizationData}
          session={session}
          organizationId={organization?.id}
          resetKey={sectionsResetKey}
        />
      );
    } else {
      return (
        <SiteDeployment
          organization={organization!}
          session={session}
          onDeploymentComplete={(baseUrl) => {
            setSettings(prev => ({ ...prev, base_url: baseUrl }));
          }}
        />
      );
    }
  };

  if (!isOpen || !organization) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={(e) => {
        // Only close modal if clicking the backdrop itself, not any child elements
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white/95 backdrop-blur-sm w-full h-full flex flex-col font-light" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <EditModalHeader
          organization={organization!}
          settings={settings}
          isMobile={isMobile}
          isLoading={isLoading}
          hasUnsavedChanges={autoSave.hasUnsavedChanges}
          isAutoSaving={autoSave.isAutoSaving}
          lastAutoSave={autoSave.lastAutoSave}
          hoveredImage={hoveredImage}
          mousePosition={mousePosition}
          onSave={handleSave}
          onClose={onClose}
          onImageHover={handleImageHover}
        />

        {/* Mobile Settings Overlay */}
        <MobileSettingsOverlay
          isOpen={isMobile && isCollapsed}
          organization={organization!}
          settings={settings}
          hoveredImage={hoveredImage}
          mousePosition={mousePosition}
          onClose={toggleCollapse}
          onImageHover={handleImageHover}
        >
          {/* Enhanced Tab Navigation */}
          <div className="modal-tabs">
            <button
              onClick={() => setActiveTab('settings')}
              className={`modal-tab ${activeTab === 'settings' ? 'active' : ''}`}
            >
              Settings
            </button>
            <button
              onClick={() => setActiveTab('deployment')}
              className={`modal-tab ${activeTab === 'deployment' ? 'active' : ''}`}
            >
              Deployment
            </button>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </MobileSettingsOverlay>

        {/* Desktop Resizable Panels */}
        <ResizablePanels
          leftPanelWidth={resizablePanels.leftPanelWidth}
          isDragging={resizablePanels.isDragging}
          isCollapsed={isCollapsed}
          isMobile={isMobile}
          containerRef={resizablePanels.containerRef}
          onMouseDown={resizablePanels.handleMouseDown}
          onDoubleClick={resizablePanels.handleDoubleClick}
          onToggleCollapse={toggleCollapse}
          previewContent={
            <LivePreview
              settings={settings}
              organizationUrl={organization.base_url || organization.base_url_local || ''}
              previewMode={previewMode}
              onPreviewModeChange={handlePreviewModeChange}
              refreshKey={previewRefreshKey}
            />
          }
        >
          {/* Enhanced Tab Navigation */}
          <div className="modal-tabs">
            <button
              onClick={() => setActiveTab('settings')}
              className={`modal-tab ${activeTab === 'settings' ? 'active' : ''}`}
            >
              Settings
            </button>
            <button
              onClick={() => setActiveTab('deployment')}
              className={`modal-tab ${activeTab === 'deployment' ? 'active' : ''}`}
            >
              Deployment
            </button>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </ResizablePanels>
      </div>
    </div>
  );
}
