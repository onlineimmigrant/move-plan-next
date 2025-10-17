'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import { Role } from './types';
import styles from './ChatWidget.module.css';
import Button from '@/ui/Button';
import Tooltip from '../../Tooltip';

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

  return createPortal(
    <div className={styles.modalOverlay} style={{ zIndex: 10000010 }}>
      <div className={styles.modalContent} style={{ zIndex: 10000011 }}>
        <div className={styles.modalHeader}>
          <div className="flex justify-between items-center w-full">
            <h2 className={styles.modalTitle}>Settings</h2>
            <button onClick={onClose} className={styles.modalCloseButton}>
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className={styles.modalBody}>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <div className={styles.modalSection}>
          <h3 className={styles.modalSectionTitle}>Status</h3>
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
        <div className={styles.modalSection}>
          <h3 className={styles.modalSectionTitle}>New Setting</h3>
          <div className={styles.modalFormContainer}>
            <div className={styles.modalFormFields}>
              <input
                type="text"
                value={newSettingKey}
                onChange={(e) => setNewSettingKey(e.target.value)}
                placeholder='Setting key, e.g., "Full Name"'
                className={styles.modalFormInput}
                disabled={isSaving}
              />
              <input
                type="text"
                value={newSettingValue}
                onChange={(e) => setNewSettingValue(e.target.value)}
                placeholder='Setting value, e.g., "John Doe"'
                className={styles.modalFormInput}
                disabled={isSaving}
              />
            </div>
            <div className="flex justify-end items-center mt-3 pt-3 border-t border-slate-100">
              <button
                onClick={addSetting}
                disabled={isSaving || !newSettingKey.trim() || !newSettingValue.trim()}
                className={styles.modalFormButton}
              >
                <ArrowUpIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className={styles.modalSection}>
          <h3 className={styles.modalSectionTitle}>Existing Settings</h3>
          {Object.keys(defaultSettings).length === 0 ? (
            <p className="text-gray-500">No settings defined.</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {Object.entries(defaultSettings).map(([key, value]) => (
                <div key={key} className="relative group flex-shrink-0">
                  <Tooltip content={JSON.stringify(value)} variant="info-top">
                    <button
                      onClick={() => setEditingSetting({ key, value: JSON.stringify(value) })}
                      className={styles.modalBadge}
                      disabled={isSaving}
                    >
                      <span>{key}</span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSetting(key);
                        }}
                        className={styles.modalBadgeDelete}
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
            <div className={styles.modalSection}>
              <h3 className={styles.modalSectionTitle}>Edit Setting</h3>
              <div className={styles.modalFormContainer}>
                <div className={styles.modalFormFields}>
                  <input
                    type="text"
                    value={editingSetting.key}
                    onChange={(e) => setEditingSetting({ ...editingSetting, key: e.target.value })}
                    className={styles.modalFormInput}
                    disabled={isSaving}
                  />
                  <input
                    type="text"
                    value={editingSetting.value}
                    onChange={(e) => setEditingSetting({ ...editingSetting, value: e.target.value })}
                    className={styles.modalFormInput}
                    disabled={isSaving}
                  />
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                  <Button
                    variant="secondary"
                    onClick={() => setEditingSetting(null)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <button
                    onClick={() => updateSetting(editingSetting.key)}
                    disabled={isSaving || !editingSetting.key.trim() || !editingSetting.value.trim()}
                    className={styles.modalFormButton}
                  >
                    <ArrowUpIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>,
    document.body
  );
}