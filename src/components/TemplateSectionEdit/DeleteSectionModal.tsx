'use client';

import React, { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from '@/ui/Button';
import { cn } from '@/lib/utils';

interface DeleteSectionModalProps {
  isOpen: boolean;
  sectionTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteSectionModal({
  isOpen,
  sectionTitle,
  onConfirm,
  onCancel,
}: DeleteSectionModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const isConfirmValid = confirmText === sectionTitle;

  const handleConfirm = async () => {
    if (!isConfirmValid) return;
    
    setIsDeleting(true);
    try {
      await onConfirm();
      setConfirmText('');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setConfirmText('');
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Template Section</h3>
              <p className="text-sm text-gray-500 mt-1">This action cannot be undone</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isDeleting}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> Deleting this template section will permanently remove:
            </p>
            <ul className="mt-2 ml-4 list-disc text-sm text-red-700 space-y-1">
              <li>The section and all its settings</li>
              <li>Links to metrics (metrics themselves will remain)</li>
              <li>Translation data for this section</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section to delete:
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="font-mono text-sm text-gray-900 break-words">
                {sectionTitle}
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-text" className="block text-sm font-medium text-gray-700 mb-2">
              Type the section title to confirm:
            </label>
            <input
              id="confirm-text"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Enter section title exactly as shown above"
              className={cn(
                'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors',
                isConfirmValid
                  ? 'border-green-300 focus:ring-green-500 bg-green-50'
                  : 'border-gray-300 focus:ring-blue-500'
              )}
              disabled={isDeleting}
              autoFocus
            />
            {confirmText && !isConfirmValid && (
              <p className="text-xs text-red-600 mt-1">
                Text doesn't match. Please type exactly: "{sectionTitle}"
              </p>
            )}
            {isConfirmValid && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Confirmed
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
          <Button
            onClick={handleCancel}
            variant="secondary"
            size="default"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="danger"
            size="default"
            disabled={!isConfirmValid || isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Section'}
          </Button>
        </div>
      </div>
    </div>
  );
}
