/**
 * StandardModalFooter Component
 * 
 * Footer with action buttons and flexible alignment
 */

'use client';

import React from 'react';
import { StandardModalFooterProps, FooterAlignment } from '../types';
import { MODAL_SPACING } from '../utils/modalConstants';

/**
 * Standard Modal Footer
 * 
 * Provides:
 * - Primary, secondary, and tertiary action buttons
 * - Flexible alignment options
 * - Loading states for buttons
 * - Responsive padding
 */
export const StandardModalFooter: React.FC<StandardModalFooterProps> = ({
  primaryAction,
  secondaryAction,
  tertiaryActions = [],
  align = 'right',
  className = '',
  borderTop = true,
  children,
}) => {
  const padding = MODAL_SPACING.footerPadding;

  const getAlignmentClass = (alignment: FooterAlignment): string => {
    switch (alignment) {
      case 'left':
        return 'justify-start';
      case 'center':
        return 'justify-center';
      case 'right':
        return 'justify-end';
      case 'between':
        return 'justify-between';
      default:
        return 'justify-end';
    }
  };

  const getButtonVariantClass = (variant: string = 'primary'): string => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'secondary':
        return 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      default:
        return 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white';
    }
  };

  const renderButton = (action: typeof primaryAction) => {
    if (!action) return null;

    const ButtonIcon = action.icon;

    return (
      <button
        key={action.label}
        onClick={action.onClick}
        disabled={action.disabled || action.loading}
        className={`
          px-4 py-2 rounded-lg font-medium text-sm
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center gap-2
          ${getButtonVariantClass(action.variant)}
          ${action.className || ''}
        `}
        style={{
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {action.loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {ButtonIcon && <ButtonIcon className="w-4 h-4" />}
            <span>{action.label}</span>
          </>
        )}
      </button>
    );
  };

  // If custom children provided, use them
  if (children) {
    return (
      <div
        className={`flex ${borderTop ? 'border-t border-gray-200 dark:border-gray-700' : ''} ${className}`}
        style={{ padding }}
      >
        {children}
      </div>
    );
  }

  // Default action buttons layout
  return (
    <div
      className={`flex items-center gap-2 ${getAlignmentClass(align)} ${
        borderTop ? 'border-t border-gray-200 dark:border-gray-700' : ''
      } ${className}`}
      style={{ padding }}
    >
      {/* Tertiary actions (left side for 'between' alignment) */}
      {align === 'between' && tertiaryActions.length > 0 && (
        <div className="flex items-center gap-2">
          {tertiaryActions.map((action) => renderButton(action))}
        </div>
      )}

      {/* Primary and secondary actions */}
      <div className="flex items-center gap-2">
        {/* Tertiary actions (inline for non-'between' alignment) */}
        {align !== 'between' && tertiaryActions.map((action) => renderButton(action))}
        
        {secondaryAction && renderButton(secondaryAction)}
        {primaryAction && renderButton(primaryAction)}
      </div>
    </div>
  );
};
