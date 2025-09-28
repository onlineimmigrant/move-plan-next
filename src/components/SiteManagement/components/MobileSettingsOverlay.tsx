import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Organization, Settings } from '../types';

interface MobileSettingsOverlayProps {
  isOpen: boolean;
  organization: Organization;
  settings: Settings;
  children: React.ReactNode;
  hoveredImage: string | null;
  mousePosition: { x: number; y: number };
  onClose: () => void;
  onImageHover: (image: string | null, position?: { x: number; y: number }) => void;
}

export default function MobileSettingsOverlay({
  isOpen,
  organization,
  settings,
  children,
  hoveredImage,
  mousePosition,
  onClose,
  onImageHover
}: MobileSettingsOverlayProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={(e) => {
        // Only close overlay if clicking the backdrop itself
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Image Hover Modal */}
      {hoveredImage && (
        <div 
          className="fixed z-[60] pointer-events-none"
          style={{
            left: `${mousePosition.x + 10}px`,
            top: `${mousePosition.y + 10}px`,
          }}
        >
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-2">
            <img 
              src={hoveredImage} 
              alt="Organization Logo Preview"
              className="rounded-md"
              style={{ width: '120px', height: '120px', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}

      <div className="bg-white/95 backdrop-blur-sm w-full h-full flex flex-col font-light" onMouseDown={(e) => e.stopPropagation()}>
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Organization Icon/Avatar or Logo */}
            <div className="flex w-8 h-8 rounded-xl items-center justify-center shadow-sm overflow-hidden">
              {settings.image ? (
                <img 
                  src={settings.image} 
                  alt={organization.name}
                  className="w-full h-full object-cover rounded-xl cursor-pointer transition-transform duration-200 hover:scale-105"
                  onMouseEnter={(e) => {
                    if (settings.image) {
                      onImageHover(settings.image, { x: e.clientX, y: e.clientY });
                    }
                  }}
                  onMouseMove={(e) => {
                    onImageHover(settings.image || null, { x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => onImageHover(null)}
                  onError={(e) => {
                    // Fallback to avatar if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-full h-full bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center text-white font-light text-sm ${settings.image ? 'hidden' : ''}`}>
                {organization.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <h3 className="text-lg font-light tracking-tight text-gray-900">{organization.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-xl hover:bg-white/60 backdrop-blur-sm"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 pb-12 space-y-1" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </div>
  );
}
