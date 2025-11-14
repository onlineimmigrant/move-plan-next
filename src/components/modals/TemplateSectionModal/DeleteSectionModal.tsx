'use client';

import React, { useState } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from '@/ui/Button';
import { cn } from '@/lib/utils';
import { BaseModal } from '../_shared/BaseModal';
import { Z_INDEX } from '@/ui/zIndex';
import useFocusTrap from '@/hooks/useFocusTrap';

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

  // Validation: if section title is empty require explicit DELETE keyword; otherwise exact match
  const isConfirmValid = sectionTitle.trim() === ''
    ? confirmText === 'DELETE'
    : confirmText === sectionTitle;
  // Debug: observe confirmText updates during tests
  // Test-only debug logging removed after validation

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

  // Initialize focus trap AFTER cancel handler exists so escape can call it
  const focusTrapRef = useFocusTrap({
    active: isOpen,
    onEscape: handleCancel,
  });

  if (!isOpen) return null;

  const modalTitle = (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
        <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
      </div>
      <div>
        <div className="text-lg font-semibold text-gray-900">Delete Template Section</div>
        <div className="text-sm text-gray-500 font-normal">This action cannot be undone</div>
      </div>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleCancel}
      title={modalTitle}
      size="md"
      draggable={false}
      resizable={false}
      // Ensure this confirmation modal appears above the TemplateSectionEditModal (z-[10001])
      // and its inline edit popovers (up to z-[10004])
      zIndex={Z_INDEX.modalConfirm}
    >
  <div ref={focusTrapRef as React.RefObject<HTMLDivElement>} className="space-y-4 sm:space-y-6" tabIndex={-1}>
        {/* Warning Box */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
          <p className="text-sm text-red-800">
            <strong>Warning:</strong> Deleting this template section will permanently remove:
          </p>
          <ul className="mt-2 ml-4 list-disc text-sm text-red-700 space-y-1">
            <li>The section and all its settings</li>
            <li>Links to metrics (metrics themselves will remain)</li>
            <li>Translation data for this section</li>
          </ul>
        </div>

        {/* Section Display */}
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

        {/* Confirmation Input */}
        <div>
          <label htmlFor="confirm-text" className="block text-sm font-medium text-gray-700 mb-2">
            Type the section title to confirm{sectionTitle.trim() === '' ? ' (or type "DELETE")' : ''}:
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
                : 'border-gray-300 focus:ring-sky-500/30'
            )}
            disabled={isDeleting}
            autoFocus
          />
          {confirmText && !isConfirmValid && (
            <p className="text-xs text-red-600 mt-1">
              {sectionTitle.trim() === ''
                ? 'Text does not match. Please type exactly: "DELETE"'
                : <>Text doesn't match. Please type exactly: "{sectionTitle}"</>}
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

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
          <Button
            onClick={handleCancel}
            variant="outline"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="danger"
            disabled={!isConfirmValid || isDeleting}
            loading={isDeleting}
            loadingText="Deleting..."
          >
            Delete Section
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
