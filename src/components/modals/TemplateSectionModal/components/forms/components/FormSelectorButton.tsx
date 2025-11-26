/**
 * FormSelectorButton - Floating button to select/switch forms
 * Opens a glassmorphism menu with available forms and create new option
 */

'use client';

import React, { useState } from 'react';
import { QueueListIcon, PlusIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Form {
  id: string;
  title: string;
  question_count?: number;
  published?: boolean;
}

interface FormSelectorButtonProps {
  isOpen: boolean;
  currentFormId: string | null;
  availableForms: Form[];
  primaryColor: string;
  onToggle: () => void;
  onSelectForm: (formId: string) => void;
  onCreateNew: () => void;
  onDeleteForm: (formId: string) => Promise<void>;
}

export function FormSelectorButton({
  isOpen,
  currentFormId,
  availableForms,
  primaryColor,
  onToggle,
  onSelectForm,
  onCreateNew,
  onDeleteForm,
}: FormSelectorButtonProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = async (formId: string) => {
    await onDeleteForm(formId);
    setDeleteConfirm(null);
  };
  return (
    <>
      {/* Floating Button */}
      <button
        onClick={onToggle}
        className={`
          fixed top-48 left-6 z-[70]
          w-12 h-12
          rounded-full
          bg-white/50 dark:bg-gray-900/50
          backdrop-blur-3xl
          border border-white/20 dark:border-gray-700/20
          shadow-xl hover:shadow-2xl
          hover:scale-105 active:scale-95
          hover:bg-white/60 dark:hover:bg-gray-900/60
          transition-all duration-300
          flex items-center justify-center
          ${isOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}
        `}
        aria-label={isOpen ? 'Close forms menu' : 'Open forms menu'}
        aria-expanded={isOpen}
        style={{ color: primaryColor }}
      >
        <QueueListIcon className={`h-6 w-6 transition-all duration-300 ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[59] animate-in fade-in duration-200"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Glassmorphism Menu Panel */}
      {isOpen && (
        <div className="fixed top-44 left-6 w-80 max-h-[70vh] overflow-y-auto bg-white/30 dark:bg-gray-900/30 backdrop-blur-2xl border border-white/20 dark:border-gray-700/20 shadow-2xl rounded-3xl z-[60] animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200">
          <div className="p-3 space-y-3">
            {/* Header */}
            <div
              className="text-[14px] font-semibold text-gray-600 dark:text-gray-400 px-4 py-2 mb-1"
              style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
            >
              Select Form
            </div>

            {/* Forms List */}
            <div className="space-y-1">
              {availableForms.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p className="text-sm">No forms yet</p>
                </div>
              ) : (
                availableForms.map((form) => (
                  <div key={form.id} className="relative group">
                    <button
                      onClick={() => {
                        onSelectForm(form.id);
                        onToggle();
                      }}
                      onMouseEnter={(e) => {
                        if (currentFormId === form.id) {
                          e.currentTarget.style.color = primaryColor;
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '';
                      }}
                      className="w-full text-xs px-4 py-3 rounded-xl transition-all duration-200 hover:bg-white/10 dark:hover:bg-gray-800/10 active:bg-white/20 dark:active:bg-gray-800/20 text-left text-gray-900 dark:text-white flex items-center justify-between gap-2"
                      style={{
                        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                        color: currentFormId === form.id ? primaryColor : undefined,
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {form.title || 'Untitled Form'}
                          </span>
                          {currentFormId === form.id && (
                            <CheckIcon className="h-4 w-4 flex-shrink-0" style={{ color: primaryColor }} />
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                          {form.question_count || 0} questions
                          {form.published && ' • Published'}
                        </div>
                      </div>
                    </button>
                    {/* Delete button on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(form.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Create New Button */}
            <button
              onClick={() => {
                onCreateNew();
                onToggle();
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = primaryColor)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
              className="w-full text-xs px-4 py-3 rounded-xl transition-all duration-200 bg-white/10 dark:bg-gray-800/10 hover:bg-white/20 dark:hover:bg-gray-800/20 text-gray-900 dark:text-white font-medium flex items-center justify-center gap-2"
              style={{
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
              }}
            >
              <PlusIcon className="h-4 w-4" />
              Create New Form
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[70] animate-in fade-in duration-200"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-[71] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Delete Form?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this form? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
