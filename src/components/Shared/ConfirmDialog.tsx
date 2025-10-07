// /components/Shared/ConfirmDialog.tsx
'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from '@/ui/Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  type = 'danger',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const colors = {
    danger: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
          <ExclamationTriangleIcon className={`h-6 w-6 ${colors[type]}`} />
        </div>
        
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          {title}
        </h3>
        
        {/* Message */}
        <p className="text-sm text-gray-600 text-center mb-6">
          {message}
        </p>
        
        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onCancel}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
