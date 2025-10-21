'use client';

import React, { useState } from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import MeetingsSettingsModal from '../MeetingsSettingsModal';

interface MeetingsSettingsToggleButtonProps {
  /**
   * Optional custom button text
   * @default "Meeting Settings"
   */
  buttonText?: string;
  
  /**
   * Optional custom button className
   */
  className?: string;
  
  /**
   * Button variant
   * @default "secondary"
   */
  variant?: 'primary' | 'secondary' | 'ghost';
  
  /**
   * Button size
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Show icon in button
   * @default true
   */
  showIcon?: boolean;
}

/**
 * MeetingsSettingsToggleButton
 * 
 * Admin-only button that opens the MeetingsSettingsModal for configuring 24-hour scheduling.
 * Automatically checks user permissions and only renders for admin users.
 * 
 * Features:
 * - Permission checking (admin only)
 * - Customizable appearance
 * - Opens MeetingsSettingsModal on click
 * - Configure 24-hour admin scheduling
 * - Responsive design
 * 
 * @example
 * ```tsx
 * <MeetingsSettingsToggleButton />
 * ```
 * 
 * @example Custom styling
 * ```tsx
 * <MeetingsSettingsToggleButton
 *   buttonText="Configure Meeting Hours"
 *   variant="ghost"
 *   size="sm"
 * />
 * ```
 */
export default function MeetingsSettingsToggleButton({
  buttonText = 'Meeting Settings',
  className = '',
  variant = 'secondary',
  size = 'md',
  showIcon = true,
}: MeetingsSettingsToggleButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { session, isAdmin } = useAuth();

  // Check if user is admin
  if (!session || !isAdmin) {
    return null;
  }

  // Variant styles
  const variantStyles = {
    primary: 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white hover:from-teal-600 hover:to-cyan-700 focus:ring-teal-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 border border-gray-300',
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // Icon sizes
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`
          inline-flex items-center gap-2 rounded-md font-medium
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        type="button"
        aria-label={buttonText}
      >
        {showIcon && (
          <Cog6ToothIcon className={iconSizes[size]} aria-hidden="true" />
        )}
        <span>{buttonText}</span>
      </button>

      <MeetingsSettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
