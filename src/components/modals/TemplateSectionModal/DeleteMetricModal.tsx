'use client';

import React, { useState } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from '@/ui/Button';
import { cn } from '@/lib/utils';
import { BaseModal } from '../_shared/BaseModal';

type DeleteMode = 'remove' | 'delete' | null;

interface DeleteMetricModalProps {
  isOpen: boolean;
  metricTitle: string;
  metricId: number;
  onRemoveFromSection: () => Promise<void>;
  onDeletePermanently: () => Promise<void>;
  onCancel: () => void;
}

export default function DeleteMetricModal({
  isOpen,
  metricTitle,
  metricId,
  onRemoveFromSection,
  onDeletePermanently,
  onCancel,
}: DeleteMetricModalProps) {
  const [deleteMode, setDeleteMode] = useState<DeleteMode>(null);
  const [confirmText, setConfirmText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const isConfirmValid = deleteMode === 'remove' || confirmText === metricTitle;

  const handleConfirm = async () => {
    if (!isConfirmValid) return;
    
    setIsProcessing(true);
    try {
      if (deleteMode === 'remove') {
        await onRemoveFromSection();
      } else if (deleteMode === 'delete') {
        await onDeletePermanently();
      }
      handleClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setDeleteMode(null);
    setConfirmText('');
    onCancel();
  };

  if (!isOpen) return null;

  const modalTitle = (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
        <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
      </div>
      <div>
        <div className="text-lg font-semibold text-gray-900">Remove or Delete Metric</div>
        <div className="text-sm text-gray-500 font-normal">Choose an option</div>
      </div>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      size="md"
      draggable={false}
      resizable={false}
      zIndex={10020}
    >
      <div className="space-y-4 sm:space-y-6">
        {!deleteMode ? (
          // Mode selection
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metric:
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="font-mono text-sm text-gray-900 break-words">
                  {metricTitle}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setDeleteMode('remove')}
                className="w-full text-left border-2 border-gray-200 rounded-lg p-3 sm:p-4 hover:border-sky-400 hover:bg-sky-50 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-100 group-hover:bg-sky-200 flex items-center justify-center mt-0.5">
                    <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">Remove from Section</h4>
                    <p className="text-sm text-gray-600">
                      Remove this metric from the current template section only. The metric will remain in your library and other sections.
                    </p>
                    <p className="text-xs text-sky-600 mt-2 font-medium">
                      ✓ Safe option - No confirmation needed
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setDeleteMode('delete')}
                className="w-full text-left border-2 border-gray-200 rounded-lg p-3 sm:p-4 hover:border-red-400 hover:bg-red-50 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 group-hover:bg-red-200 flex items-center justify-center mt-0.5">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">Delete Permanently</h4>
                    <p className="text-sm text-gray-600">
                      Delete this metric from the entire system. It will be removed from ALL sections where it's used.
                    </p>
                    <p className="text-xs text-red-600 mt-2 font-medium">
                      ⚠ Dangerous - Requires confirmation
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </>
        ) : deleteMode === 'remove' ? (
          // Confirm remove from section
          <>
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 sm:p-4">
              <p className="text-sm text-sky-800">
                <strong>Removing from section:</strong>
              </p>
              <p className="text-sm text-sky-700 mt-2">
                This metric will only be removed from the current template section. It will remain available in your library and other sections.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metric to remove:
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="font-mono text-sm text-gray-900 break-words">
                  {metricTitle}
                </p>
              </div>
            </div>
          </>
        ) : (
          // Confirm permanent deletion
          <>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <p className="text-sm text-red-800">
                <strong>⚠ Warning:</strong> This action cannot be undone!
              </p>
              <p className="text-sm text-red-700 mt-2">
                The metric will be permanently deleted from:
              </p>
              <ul className="mt-2 ml-4 list-disc text-sm text-red-700 space-y-1">
                <li>ALL template sections using it</li>
                <li>Your metrics library</li>
                <li>The database (cannot be recovered)</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metric to delete:
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="font-mono text-sm text-gray-900 break-words">
                  {metricTitle}
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-text" className="block text-sm font-medium text-gray-700 mb-2">
                Type the metric title to confirm deletion:
              </label>
              <input
                id="confirm-text"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Enter metric title exactly as shown above"
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors',
                  isConfirmValid
                    ? 'border-green-300 focus:ring-green-500 bg-green-50'
                    : 'border-gray-300 focus:ring-sky-500/30'
                )}
                disabled={isProcessing}
                autoFocus
              />
              {confirmText && !isConfirmValid && (
                <p className="text-xs text-red-600 mt-1">
                  Text doesn't match. Please type exactly: "{metricTitle}"
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
          </>
        )}

        {/* Action Buttons */}
        {deleteMode ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <Button
              onClick={() => {
                setDeleteMode(null);
                setConfirmText('');
              }}
              variant="outline"
              disabled={isProcessing}
            >
              Back
            </Button>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleClose}
                variant="outline"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                variant={deleteMode === 'remove' ? 'primary' : 'danger'}
                disabled={!isConfirmValid || isProcessing}
                loading={isProcessing}
                loadingText="Processing..."
                className={deleteMode === 'remove' ? 'bg-sky-600 hover:bg-sky-700' : ''}
              >
                {deleteMode === 'remove' ? 'Remove from Section' : 'Delete Permanently'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleClose}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
