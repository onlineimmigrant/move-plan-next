'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, PlusIcon, PencilIcon, TrashIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { Role } from './types';
import styles from './ChatWidget.module.css';
import Button from '@/ui/Button';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
  defaultSettings: Record<string, any>;
  onSettingsUpdated: (settings: Record<string, any>) => void;
  selectedSettings: Record<string, any> | null;
  setSelectedSettings: (settings: Record<string, any> | null) => void;
}

interface AddSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (key: string, value: string) => void;
  isSaving: boolean;
}

interface AddSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (key: string, value: string) => void;
  isSaving: boolean;
}

interface EditSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (originalKey: string, newKey: string, newValue: string) => void;
  isSaving: boolean;
  setting: { key: string; value: string } | null;
}

function AddSettingModal({ isOpen, onClose, onAdd, isSaving }: AddSettingModalProps) {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setKey('');
      setValue('');
    }
  }, [isOpen]);

  const handleAdd = () => {
    if (key.trim() && value.trim()) {
      onAdd(key, value);
      setKey('');
      setValue('');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.modalOverlay} style={{ zIndex: 10000012 }}>
      <div 
        style={{ 
          zIndex: 10000013,
          maxWidth: '500px',
          width: '95vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          borderRadius: '1rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden'
        }}
        className="dark:bg-gray-900/50"
      >
        {/* Fixed Header */}
        <div 
          style={{ 
            flexShrink: 0,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            background: 'rgba(255, 255, 255, 0.3)',
            borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
            padding: '0.75rem 1.5rem',
            borderRadius: '1rem 1rem 0 0'
          }}
          className="dark:bg-gray-900/30 dark:border-slate-700/50"
        >
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <PlusIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              <h2 className={styles.modalTitle}>Add New Setting</h2>
            </div>
            <button onClick={onClose} className={styles.modalCloseButton} disabled={isSaving}>
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div 
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '1.5rem' 
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Setting Key
              </label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder='e.g., "Full Name", "Skills", "Location"'
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSaving}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Setting Value
              </label>
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder='e.g., "John Doe", "React, Node.js", "London, UK"'
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                disabled={isSaving}
              />
            </div>
          </div>
        </div>
        <div 
          style={{ 
            flexShrink: 0,
            borderTop: '1px solid rgba(226, 232, 240, 0.5)',
            padding: '1rem 1.5rem',
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end'
          }}
          className="dark:border-slate-700/50"
        >
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAdd}
            disabled={isSaving || !key.trim() || !value.trim()}
          >
            {isSaving ? 'Adding...' : 'Add Setting'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function EditSettingModal({ isOpen, onClose, onSave, isSaving, setting }: EditSettingModalProps) {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [originalKey, setOriginalKey] = useState('');

  useEffect(() => {
    if (isOpen && setting) {
      setKey(setting.key);
      setValue(setting.value);
      setOriginalKey(setting.key);
    } else if (!isOpen) {
      setKey('');
      setValue('');
      setOriginalKey('');
    }
  }, [isOpen, setting]);

  const handleSave = () => {
    if (key.trim() && value.trim()) {
      onSave(originalKey, key.trim(), value.trim());
    }
  };

  if (!isOpen || !setting) return null;

  return createPortal(
    <div className={styles.modalOverlay} style={{ zIndex: 10000014 }}>
      <div 
        style={{ 
          zIndex: 10000015,
          maxWidth: '500px',
          width: '95vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          borderRadius: '1rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden'
        }}
        className="dark:bg-gray-900/50"
      >
        {/* Fixed Header */}
        <div 
          style={{ 
            flexShrink: 0,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            background: 'rgba(255, 255, 255, 0.3)',
            borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
            padding: '0.75rem 1.5rem',
            borderRadius: '1rem 1rem 0 0'
          }}
          className="dark:bg-gray-900/30 dark:border-slate-700/50"
        >
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <PencilIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              <h2 className={styles.modalTitle}>Edit Setting</h2>
            </div>
            <button onClick={onClose} className={styles.modalCloseButton} disabled={isSaving}>
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div 
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '1.5rem' 
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Setting Key
              </label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSaving}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Setting Value
              </label>
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                disabled={isSaving}
              />
            </div>
          </div>
        </div>
        {/* Footer */}
        <div 
          style={{ 
            flexShrink: 0,
            borderTop: '1px solid rgba(226, 232, 240, 0.5)',
            padding: '1rem 1.5rem',
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end'
          }}
          className="dark:border-slate-700/50"
        >
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving || !key.trim() || !value.trim()}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function SettingsModal({
  isOpen,
  onClose,
  accessToken,
  defaultSettings,
  onSettingsUpdated,
  selectedSettings,
  setSelectedSettings,
}: SettingsModalProps) {
  const [editingSetting, setEditingSetting] = useState<{ key: string; value: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    setError(null);
    setEditingSetting(null);
  }, [isOpen]);

  useEffect(() => {
    setError(null);
    setEditingSetting(null);
  }, [isOpen]);

  const addSetting = async (key: string, value: string) => {
    if (!accessToken) {
      setError('Authentication required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      let parsedValue;
      try {
        parsedValue = JSON.parse(value);
      } catch {
        parsedValue = value;
      }

      const response = await fetch('/api/chat/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          action: 'add',
          settingKey: key,
          settingValue: parsedValue,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add setting');
      }

      onSettingsUpdated(data.default_settings);
      setSelectedSettings(data.default_settings);
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error('[SettingsModal] Add setting error:', err.message);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = async (originalKey: string, newKey: string, newValue: string) => {
    if (!accessToken) {
      setError('Authentication required.');
      return;
    }
    if (!newKey.trim() || !newValue.trim()) {
      setError('Setting key and value are required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      let parsedValue;
      try {
        parsedValue = JSON.parse(newValue);
      } catch {
        parsedValue = newValue;
      }

      const response = await fetch('/api/chat/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          action: 'update',
          settingKey: originalKey,
          newKey: newKey !== originalKey ? newKey : undefined,
          settingValue: parsedValue,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update setting');
      }

      onSettingsUpdated(data.default_settings);
      setEditingSetting(null);
      setIsEditModalOpen(false);
      if (selectedSettings) {
        setSelectedSettings(data.default_settings);
      }
    } catch (err: any) {
      console.error('[SettingsModal] Update setting error:', err.message);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSetting = async (key: string) => {
    if (!accessToken) {
      setError('Authentication required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/chat/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          action: 'delete',
          settingKey: key,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete setting');
      }

      onSettingsUpdated(data.default_settings);
      // Always keep settings active, just update with new data
      setSelectedSettings(data.default_settings);
    } catch (err: any) {
      console.error('[SettingsModal] Delete setting error:', err.message);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AddSettingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addSetting}
        isSaving={isSaving}
      />
      {createPortal(
        <div className={styles.modalOverlay} style={{ zIndex: 10000010 }}>
          <div 
            style={{ 
              zIndex: 10000011,
              maxWidth: '800px',
              width: '95vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '1rem',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
              overflow: 'hidden'
            }}
            className="dark:bg-gray-900/50"
          >
            {/* Fixed Header */}
            <div 
              style={{ 
                flexShrink: 0,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                background: 'rgba(255, 255, 255, 0.3)',
                borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
                padding: '0.75rem 1.5rem',
                borderRadius: '1rem 1rem 0 0'
              }}
              className="dark:bg-gray-900/30 dark:border-slate-700/50"
            >
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <Cog6ToothIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  <h2 className={styles.modalTitle}>Settings</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-slate-600 dark:text-slate-300 transition-colors"
                    title="Add New Setting"
                    disabled={isSaving}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={onClose} 
                    className={styles.modalCloseButton}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Body */}
            <div 
              style={{ 
                flex: 1, 
                overflowY: 'auto',
                padding: '1rem 1.5rem'
              }}
            >
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {Object.keys(defaultSettings).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Cog6ToothIcon className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No settings defined yet</p>
                  <p className="text-gray-400 text-sm mb-4">
                    Click the "Add" button to create your first setting
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          style={{ minWidth: '200px' }}
                        >
                          Setting Key
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          style={{ minWidth: '300px' }}
                        >
                          Value
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                          style={{ width: '120px' }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(defaultSettings).map(([key, value]) => (
                        <tr key={key} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                {key}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 break-words max-w-md">
                              {Array.isArray(value) 
                                ? value.join(', ') 
                                : typeof value === 'object' 
                                  ? JSON.stringify(value) 
                                  : String(value)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingSetting({ key, value: JSON.stringify(value) });
                                  setIsEditModalOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                disabled={isSaving}
                                title="Edit"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete "${key}"?`)) {
                                    deleteSetting(key);
                                  }
                                }}
                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                                disabled={isSaving}
                                title="Delete"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <EditSettingModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingSetting(null);
        }}
        onSave={(originalKey, newKey, newValue) => {
          updateSetting(originalKey, newKey, newValue);
        }}
        isSaving={isSaving}
        setting={editingSetting}
      />
    </>
  );
}