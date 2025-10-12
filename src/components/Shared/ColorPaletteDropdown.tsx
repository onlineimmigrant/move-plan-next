// components/Shared/ColorPaletteDropdown.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SwatchIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// Tailwind color palette - Extended with more colors and transparency
const COLOR_PALETTE = [
  { name: 'Transparent', value: 'transparent', class: 'transparent' },
  { name: 'White', value: '#FFFFFF', class: 'white' },
  { name: 'Black', value: '#000000', class: 'black' },
  { name: 'Gray 50', value: '#F9FAFB', class: 'gray-50' },
  { name: 'Gray 100', value: '#F3F4F6', class: 'gray-100' },
  { name: 'Gray 200', value: '#E5E7EB', class: 'gray-200' },
  { name: 'Gray 300', value: '#D1D5DB', class: 'gray-300' },
  { name: 'Gray 400', value: '#9CA3AF', class: 'gray-400' },
  { name: 'Gray 500', value: '#6B7280', class: 'gray-500' },
  { name: 'Gray 600', value: '#4B5563', class: 'gray-600' },
  { name: 'Gray 700', value: '#374151', class: 'gray-700' },
  { name: 'Gray 800', value: '#1F2937', class: 'gray-800' },
  { name: 'Gray 900', value: '#111827', class: 'gray-900' },
  { name: 'Slate 50', value: '#F8FAFC', class: 'slate-50' },
  { name: 'Slate 100', value: '#F1F5F9', class: 'slate-100' },
  { name: 'Slate 200', value: '#E2E8F0', class: 'slate-200' },
  { name: 'Slate 300', value: '#CBD5E1', class: 'slate-300' },
  { name: 'Slate 400', value: '#94A3B8', class: 'slate-400' },
  { name: 'Slate 500', value: '#64748B', class: 'slate-500' },
  { name: 'Slate 600', value: '#475569', class: 'slate-600' },
  { name: 'Slate 700', value: '#334155', class: 'slate-700' },
  { name: 'Slate 800', value: '#1E293B', class: 'slate-800' },
  { name: 'Slate 900', value: '#0F172A', class: 'slate-900' },
  { name: 'Blue 50', value: '#EFF6FF', class: 'blue-50' },
  { name: 'Blue 100', value: '#DBEAFE', class: 'blue-100' },
  { name: 'Blue 200', value: '#BFDBFE', class: 'blue-200' },
  { name: 'Blue 300', value: '#93C5FD', class: 'blue-300' },
  { name: 'Blue 400', value: '#60A5FA', class: 'blue-400' },
  { name: 'Blue 500', value: '#3B82F6', class: 'blue-500' },
  { name: 'Blue 600', value: '#2563EB', class: 'blue-600' },
  { name: 'Blue 700', value: '#1D4ED8', class: 'blue-700' },
  { name: 'Blue 800', value: '#1E40AF', class: 'blue-800' },
  { name: 'Blue 900', value: '#1E3A8A', class: 'blue-900' },
  { name: 'Sky 50', value: '#F0F9FF', class: 'sky-50' },
  { name: 'Sky 100', value: '#E0F2FE', class: 'sky-100' },
  { name: 'Sky 200', value: '#BAE6FD', class: 'sky-200' },
  { name: 'Sky 300', value: '#7DD3FC', class: 'sky-300' },
  { name: 'Sky 400', value: '#38BDF8', class: 'sky-400' },
  { name: 'Sky 500', value: '#0EA5E9', class: 'sky-500' },
  { name: 'Sky 600', value: '#0284C7', class: 'sky-600' },
  { name: 'Sky 700', value: '#0369A1', class: 'sky-700' },
  { name: 'Sky 800', value: '#075985', class: 'sky-800' },
  { name: 'Sky 900', value: '#0C4A6E', class: 'sky-900' },
  { name: 'Indigo 50', value: '#EEF2FF', class: 'indigo-50' },
  { name: 'Indigo 100', value: '#E0E7FF', class: 'indigo-100' },
  { name: 'Indigo 200', value: '#C7D2FE', class: 'indigo-200' },
  { name: 'Indigo 300', value: '#A5B4FC', class: 'indigo-300' },
  { name: 'Indigo 400', value: '#818CF8', class: 'indigo-400' },
  { name: 'Indigo 500', value: '#6366F1', class: 'indigo-500' },
  { name: 'Indigo 600', value: '#4F46E5', class: 'indigo-600' },
  { name: 'Indigo 700', value: '#4338CA', class: 'indigo-700' },
  { name: 'Indigo 800', value: '#3730A3', class: 'indigo-800' },
  { name: 'Indigo 900', value: '#312E81', class: 'indigo-900' },
  { name: 'Purple 50', value: '#FAF5FF', class: 'purple-50' },
  { name: 'Purple 100', value: '#F3E8FF', class: 'purple-100' },
  { name: 'Purple 200', value: '#E9D5FF', class: 'purple-200' },
  { name: 'Purple 300', value: '#D8B4FE', class: 'purple-300' },
  { name: 'Purple 400', value: '#C084FC', class: 'purple-400' },
  { name: 'Purple 500', value: '#A855F7', class: 'purple-500' },
  { name: 'Purple 600', value: '#9333EA', class: 'purple-600' },
  { name: 'Purple 700', value: '#7E22CE', class: 'purple-700' },
  { name: 'Purple 800', value: '#6B21A8', class: 'purple-800' },
  { name: 'Purple 900', value: '#581C87', class: 'purple-900' },
  { name: 'Pink 50', value: '#FDF2F8', class: 'pink-50' },
  { name: 'Pink 100', value: '#FCE7F3', class: 'pink-100' },
  { name: 'Pink 200', value: '#FBCFE8', class: 'pink-200' },
  { name: 'Pink 300', value: '#F9A8D4', class: 'pink-300' },
  { name: 'Pink 400', value: '#F472B6', class: 'pink-400' },
  { name: 'Pink 500', value: '#EC4899', class: 'pink-500' },
  { name: 'Pink 600', value: '#DB2777', class: 'pink-600' },
  { name: 'Pink 700', value: '#BE185D', class: 'pink-700' },
  { name: 'Pink 800', value: '#9D174D', class: 'pink-800' },
  { name: 'Pink 900', value: '#831843', class: 'pink-900' },
  { name: 'Rose 50', value: '#FFF1F2', class: 'rose-50' },
  { name: 'Rose 100', value: '#FFE4E6', class: 'rose-100' },
  { name: 'Rose 200', value: '#FECDD3', class: 'rose-200' },
  { name: 'Rose 300', value: '#FDA4AF', class: 'rose-300' },
  { name: 'Rose 400', value: '#FB7185', class: 'rose-400' },
  { name: 'Rose 500', value: '#F43F5E', class: 'rose-500' },
  { name: 'Rose 600', value: '#E11D48', class: 'rose-600' },
  { name: 'Rose 700', value: '#BE123C', class: 'rose-700' },
  { name: 'Rose 800', value: '#9F1239', class: 'rose-800' },
  { name: 'Rose 900', value: '#881337', class: 'rose-900' },
  { name: 'Red 50', value: '#FEF2F2', class: 'red-50' },
  { name: 'Red 100', value: '#FEE2E2', class: 'red-100' },
  { name: 'Red 200', value: '#FECACA', class: 'red-200' },
  { name: 'Red 300', value: '#FCA5A5', class: 'red-300' },
  { name: 'Red 400', value: '#F87171', class: 'red-400' },
  { name: 'Red 500', value: '#EF4444', class: 'red-500' },
  { name: 'Red 600', value: '#DC2626', class: 'red-600' },
  { name: 'Red 700', value: '#B91C1C', class: 'red-700' },
  { name: 'Red 800', value: '#991B1B', class: 'red-800' },
  { name: 'Red 900', value: '#7F1D1D', class: 'red-900' },
  { name: 'Orange 50', value: '#FFF7ED', class: 'orange-50' },
  { name: 'Orange 100', value: '#FFEDD5', class: 'orange-100' },
  { name: 'Orange 200', value: '#FED7AA', class: 'orange-200' },
  { name: 'Orange 300', value: '#FDBA74', class: 'orange-300' },
  { name: 'Orange 400', value: '#FB923C', class: 'orange-400' },
  { name: 'Orange 500', value: '#F97316', class: 'orange-500' },
  { name: 'Orange 600', value: '#EA580C', class: 'orange-600' },
  { name: 'Orange 700', value: '#C2410C', class: 'orange-700' },
  { name: 'Orange 800', value: '#9A3412', class: 'orange-800' },
  { name: 'Orange 900', value: '#7C2D12', class: 'orange-900' },
  { name: 'Amber 50', value: '#FFFBEB', class: 'amber-50' },
  { name: 'Amber 100', value: '#FEF3C7', class: 'amber-100' },
  { name: 'Amber 200', value: '#FDE68A', class: 'amber-200' },
  { name: 'Amber 300', value: '#FCD34D', class: 'amber-300' },
  { name: 'Amber 400', value: '#FBBF24', class: 'amber-400' },
  { name: 'Amber 500', value: '#F59E0B', class: 'amber-500' },
  { name: 'Amber 600', value: '#D97706', class: 'amber-600' },
  { name: 'Amber 700', value: '#B45309', class: 'amber-700' },
  { name: 'Amber 800', value: '#92400E', class: 'amber-800' },
  { name: 'Amber 900', value: '#78350F', class: 'amber-900' },
  { name: 'Yellow 50', value: '#FEFCE8', class: 'yellow-50' },
  { name: 'Yellow 100', value: '#FEF9C3', class: 'yellow-100' },
  { name: 'Yellow 200', value: '#FEF08A', class: 'yellow-200' },
  { name: 'Yellow 300', value: '#FDE047', class: 'yellow-300' },
  { name: 'Yellow 400', value: '#FACC15', class: 'yellow-400' },
  { name: 'Yellow 500', value: '#EAB308', class: 'yellow-500' },
  { name: 'Yellow 600', value: '#CA8A04', class: 'yellow-600' },
  { name: 'Yellow 700', value: '#A16207', class: 'yellow-700' },
  { name: 'Yellow 800', value: '#854D0E', class: 'yellow-800' },
  { name: 'Yellow 900', value: '#713F12', class: 'yellow-900' },
  { name: 'Lime 50', value: '#F7FEE7', class: 'lime-50' },
  { name: 'Lime 100', value: '#ECFCCB', class: 'lime-100' },
  { name: 'Lime 200', value: '#D9F99D', class: 'lime-200' },
  { name: 'Lime 300', value: '#BEF264', class: 'lime-300' },
  { name: 'Lime 400', value: '#A3E635', class: 'lime-400' },
  { name: 'Lime 500', value: '#84CC16', class: 'lime-500' },
  { name: 'Lime 600', value: '#65A30D', class: 'lime-600' },
  { name: 'Lime 700', value: '#4D7C0F', class: 'lime-700' },
  { name: 'Lime 800', value: '#3F6212', class: 'lime-800' },
  { name: 'Lime 900', value: '#365314', class: 'lime-900' },
  { name: 'Green 50', value: '#F0FDF4', class: 'green-50' },
  { name: 'Green 100', value: '#DCFCE7', class: 'green-100' },
  { name: 'Green 200', value: '#BBF7D0', class: 'green-200' },
  { name: 'Green 300', value: '#86EFAC', class: 'green-300' },
  { name: 'Green 400', value: '#4ADE80', class: 'green-400' },
  { name: 'Green 500', value: '#22C55E', class: 'green-500' },
  { name: 'Green 600', value: '#16A34A', class: 'green-600' },
  { name: 'Green 700', value: '#15803D', class: 'green-700' },
  { name: 'Green 800', value: '#166534', class: 'green-800' },
  { name: 'Green 900', value: '#14532D', class: 'green-900' },
  { name: 'Emerald 50', value: '#ECFDF5', class: 'emerald-50' },
  { name: 'Emerald 100', value: '#D1FAE5', class: 'emerald-100' },
  { name: 'Emerald 200', value: '#A7F3D0', class: 'emerald-200' },
  { name: 'Emerald 300', value: '#6EE7B7', class: 'emerald-300' },
  { name: 'Emerald 400', value: '#34D399', class: 'emerald-400' },
  { name: 'Emerald 500', value: '#10B981', class: 'emerald-500' },
  { name: 'Emerald 600', value: '#059669', class: 'emerald-600' },
  { name: 'Emerald 700', value: '#047857', class: 'emerald-700' },
  { name: 'Emerald 800', value: '#065F46', class: 'emerald-800' },
  { name: 'Emerald 900', value: '#064E3B', class: 'emerald-900' },
  { name: 'Teal 50', value: '#F0FDFA', class: 'teal-50' },
  { name: 'Teal 100', value: '#CCFBF1', class: 'teal-100' },
  { name: 'Teal 200', value: '#99F6E4', class: 'teal-200' },
  { name: 'Teal 300', value: '#5EEAD4', class: 'teal-300' },
  { name: 'Teal 400', value: '#2DD4BF', class: 'teal-400' },
  { name: 'Teal 500', value: '#14B8A6', class: 'teal-500' },
  { name: 'Teal 600', value: '#0D9488', class: 'teal-600' },
  { name: 'Teal 700', value: '#0F766E', class: 'teal-700' },
  { name: 'Teal 800', value: '#115E59', class: 'teal-800' },
  { name: 'Teal 900', value: '#134E4A', class: 'teal-900' },
  { name: 'Cyan 50', value: '#ECFEFF', class: 'cyan-50' },
  { name: 'Cyan 100', value: '#CFFAFE', class: 'cyan-100' },
  { name: 'Cyan 200', value: '#A5F3FC', class: 'cyan-200' },
  { name: 'Cyan 300', value: '#67E8F9', class: 'cyan-300' },
  { name: 'Cyan 400', value: '#22D3EE', class: 'cyan-400' },
  { name: 'Cyan 500', value: '#06B6D4', class: 'cyan-500' },
  { name: 'Cyan 600', value: '#0891B2', class: 'cyan-600' },
  { name: 'Cyan 700', value: '#0E7490', class: 'cyan-700' },
  { name: 'Cyan 800', value: '#155E75', class: 'cyan-800' },
  { name: 'Cyan 900', value: '#164E63', class: 'cyan-900' },
];

