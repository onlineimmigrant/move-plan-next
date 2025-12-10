'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import ProfileDataManager from '../TemplateSectionModal/ProfileDataManager';
import { useProfileDataManagerModal } from './context';

export function ProfileDataManagerModal() {
  const { isOpen, closeModal } = useProfileDataManagerModal();

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeModal}
      />

      {/* Modal */}
      <div
        className="relative bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden border border-white/20"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b border-white/30 dark:border-gray-700/50 bg-white/20 dark:bg-gray-900/20"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Team Member Management</h2>
          <button
            onClick={closeModal}
            className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-gray-800/50 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-white/10 dark:bg-gray-900/10">
          <ProfileDataManager sectionId={0} type="team" />
        </div>
      </div>
    </div>,
    document.body
  );
}