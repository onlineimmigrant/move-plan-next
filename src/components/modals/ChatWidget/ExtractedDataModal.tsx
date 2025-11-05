'use client';
import { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ExtractedDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  extractedData: Record<string, any>;
  onSave: (data: Record<string, any>) => Promise<void>;
  onDiscard: () => void;
}

export default function ExtractedDataModal({
  isOpen,
  onClose,
  extractedData,
  onSave,
  onDiscard,
}: ExtractedDataModalProps) {
  const [data, setData] = useState<Record<string, any>>(extractedData);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setData(extractedData);
  }, [extractedData]);

  if (!isOpen) return null;

  const handleEdit = (key: string, value: any) => {
    setEditingKey(key);
    setEditValue(Array.isArray(value) ? value.join(', ') : String(value));
  };

  const handleSaveEdit = (key: string) => {
    if (editValue.includes(',')) {
      // Convert comma-separated string to array
      setData({ ...data, [key]: editValue.split(',').map(v => v.trim()) });
    } else {
      setData({ ...data, [key]: editValue });
    }
    setEditingKey(null);
    setEditValue('');
  };

  const handleDelete = (key: string) => {
    const newData = { ...data };
    delete newData[key];
    setData(newData);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSave(data);
      onClose();
    } catch (error) {
      console.error('Failed to save extracted data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Extracted Data
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Review and edit the information extracted from your message
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {Object.keys(data).length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No data extracted
            </p>
          ) : (
            Object.entries(data).map(([key, value]) => (
              <div
                key={key}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">
                    {key}
                  </div>
                  {editingKey === key ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(key);
                          if (e.key === 'Escape') setEditingKey(null);
                        }}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(key)}
                        className="text-green-600 hover:text-green-700 dark:text-green-400"
                      >
                        <CheckIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setEditingKey(null)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-900 dark:text-white break-words">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </div>
                  )}
                </div>
                {editingKey !== key && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(key, value)}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 p-1"
                      title="Edit"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(key)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 p-1"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onDiscard}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Discard
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSaving || Object.keys(data).length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  Save to Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
