/**
 * ConfirmationDialog Component
 * 
 * Reusable confirmation modal for destructive actions.
 * Displays warning information and requires explicit confirmation.
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationDialogProps {
  /** Whether the dialog is visible */
  isOpen: boolean;
  /** Dialog title */
  title: string;
  /** Main message to display */
  message: string;
  /** Optional detailed information to display */
  details?: {
    label: string;
    value: string;
  };
  /** Array of consequence descriptions to show */
  consequences?: string[];
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Callback when confirmed */
  onConfirm: () => void;
  /** Callback when cancelled */
  onCancel: () => void;
  /** Variant for different severity levels */
  variant?: 'danger' | 'warning' | 'info';
  /** Whether the confirm action is in progress */
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  details,
  consequences = [],
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
  isLoading = false
}) => {
  if (!isOpen) return null;

  // Variant-specific colors
  const variants = {
    danger: {
      header: 'from-red-500 to-red-600',
      iconBg: 'bg-white/20',
      detailsBg: 'bg-gray-50',
      consequencesBg: 'bg-red-50',
      consequencesBorder: 'border-red-200',
      consequencesIcon: 'text-red-600',
      consequencesTitle: 'text-red-900',
      consequencesText: 'text-red-800',
      confirmButton: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      header: 'from-amber-500 to-amber-600',
      iconBg: 'bg-white/20',
      detailsBg: 'bg-gray-50',
      consequencesBg: 'bg-amber-50',
      consequencesBorder: 'border-amber-200',
      consequencesIcon: 'text-amber-600',
      consequencesTitle: 'text-amber-900',
      consequencesText: 'text-amber-800',
      confirmButton: 'bg-amber-600 hover:bg-amber-700'
    },
    info: {
      header: 'from-blue-500 to-blue-600',
      iconBg: 'bg-white/20',
      detailsBg: 'bg-gray-50',
      consequencesBg: 'bg-blue-50',
      consequencesBorder: 'border-blue-200',
      consequencesIcon: 'text-blue-600',
      consequencesTitle: 'text-blue-900',
      consequencesText: 'text-blue-800',
      confirmButton: 'bg-blue-600 hover:bg-blue-700'
    }
  };

  const colors = variants[variant];

  return (
    <div className="fixed inset-0 z-[10003] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${colors.header} px-6 py-4`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${colors.iconBg} rounded-full flex items-center justify-center`}>
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Main Message */}
          <div className="space-y-2">
            <p className="text-gray-700 font-medium">{message}</p>
            
            {/* Details Box */}
            {details && (
              <div className={`${colors.detailsBg} rounded-lg p-3 border border-gray-200`}>
                <p className="text-sm text-gray-600 font-medium">{details.label}:</p>
                <p className="text-sm text-gray-900 mt-1">{details.value}</p>
              </div>
            )}
          </div>

          {/* Consequences */}
          {consequences.length > 0 && (
            <div className={`${colors.consequencesBg} border ${colors.consequencesBorder} rounded-lg p-3`}>
              <div className="flex gap-2">
                <AlertTriangle className={`h-4 w-4 ${colors.consequencesIcon} flex-shrink-0 mt-0.5`} />
                <div className="space-y-1">
                  <p className={`text-sm font-medium ${colors.consequencesTitle}`}>
                    This action will:
                  </p>
                  <ul className={`text-sm ${colors.consequencesText} space-y-1 ml-4 list-disc`}>
                    {consequences.map((consequence, index) => (
                      <li key={index}>{consequence}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium text-white ${colors.confirmButton} rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
