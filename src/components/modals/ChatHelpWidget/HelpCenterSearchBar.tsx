import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';

interface HelpCenterSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export const HelpCenterSearchBar: React.FC<HelpCenterSearchBarProps> = ({ 
  value, 
  onChange, 
  placeholder 
}) => {
  const themeColors = useThemeColors();

  return (
    <div className="relative max-w-2xl mx-auto group">
      <div 
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 blur-xl"
        style={{ 
          background: `linear-gradient(to right, ${themeColors.cssVars.primary.lighter}, white, ${themeColors.cssVars.primary.lighter})`
        }}
      ></div>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 sm:pl-6 flex items-center pointer-events-none z-10">
          <MagnifyingGlassIcon 
            className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400 transition-colors duration-300"
            style={{ 
              ['--tw-text-opacity' as any]: '1',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.base}
            onMouseLeave={(e) => e.currentTarget.style.color = ''}
          />
        </div>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="relative block w-full pl-12 sm:pl-16 pr-6 sm:pr-8 py-4 sm:py-6 bg-slate-50/80 backdrop-blur-sm border-0 rounded-3xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-500 text-base sm:text-lg font-normal hover:bg-slate-100/80"
          style={{
            ['--tw-ring-color' as any]: `${themeColors.cssVars.primary.base}30`,
          }}
        />
      </div>
    </div>
  );
};
