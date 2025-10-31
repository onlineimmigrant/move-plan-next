/**
 * Email Template Confirmation Dialog
 * Reusable confirmation dialog for destructive actions
 */

import React from 'react';
import { EmailIcons } from './EmailIcons';
import Button from '@/ui/Button';

interface EmailConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const EmailConfirmationDialog: React.FC<EmailConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all">
        <div className="flex items-start gap-4 mb-4">
          <div
            className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${
              confirmVariant === 'danger' ? 'bg-red-100' : 'bg-blue-100'
            }`}
          >
            <EmailIcons.ExclamationCircle
              className={`h-6 w-6 ${
                confirmVariant === 'danger' ? 'text-red-600' : 'text-blue-600'
              }`}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            onClick={() => {
              onConfirm();
              onCancel();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
