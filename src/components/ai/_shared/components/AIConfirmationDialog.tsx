/**
 * AI Confirmation Dialog Component
 * Modal dialog for confirming destructive actions
 */

'use client';

import React, { useRef } from 'react';
import { AIConfirmationDialogProps } from '../types';
import { AIIcons } from './AIIcons';
import { useFocusTrap } from '../hooks';
import { MODAL_ANIMATION_STYLES } from '../utils';

export const AIConfirmationDialog: React.FC<AIConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
  className = ""
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  
  // Trap focus within dialog
  useFocusTrap(dialogRef, { enabled: isOpen });

  if (!isOpen) return null;

  // Variant-specific styling
  const variantStyles = {
    danger: {
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      confirmBtn: 'bg-red-600 hover:bg-red-700 text-white'
    },
    warning: {
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      confirmBtn: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    info: {
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  };

  const styles = variantStyles[variant];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-[fadeIn_0.2s_ease-out]"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div
          ref={dialogRef}
          className={`
            bg-white rounded-xl shadow-2xl max-w-md w-full p-6
            animate-[slideUp_0.3s_ease-out]
            ${className}
          `}
        >
          {/* Icon */}
          <div className={`${styles.iconBg} w-12 h-12 rounded-full flex items-center justify-center mb-4`}>
            <AIIcons.AlertCircle className={`w-6 h-6 ${styles.iconColor}`} />
          </div>

          {/* Title */}
          <h3
            id="dialog-title"
            className="text-xl font-semibold text-gray-900 mb-2"
          >
            {title}
          </h3>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            {message}
          </p>

          {/* Actions */}
          <div className="flex space-x-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${styles.confirmBtn}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style jsx>{MODAL_ANIMATION_STYLES}</style>
    </>
  );
};
