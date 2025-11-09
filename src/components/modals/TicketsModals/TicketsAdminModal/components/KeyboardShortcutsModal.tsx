'use client';

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { category: 'Navigation', items: [
      { keys: ['Esc'], description: 'Close modal or return to ticket list' },
      { keys: ['↑', '↓'], description: 'Navigate between tickets' },
      { keys: ['Enter'], description: 'Open selected ticket' },
      { keys: ['Tab'], description: 'Move between focusable elements' },
    ]},
    { category: 'Actions', items: [
      { keys: ['Enter'], description: 'Send message (in message field)' },
      { keys: ['Shift', 'Enter'], description: 'New line in message' },
      { keys: ['Ctrl/Cmd', 'K'], description: 'Focus search' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
    ]},
    { category: 'Modal', items: [
      { keys: ['Ctrl/Cmd', '1'], description: 'Set to initial size' },
      { keys: ['Ctrl/Cmd', '2'], description: 'Set to half screen' },
      { keys: ['Ctrl/Cmd', '3'], description: 'Set to fullscreen' },
    ]},
  ];

  return (
    <div 
      className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-gray-700">
          <h2 id="shortcuts-title" className="text-2xl font-bold text-slate-900 dark:text-white">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close shortcuts modal"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                {section.category}
              </h3>
              <div className="space-y-3">
                {section.items.map((shortcut, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-gray-800 last:border-0"
                  >
                    <span className="text-slate-700 dark:text-slate-300">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          {keyIdx > 0 && (
                            <span className="text-slate-400 dark:text-slate-600 mx-1">+</span>
                          )}
                          <kbd className="px-3 py-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-lg shadow-sm">
                            {key}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 rounded-b-2xl">
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
            Press <kbd className="px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded">?</kbd> anytime to view this help
          </p>
        </div>
      </div>
    </div>
  );
}
