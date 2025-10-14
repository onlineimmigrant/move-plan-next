import React from 'react';
import { ColorSelect } from './ColorSelect';
import { HeaderStyle, HeaderType, MenuWidth } from '@/types/settings';

interface HeaderStyleFieldProps {
  label: string;
  name: string;
  value: HeaderStyle | string | null;
  onChange: (name: string, value: HeaderStyle) => void;
}

const HEADER_TYPES: { value: HeaderType; label: string; description: string }[] = [
  { value: 'default', label: 'Default', description: 'Full-featured header with auto-hide on scroll' },
  { value: 'transparent', label: 'Transparent', description: 'Transparent header that becomes solid on scroll' },
  { value: 'fixed', label: 'Fixed', description: 'Always visible header that stays fixed during scrolling' }
];

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

export const HeaderStyleField: React.FC<HeaderStyleFieldProps> = ({
  label,
  name,
  value,
  onChange
}) => {
  console.log('🎨 HeaderStyleField render:', { name, value, valueType: typeof value });

  // Parse the current value
  const currentValue: HeaderStyle = 
    typeof value === 'object' && value !== null
      ? value
      : {
          type: 'default',
          background: 'white',
          color: 'gray-700',
          color_hover: 'gray-900',
          menu_width: '7xl',
          menu_items_are_text: true
        };

  console.log('🎨 HeaderStyleField currentValue:', currentValue);

  const handleColorChange = (field: keyof HeaderStyle, colorValue: string) => {
    console.log('🎨 HeaderStyleField handleColorChange called:', { field, colorValue });
    const newValue: HeaderStyle = {
      ...currentValue,
      [field]: colorValue
    };
    console.log('🎨 HeaderStyleField calling onChange with:', { name, newValue });
    onChange(name, newValue);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('🎨 HeaderStyleField handleTypeChange called:', e.target.value);
    const newValue: HeaderStyle = {
      ...currentValue,
      type: e.target.value as HeaderType
    };
    onChange(name, newValue);
  };

  const handleMenuWidthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('🎨 HeaderStyleField handleMenuWidthChange called:', e.target.value);
    const newValue: HeaderStyle = {
      ...currentValue,
      menu_width: e.target.value as MenuWidth
    };
    onChange(name, newValue);
  };

  const handleDisplayModeToggle = () => {
    console.log('🎨 HeaderStyleField handleDisplayModeToggle called');
    const newValue: HeaderStyle = {
      ...currentValue,
      menu_items_are_text: !currentValue.menu_items_are_text
    };
    onChange(name, newValue);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 mb-4">{label}</label>
      
      {/* Header Type Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Header Layout Type
        </label>
        <select
          value={currentValue.type || 'default'}
          onChange={handleTypeChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {HEADER_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label} - {type.description}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Choose the layout style for your header
        </p>
      </div>

      {/* Menu Width Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Menu Width
        </label>
        <select
          value={currentValue.menu_width || '7xl'}
          onChange={handleMenuWidthChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {MENU_WIDTHS.map((width) => (
            <option key={width.value} value={width.value}>
              {width.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Maximum width for header content container
        </p>
      </div>

      {/* Display Mode Toggle */}
      <div className="mb-6">
        <label className="flex items-center justify-between p-4 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
          <div>
            <span className="block text-sm font-medium text-gray-700">
              Display Menu Items as Text
            </span>
            <span className="block text-xs text-gray-500 mt-1">
              Toggle between text labels and icons for menu items
            </span>
          </div>
          <button
            type="button"
            onClick={handleDisplayModeToggle}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              currentValue.menu_items_are_text ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            role="switch"
            aria-checked={currentValue.menu_items_are_text ?? true}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                currentValue.menu_items_are_text ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </label>
      </div>

      {/* Color Pickers */}
      <div className="grid grid-cols-1 gap-4">
        <ColorSelect
          label="Background Color"
          name={`${name}_background`}
          value={currentValue.background || 'white'}
          onChange={(_, value) => handleColorChange('background', value)}
        />
        
        <ColorSelect
          label="Text Color"
          name={`${name}_color`}
          value={currentValue.color || 'gray-700'}
          onChange={(_, value) => handleColorChange('color', value)}
        />
        
        <ColorSelect
          label="Text Hover Color"
          name={`${name}_color_hover`}
          value={currentValue.color_hover || 'gray-900'}
          onChange={(_, value) => handleColorChange('color_hover', value)}
        />
      </div>
      
      {/* Preview */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs font-medium text-gray-600 mb-2">Preview:</p>
        <div 
          className={`p-4 rounded-md ${!currentValue.background?.startsWith('#') ? `bg-${currentValue.background}` : ''}`}
          style={{
            backgroundColor: currentValue.background?.startsWith('#') 
              ? currentValue.background 
              : undefined
          }}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Type: <span className="font-medium">{currentValue.type || 'default'}</span>
              </p>
              <p className="text-xs text-gray-500">
                Width: <span className="font-medium">{currentValue.menu_width || '7xl'}</span>
              </p>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Display: <span className="font-medium">{currentValue.menu_items_are_text ? 'Text' : 'Icons'}</span>
            </p>
            <p 
              className={`text-sm ${!currentValue.color?.startsWith('#') ? `text-${currentValue.color}` : ''}`}
              style={{
                color: currentValue.color?.startsWith('#') 
                  ? currentValue.color 
                  : undefined
              }}
            >
              Sample menu item
            </p>
            <p 
              className={`text-sm ${!currentValue.color_hover?.startsWith('#') ? `text-${currentValue.color_hover}` : ''}`}
              style={{
                color: currentValue.color_hover?.startsWith('#') 
                  ? currentValue.color_hover 
                  : undefined
              }}
            >
              Sample menu item on hover
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
