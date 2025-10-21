'use client';

import React, { useState } from 'react';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import MeetingsAdminModal from './MeetingsAdminModal';

interface MeetingsAdminToggleButtonProps {
  /**
   * Optional custom button text
   * @default "Admin: Manage Meetings"
   */
  buttonText?: string;
  
  /**
   * Optional custom button className
   */
  className?: string;
  
  /**
   * Button variant
   * @default "primary"
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
 * MeetingsAdminToggleButton
 * 
 * Admin-only button that opens the MeetingsAdminModal for full meeting management.
 * Automatically checks user permissions and only renders for admin users.
 * 
 * Features:
 * - Permission checking (admin only)
 * - Customizable appearance
 * - Opens MeetingsAdminModal on click
 * - Responsive design
 * 
 * @example
 * ```tsx
 * <MeetingsAdminToggleButton />
 * ```
 * 
 * @example Custom styling
 * ```tsx
 * <MeetingsAdminToggleButton
 *   buttonText="Schedule Admin Meeting"
 *   variant="secondary"
 *   size="lg"
 * />
 * ```
 */
export default function MeetingsAdminToggleButton({
  buttonText = 'Admin: Manage Meetings',
  className = '',
  variant = 'primary',
  size = 'md',
  showIcon = true,
}: MeetingsAdminToggleButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { session, isAdmin } = useAuth();

  // Check if user is admin
  if (!session || !isAdmin) {
    return null;
  }

  // Variant styles
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
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
          transition-colors duration-200
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
          <CalendarDaysIcon className={iconSizes[size]} aria-hidden="true" />
        )}
        <span>{buttonText}</span>
      </button>

      <MeetingsAdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
