'use client';
import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Role } from './types';
import styles from './ChatWidget.module.css';
import Button from '@/ui/Button';
import Tooltip from '../Tooltip';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
  defaultSettings: Record<string, any>;
  onSettingsUpdated: (settings: Record<string, any>) => void;
  selectedSettings: Record<string, any> | null;
  setSelectedSettings: (settings: Record<string, any> | null) => void;
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
  const [newSettingKey, setNewSettingKey] = useState('');
  const [newSettingValue, setNewSettingValue] = useState('');
  const [editingSetting, setEditingSetting] = useState<{ key: string; value: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setError(null);
    setEditingSetting(null);
    setNewSettingKey('');
    setNewSettingValue('');
  }, [isOpen]);

  const addSetting = async () => {
    if (!newSettingKey.trim() || !newSettingValue.trim()) {
      setError('Setting key and value are required.');
      return;
    }
    if (!accessToken) {
      setError('Authentication required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      let parsedValue;
      try {
        parsedValue = JSON.parse(newSettingValue);
      } catch {
        parsedValue = newSettingValue;
      }

      const response = await fetch('/api/chat/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          action: 'add',
          settingKey: newSettingKey,
          settingValue: parsedValue,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add setting');
      }

      onSettingsUpdated(data.default_settings);
      setNewSettingKey('');
      setNewSettingValue('');
      if (!selectedSettings) {
        setSelectedSettings(data.default_settings);
      }
    } catch (err: any) {
      console.error('[SettingsModal] Add setting error:', err.message);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = async (originalKey: string) => {
    if (!editingSetting || !accessToken) {
      setError('Editing setting or access token is missing.');
      return;
    }
    if (!editingSetting.key.trim() || !editingSetting.value.trim()) {
      setError('Setting key and value are required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      let parsedValue;
      try {
        parsedValue = JSON.parse(editingSetting.value);
      } catch {
        parsedValue = editingSetting.value;
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
          settingValue: parsedValue,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update setting');
      }

      onSettingsUpdated(data.default_settings);
      setEditingSetting(null);
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
      if (Object.keys(data.default_settings).length === 0) {
        setSelectedSettings(null);
      } else if (selectedSettings) {
        setSelectedSettings(data.default_settings);
      }
    } catch (err: any) {
      console.error('[SettingsModal] Delete setting error:', err.message);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSettings = () => {
    setSelectedSettings(selectedSettings ? null : defaultSettings);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <div className="mb-4">
          <h3 className="text-md font-medium mb-2">Status</h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={!!selectedSettings}
              onChange={toggleSettings}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
            <span className="ml-3 text-sm font-medium text-gray-900">
              {selectedSettings ? 'Active' : 'Inactive'}
            </span>
          </label>
        </div>
        <div className="mb-4">
          <h3 className="text-md font-medium mb-2">New Setting</h3>
          <input
            type="text"
            value={newSettingKey}
            onChange={(e) => setNewSettingKey(e.target.value)}
            placeholder='Setting key, e.g., "Full Name"'
            className="w-full p-2 mb-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
            disabled={isSaving}
          />
          <input
            type="text"
            value={newSettingValue}
            onChange={(e) => setNewSettingValue(e.target.value)}
            placeholder='Setting value, e.g., "John Doe"'
            className="w-full p-2 mb-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
            disabled={isSaving}
          />
          <Button
            onClick={addSetting}
            className="my-4"
            disabled={isSaving}
          >
            Add
          </Button>
        </div>
        <div>
          <h3 className="text-md font-medium mb-2">Existing</h3>
          {Object.keys(defaultSettings).length === 0 ? (
            <p className="text-gray-500">No settings defined.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(defaultSettings).map(([key, value]) => (
                <div key={key} className="relative group">
                  <Tooltip content={JSON.stringify(value)} variant="info-top">
                    <button
                      onClick={() => setEditingSetting({ key, value: JSON.stringify(value) })}
                      className="bg-sky-100 text-sky-800 text-sm font-medium px-3 py-1 rounded-full flex items-center gap-2 hover:bg-sky-200 disabled:bg-sky-50"
                      disabled={isSaving}
                    >
                      <span>{key}</span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSetting(key);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </span>
                    </button>
                  </Tooltip>
                </div>
              ))}
            </div>
          )}
          {editingSetting && (
            <div className="mt-4">
              <h3 className="text-md font-medium mb-2">Edit Setting</h3>
              <input
                type="text"
                value={editingSetting.key}
                onChange={(e) => setEditingSetting({ ...editingSetting, key: e.target.value })}
                className="w-full p-1 mb-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                disabled={isSaving}
              />
              <input
                type="text"
                value={editingSetting.value}
                onChange={(e) => setEditingSetting({ ...editingSetting, value: e.target.value })}
                className="w-full p-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                disabled={isSaving}
              />
              <div className="flex space-x-2 mt-1">
                <Button
                  onClick={() => updateSetting(editingSetting.key)}
                  disabled={isSaving}
                >
                  Save
                </Button>
                <button
                  onClick={() => setEditingSetting(null)}
                  className={`${styles.modalButton} bg-gray-300 text-gray-600 hover:bg-gray-400 disabled:bg-gray-200`}
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}