// Helper function to get color value (hex) from class name or return hex if already hex
export const getColorValue = (colorClassOrHex: string | null | undefined): string => {
  if (!colorClassOrHex) return '#FFFFFF';
  if (colorClassOrHex.startsWith('#')) {
    // Already a hex value, find matching class
    const color = COLOR_PALETTE.find(c => c.value === colorClassOrHex);
    return color?.value || colorClassOrHex;
  }
  // It's a class name, find the hex value
  const color = COLOR_PALETTE.find(c => c.class === colorClassOrHex);
  return color?.value || '#FFFFFF';
};

// Helper function to get color class from hex or return class if already class
export const getColorClass = (colorClassOrHex: string | null | undefined): string => {
  if (!colorClassOrHex) return 'white';
  if (colorClassOrHex.startsWith('#')) {
    // It's a hex value, find the class
    const color = COLOR_PALETTE.find(c => c.value === colorClassOrHex);
    return color?.class || 'white';
  }
  // Already a class name
  return colorClassOrHex;
};

interface ColorPaletteDropdownProps {
  value: string;
  onChange: (colorClass: string) => void;
  onClose?: () => void;
  buttonClassName?: string;
  previewSize?: 'sm' | 'md' | 'lg';
  iconSize?: 'sm' | 'md' | 'lg';
  title?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement>;
  useFixedPosition?: boolean;
}

