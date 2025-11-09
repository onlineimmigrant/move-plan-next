'use client';

import React from 'react';
import { useSettings } from '@/context/SettingsContext';

interface LoadingProps {
  className?: string; // Optional className for the container
  dotSize?: string; // Optional size for the dots (defaults to w-4 h-4)
}

const Loading: React.FC<LoadingProps> = ({
  className = '',
  dotSize = 'w-4 h-4',
}) => {
  const { settings } = useSettings();
  const primaryColor = settings?.primary_color || 'sky';
  
  // Generate dynamic background colors based on primary color
  const getBgColor = (shade: number) => {
    return `bg-${primaryColor}-${shade}`;
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-gray-50 ${className}`}
    >
      <div className="flex items-center space-x-2">
        <div
          className={`${dotSize} ${getBgColor(400)} rounded-full animate-bounce`}
          style={{ animationDelay: '0s' }}
        />
        <div
          className={`${dotSize} ${getBgColor(500)} rounded-full animate-bounce`}
          style={{ animationDelay: '0.2s' }}
        />
        <div
          className={`${dotSize} ${getBgColor(600)} rounded-full animate-bounce`}
          style={{ animationDelay: '0.4s' }}
        />
      </div>
    </div>
  );
};

export default Loading;