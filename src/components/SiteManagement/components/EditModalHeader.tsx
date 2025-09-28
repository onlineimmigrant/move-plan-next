import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Organization, Settings } from '../types';
import Button from '@/ui/Button';
import { getFaviconUrl } from '@/utils/client-utils';

interface EditModalHeaderProps {
  organization: Organization;
  settings: Settings;
  isMobile: boolean;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
  isAutoSaving: boolean;
  lastAutoSave: Date | null;
  hoveredImage: string | null;
  mousePosition: { x: number; y: number };
  onSave: () => void;
  onClose: () => void;
  onImageHover: (image: string | null, position?: { x: number; y: number }) => void;
}

export default function EditModalHeader({
  organization,
  settings,
  isMobile,
  isLoading,
  hasUnsavedChanges,
  isAutoSaving,
  lastAutoSave,
  hoveredImage,
  mousePosition,
  onSave,
  onClose,
  onImageHover
}: EditModalHeaderProps) {
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
  const formatLastSaved = (date: Date | null) => {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Enhanced Image Hover Tooltip */}
      {hoveredImage && (
        <div 
          className="modal-image-tooltip"
          style={{
            left: `${mousePosition.x + 10}px`,
            top: `${mousePosition.y + 10}px`,
          }}
        >
          <img 
            src={hoveredImage} 
            alt="Organization Logo Preview"
          />
        </div>
      )}

      {/* Header */}
      <header className="modal-header">
        <div className="modal-header-content">
          {/* Left Side - Organization Info */}
          <div className="modal-header-info">
            {/* Organization Avatar */}
            <div 
              className="modal-avatar"
              onMouseEnter={() => setIsAvatarHovered(true)}
              onMouseLeave={() => setIsAvatarHovered(false)}
            >
              {/* Show logo on hover, favicon by default */}
              {isAvatarHovered && settings.image ? (
                <img 
                  src={settings.image} 
                  alt={organization.name}
                  className="modal-avatar-logo"
                  onMouseEnter={(e) => {
                    if (settings.image) {
                      onImageHover(settings.image, { x: e.clientX, y: e.clientY });
                    }
                  }}
                  onMouseMove={(e) => {
                    onImageHover(settings.image || null, { x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => onImageHover(null)}
                />
              ) : settings.favicon ? (
                <img 
                  src={getFaviconUrl(settings.favicon)}
                  alt="Site favicon"
                  className="modal-avatar-favicon"
                />
              ) : (
                <div className="modal-avatar-fallback">
                  {organization.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            {/* Title & Status Section */}
            <div className="modal-title-section">
              <h1 className="modal-title">
                {isMobile ? 'Settings' : organization.name}
              </h1>
              <p className="modal-subtitle">
                {isMobile ? organization.name : 'Settings'}
              </p>
              
              {/* Enhanced Auto-save Status */}
              {(isAutoSaving || lastAutoSave) && (
                <div className="modal-status">
                  {isAutoSaving ? (
                    <div className="modal-status-saving">
                      <div className="modal-spinner"></div>
                      <span>Auto-saving...</span>
                    </div>
                  ) : lastAutoSave ? (
                    <div className="modal-status-saved">
                      <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Auto-saved {formatLastSaved(lastAutoSave)}</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Actions */}
          <div className="modal-actions">
            {/* Enhanced Save Button */}
            <button
              onClick={onSave}
              disabled={isLoading || !hasUnsavedChanges}
              className={`modal-save-btn ${
                hasUnsavedChanges && !isLoading
                  ? 'modal-save-btn-active'
                  : 'modal-save-btn-disabled'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="modal-spinner"></div>
                  <span className="hidden sm:inline">Saving...</span>
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="hidden sm:inline">Save Changes</span>
                  <span className="sm:hidden">Save</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="hidden sm:inline">Saved</span>
                  <span className="sm:hidden">✓</span>
                </>
              )}
            </button>

            {/* Enhanced Close Button */}
            <button
              onClick={onClose}
              disabled={isLoading}
              className="modal-close-btn"
              title="Close"
            >
              <XMarkIcon className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
