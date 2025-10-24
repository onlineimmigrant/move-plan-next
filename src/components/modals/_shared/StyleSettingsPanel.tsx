import React, { useState } from 'react';
import { HeaderStyle, FooterStyle, MenuWidth, LogoHeight } from '@/types/settings';
import { Disclosure } from '@headlessui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

const MENU_WIDTHS: { value: MenuWidth; label: string }[] = [
  { value: 'lg', label: 'Large (1024px)' },
  { value: 'xl', label: 'Extra Large (1280px)' },
  { value: '2xl', label: '2X Large (1536px)' },
  { value: '3xl', label: '3X Large (1792px)' },
  { value: '4xl', label: '4X Large (2048px)' },
  { value: '5xl', label: '5X Large (2304px)' },
  { value: '6xl', label: '6X Large (2560px)' },
  { value: '7xl', label: '7X Large (2816px)' }
];

const LOGO_HEIGHTS: { value: LogoHeight; label: string }[] = [
  { value: 'h-8', label: 'Small (32px)' },
  { value: 'h-10', label: 'Medium (40px)' },
  { value: 'h-12', label: 'Large (48px)' },
  { value: 'h-16', label: 'Extra Large (64px)' }
];

const TAILWIND_COLORS = [
  'white', 'black', 'gray-50', 'gray-100', 'gray-200', 'gray-300', 'gray-400', 'gray-500', 
  'gray-600', 'gray-700', 'gray-800', 'gray-900', 'gray-950',
  'slate-50', 'slate-100', 'slate-200', 'slate-300', 'slate-400', 'slate-500', 
  'slate-600', 'slate-700', 'slate-800', 'slate-900', 'slate-950',
  'neutral-50', 'neutral-100', 'neutral-200', 'neutral-300', 'neutral-400', 'neutral-500', 
  'neutral-600', 'neutral-700', 'neutral-800', 'neutral-900', 'neutral-950',
  'sky-50', 'sky-100', 'sky-200', 'sky-300', 'sky-400', 'sky-500', 
  'sky-600', 'sky-700', 'sky-800', 'sky-900', 'sky-950',
  'blue-50', 'blue-100', 'blue-200', 'blue-300', 'blue-400', 'blue-500', 
  'blue-600', 'blue-700', 'blue-800', 'blue-900', 'blue-950',
  'emerald-50', 'emerald-100', 'emerald-200', 'emerald-300', 'emerald-400', 'emerald-500', 
  'emerald-600', 'emerald-700', 'emerald-800', 'emerald-900', 'emerald-950',
];

interface StyleSettingsPanelProps {
  type: 'header' | 'footer';
  style: HeaderStyle | FooterStyle | string;
  onStyleChange: (style: HeaderStyle | FooterStyle) => void;
}