const PREVIEW_SIZES = {
  sm: 'w-2.5 h-2.5',
  md: 'w-4 h-4',
  lg: 'w-6 h-6',
};

const ICON_SIZES = {
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export default function ColorPaletteDropdown({
  value,
  onChange,
  onClose,
  buttonClassName,
  previewSize = 'md',
  iconSize = 'md',
  title = 'Background color',
  isOpen: controlledIsOpen,
  onToggle,
  buttonRef: externalButtonRef,
  useFixedPosition = false,
}: ColorPaletteDropdownProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const internalButtonRef = React.useRef<HTMLButtonElement>(null);
  const buttonRef = externalButtonRef || internalButtonRef;
  
  // Use controlled or uncontrolled state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  // Close dropdown when clicking outside
  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target.closest('.dropdown-container')) {
          if (onClose) {
            onClose();
          } else {
            setInternalIsOpen(false);
          }
        }
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  const handleColorSelect = (colorClass: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(colorClass);
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  return (
    <div className="dropdown-container">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={cn(
          'p-2 rounded-lg transition-colors flex items-center gap-1',
          isOpen
            ? 'bg-sky-100 text-sky-700'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
          buttonClassName
        )}
        title={title}
        type="button"
      >
        <SwatchIcon className={ICON_SIZES[iconSize]} />
        <div 
          className={cn(
            'rounded border border-gray-300',
            PREVIEW_SIZES[previewSize]
          )}
          style={{ backgroundColor: getColorValue(value) }}
        />
      </button>
      {isOpen && buttonRef.current && useFixedPosition && typeof window !== 'undefined' && createPortal(
        (() => {
          const rect = buttonRef.current!.getBoundingClientRect();
          return (
            <div 
              className="dropdown-container fixed bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-[9999] w-80 max-h-96 overflow-y-auto"
              style={{
                top: `${rect.bottom + 8}px`,
                left: `${rect.left}px`,
              }}
            >
              <div className="grid grid-cols-6 gap-2">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color.value}
                    onClick={(e) => handleColorSelect(color.class, e)}
                    className={cn(
                      'w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 relative',
                      getColorClass(value) === color.class
                        ? 'border-sky-500 ring-2 ring-sky-200'
                        : 'border-gray-200 hover:border-gray-300',
                      color.class === 'transparent' && 'bg-gradient-to-br from-gray-100 to-white'
                    )}
                    style={{ 
                      backgroundColor: color.class === 'transparent' ? 'transparent' : color.value 
                    }}
                    title={color.name}
                    type="button"
                  >
                    {color.class === 'transparent' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-0.5 bg-red-500 rotate-45" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })(),
        document.body
      )}
      {isOpen && !useFixedPosition && (
        <div className="dropdown-container absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-[100] w-80 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-6 gap-2">
            {COLOR_PALETTE.map((color) => (
              <button
                key={color.value}
                onClick={(e) => handleColorSelect(color.class, e)}
                className={cn(
                  'w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 relative',
                  getColorClass(value) === color.class
                    ? 'border-sky-500 ring-2 ring-sky-200'
                    : 'border-gray-200 hover:border-gray-300',
                  color.class === 'transparent' && 'bg-gradient-to-br from-gray-100 to-white'
                )}
                style={{ 
                  backgroundColor: color.class === 'transparent' ? 'transparent' : color.value 
                }}
                title={color.name}
                type="button"
              >
                {color.class === 'transparent' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-0.5 bg-red-500 rotate-45" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
