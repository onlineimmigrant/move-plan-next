'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string) => void;
  onUnlink: () => void;
  initialUrl?: string;
  hasExistingLink?: boolean;
}

export default function LinkModal({ 
  isOpen, 
  onClose, 
  onSave, 
  onUnlink, 
  initialUrl = '', 
  hasExistingLink = false 
}: LinkModalProps) {
  const [url, setUrl] = useState(initialUrl);

  useEffect(() => {
    setUrl(initialUrl);
  }, [initialUrl]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (url.trim()) {
      onSave(url.trim());
      onClose();
    }
  };

  const handleUnlink = () => {
    onUnlink();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {hasExistingLink ? 'Edit Link' : 'Insert Link'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://example.com"
              autoFocus
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            {hasExistingLink && (
              <Button
                onClick={handleUnlink}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Remove Link
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="primary"
              disabled={!url.trim()}
            >
              {hasExistingLink ? 'Update' : 'Insert'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