export const StyleSettingsPanel: React.FC<StyleSettingsPanelProps> = ({
  type,
  style,
  onStyleChange
}) => {
  // Parse current style
  const currentStyle: HeaderStyle | FooterStyle = typeof style === 'object' && style !== null
    ? style
    : type === 'header'
      ? {
          type: 'default',
          background: 'white',
          color: 'gray-700',
          color_hover: 'gray-900',
          menu_width: '7xl',
          menu_items_are_text: true,
          logo_height: 'h-12'
        }
      : {
          type: 'default',
          background: 'neutral-900',
          color: 'neutral-400',
          color_hover: 'white'
        };

  const handleFieldChange = (field: string, value: any) => {
    const newStyle = {
      ...currentStyle,
      [field]: value
    };
    onStyleChange(newStyle);
  };

  const handleGradientChange = (field: 'from' | 'via' | 'to', value: string) => {
    const newStyle = {
      ...currentStyle,
      gradient: {
        ...(currentStyle.gradient || { from: 'gray-900', to: 'gray-700' }),
        [field]: value
      }
    };
    onStyleChange(newStyle);
  };

  const toggleGradient = () => {
    const newStyle = {
      ...currentStyle,
      is_gradient: !currentStyle.is_gradient,
      gradient: currentStyle.gradient || {
        from: type === 'header' ? 'gray-50' : 'gray-900',
        to: type === 'header' ? 'white' : 'gray-800'
      }
    };
    onStyleChange(newStyle);
  };

  return (
    <Disclosure defaultOpen={false}>
      {({ open }) => (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <Disclosure.Button className="w-full px-4 py-3 text-left bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-colors flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <span className="text-sm font-semibold text-gray-900">
                {type === 'header' ? 'Header' : 'Footer'} Style Settings
              </span>
            </div>
            {open ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-500" />
            )}
          </Disclosure.Button>

          <Disclosure.Panel className="px-4 py-4 bg-white space-y-4">
            {/* Menu Width (Header only) */}
            {type === 'header' && 'menu_width' in currentStyle && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Content Width
                </label>
                <select
                  value={(currentStyle as HeaderStyle).menu_width || '7xl'}
                  onChange={(e) => handleFieldChange('menu_width', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {MENU_WIDTHS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Logo Height (Header only) */}
            {type === 'header' && 'logo_height' in currentStyle && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Logo Height (Desktop)
                </label>
                <select
                  value={(currentStyle as HeaderStyle).logo_height || 'h-12'}
                  onChange={(e) => handleFieldChange('logo_height', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {LOGO_HEIGHTS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Mobile is fixed at 32px</p>
              </div>
            )}

            {/* Background Type Toggle */}
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
              <span className="text-xs font-medium text-gray-700">Use Gradient Background</span>
              <button
                type="button"
                onClick={toggleGradient}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  currentStyle.is_gradient ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    currentStyle.is_gradient ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Background Color or Gradient */}
            {currentStyle.is_gradient ? (
              <div className="space-y-3 p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  <span className="text-xs font-semibold text-purple-900">Gradient Colors</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">From</label>
                  <select
                    value={currentStyle.gradient?.from || 'gray-900'}
                    onChange={(e) => handleGradientChange('from', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {TAILWIND_COLORS.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Via (Optional)</label>
                  <select
                    value={currentStyle.gradient?.via || ''}
                    onChange={(e) => handleGradientChange('via', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">None</option>
                    {TAILWIND_COLORS.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">To</label>
                  <select
                    value={currentStyle.gradient?.to || 'gray-700'}
                    onChange={(e) => handleGradientChange('to', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {TAILWIND_COLORS.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Background Color
                </label>
                <select
                  value={currentStyle.background || 'white'}
                  onChange={(e) => handleFieldChange('background', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {TAILWIND_COLORS.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Text Color */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Text Color
              </label>
              <select
                value={currentStyle.color || 'gray-700'}
                onChange={(e) => handleFieldChange('color', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {TAILWIND_COLORS.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>

            {/* Hover Color */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Text Hover Color
              </label>
              <select
                value={currentStyle.color_hover || 'gray-900'}
                onChange={(e) => handleFieldChange('color_hover', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {TAILWIND_COLORS.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>

            {/* Preview */}
            <div className="mt-4 p-4 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-xs font-medium text-gray-500 mb-2">Preview:</div>
              <div
                className={`p-4 rounded-lg ${
                  currentStyle.is_gradient
                    ? `bg-gradient-to-r from-${currentStyle.gradient?.from} ${
                        currentStyle.gradient?.via ? `via-${currentStyle.gradient.via}` : ''
                      } to-${currentStyle.gradient?.to}`
                    : `bg-${currentStyle.background}`
                }`}
                style={{
                  ...(currentStyle.is_gradient && {
                    backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`
                  })
                }}
              >
                <p className={`text-${currentStyle.color} text-sm font-medium mb-1`}>
                  Sample text
                </p>
                <p className={`text-${currentStyle.color_hover} text-sm`}>
                  Hover state text
                </p>
              </div>
            </div>
          </Disclosure.Panel>
        </div>
      )}
    </Disclosure>
  );
};
