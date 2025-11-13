/**
 * LogoSection - Logo upload and positioning controls for header
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/Shared/ToastContainer';
import { useThemeColors } from '@/hooks/useThemeColors';
import { PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';

interface LogoSectionProps {
  headerStyleFull: any;
  logoImageUrl: string | null;
  organizationId: string;
  onStyleFullChange: (organizationId: string, style: any) => Promise<void>;
  onImageGalleryOpen: (onSelect: (imageUrl: string) => void) => void;
}

export function LogoSection({
  headerStyleFull,
  logoImageUrl,
  organizationId,
  onStyleFullChange,
  onImageGalleryOpen
}: LogoSectionProps) {
  const toast = useToast();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  // Local state - use logoImageUrl from settings.image
  const [logoUrl, setLogoUrl] = useState(logoImageUrl || '');
  const [logoPosition, setLogoPosition] = useState<'left' | 'center' | 'right'>(
    headerStyleFull?.logo?.position || 'left'
  );
  const [logoSize, setLogoSize] = useState<'sm' | 'md' | 'lg'>(
    headerStyleFull?.logo?.size || 'md'
  );

  const handleLogoUpload = () => {
    onImageGalleryOpen((imageUrl: string) => {
      setLogoUrl(imageUrl);
      
      const updatedStyle = {
        ...headerStyleFull,
        logo: {
          ...headerStyleFull?.logo,
          url: imageUrl,
          position: logoPosition,
          size: logoSize
        }
      };

      onStyleFullChange(organizationId, updatedStyle)
        .then(() => {
          toast.success('Logo uploaded');
        })
        .catch((error) => {
          console.error('Failed to upload logo:', error);
          toast.error('Failed to upload logo');
        });
    });
  };

  const handleLogoRemove = () => {
    setLogoUrl('');
    
    const updatedStyle = {
      ...headerStyleFull,
      logo: {
        ...headerStyleFull?.logo,
        url: '',
        position: logoPosition,
        size: logoSize
      }
    };

    onStyleFullChange(organizationId, updatedStyle)
      .then(() => {
        toast.success('Logo removed');
      })
      .catch((error) => {
        console.error('Failed to remove logo:', error);
        toast.error('Failed to remove logo');
      });
  };

  const handlePositionChange = (position: 'left' | 'center' | 'right') => {
    setLogoPosition(position);
    
    const updatedStyle = {
      ...headerStyleFull,
      logo: {
        ...headerStyleFull?.logo,
        url: logoUrl,
        position: position,
        size: logoSize
      }
    };

    onStyleFullChange(organizationId, updatedStyle)
      .then(() => {
        toast.success('Logo position updated');
      })
      .catch((error) => {
        console.error('Failed to update logo position:', error);
        toast.error('Failed to update logo position');
      });
  };

  const handleSizeChange = (size: 'sm' | 'md' | 'lg') => {
    setLogoSize(size);
    
    const updatedStyle = {
      ...headerStyleFull,
      logo: {
        ...headerStyleFull?.logo,
        url: logoUrl,
        position: logoPosition,
        size: size
      }
    };

    onStyleFullChange(organizationId, updatedStyle)
      .then(() => {
        toast.success('Logo size updated');
      })
      .catch((error) => {
        console.error('Failed to update logo size:', error);
        toast.error('Failed to update logo size');
      });
  };

  return (
    <div className="space-y-6">
      {/* Logo Upload with Preview */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Logo</h3>
        
        {/* Logo Preview with Upload Icon Overlay */}
        <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50 group hover:border-gray-400 transition-all duration-200">
          {logoUrl ? (
            <div className="relative">
              <img
                src={logoUrl}
                alt="Header logo"
                className="max-w-full max-h-32 mx-auto object-contain transition-transform duration-200 group-hover:scale-105"
              />
              {/* Delete Icon - Top Right */}
              <button
                onClick={handleLogoRemove}
                className="absolute top-0 right-0 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
                title="Remove logo"
                aria-label="Remove logo"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
              {/* Upload/Change Icon - Bottom Right */}
              <button
                onClick={handleLogoUpload}
                className="absolute bottom-0 right-0 p-1.5 text-white rounded-full transition-colors shadow-lg"
                style={{ backgroundColor: primary.base }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = primary.hover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = primary.base;
                }}
                title="Change logo"
                aria-label="Change logo"
              >
                <PhotoIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogoUpload}
              className="flex flex-col items-center justify-center py-6 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors w-full"
            >
              <PhotoIcon className="w-12 h-12 mb-2" />
              <p className="text-xs">Click to upload logo</p>
            </button>
          )}
        </div>
      </div>

      {/* Position & Size */}
      <div className="space-y-4">
        {/* Position - L/C/R Buttons */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Position
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['left', 'center', 'right'] as const).map((position) => (
              <button
                key={position}
                onClick={() => handlePositionChange(position)}
                className={cn(
                  'px-3 py-2.5 border-2 rounded-lg text-center transition-all font-bold text-sm',
                  logoPosition === position
                    ? 'shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
                style={
                  logoPosition === position
                    ? {
                        borderColor: primary.base,
                        backgroundColor: `${primary.base}10`,
                        color: primary.base
                      }
                    : {}
                }
                aria-label={`Align logo to ${position}`}
              >
                {position === 'left' ? 'L' : position === 'center' ? 'C' : 'R'}
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Size
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['sm', 'md', 'lg'] as const).map((size) => (
              <button
                key={size}
                onClick={() => handleSizeChange(size)}
                className={cn(
                  'px-3 py-2 border-2 rounded-lg text-center transition-all font-medium text-xs',
                  logoSize === size
                    ? 'shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
                style={
                  logoSize === size
                    ? {
                        borderColor: primary.base,
                        backgroundColor: `${primary.base}10`,
                        color: primary.base
                      }
                    : {}
                }
                aria-label={`Set logo size to ${size}`}
              >
                <div className="uppercase">{size}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Size Guide */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium">Size Guide:</span><br />
            <span className="text-gray-500 dark:text-gray-500">
              SM: 32px · MD: 48px · LG: 64px
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
