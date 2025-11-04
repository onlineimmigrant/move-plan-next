'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, ArrowUpIcon, ArrowDownOnSquareIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import styles from './ChatWidget.module.css';

interface SaveFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (filename: string, format: 'txt' | 'pdf' | 'json' | 'md') => void;
  defaultFilename: string;
  modalType?: 'save' | 'download';
}

export default function SaveFileModal({
  isOpen,
  onClose,
  onSave,
  defaultFilename,
  modalType = 'save',
}: SaveFileModalProps) {
  const [filenameInput, setFilenameInput] = useState(defaultFilename);
  const [fileFormat, setFileFormat] = useState<'txt' | 'pdf' | 'json' | 'md'>('md');

  // Update filename when modal opens or defaultFilename changes
  useEffect(() => {
    if (isOpen) {
      setFilenameInput(defaultFilename);
    }
  }, [isOpen, defaultFilename]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(filenameInput, fileFormat);
    onClose();
  };

  const modalTitle = modalType === 'save' ? 'Save to Files' : 'Download to Computer';
  const ModalIcon = modalType === 'save' ? ArrowDownOnSquareIcon : ArrowDownTrayIcon;

  return createPortal(
    <div className={styles.modalOverlay} style={{ zIndex: 10000010 }}>
      <div 
        style={{ 
          zIndex: 10000011,
          maxWidth: '32rem',
          width: '95vw',
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
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <ModalIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                <h2 className={styles.modalTitle}>{modalType === 'save' ? 'Save' : 'Download'}</h2>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setFileFormat('md')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${fileFormat === 'md' ? 'bg-blue-500/30 text-blue-700 dark:text-blue-300' : 'bg-white/20 hover:bg-white/30 text-slate-600 dark:text-slate-300'}`}
                >
                  .md
                </button>
                <button
                  onClick={() => setFileFormat('txt')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${fileFormat === 'txt' ? 'bg-blue-500/30 text-blue-700 dark:text-blue-300' : 'bg-white/20 hover:bg-white/30 text-slate-600 dark:text-slate-300'}`}
                >
                  .txt
                </button>
                <button
                  onClick={() => setFileFormat('pdf')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${fileFormat === 'pdf' ? 'bg-blue-500/30 text-blue-700 dark:text-blue-300' : 'bg-white/20 hover:bg-white/30 text-slate-600 dark:text-slate-300'}`}
                >
                  .pdf
                </button>
                <button
                  onClick={() => setFileFormat('json')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${fileFormat === 'json' ? 'bg-blue-500/30 text-blue-700 dark:text-blue-300' : 'bg-white/20 hover:bg-white/30 text-slate-600 dark:text-slate-300'}`}
                >
                  .json
                </button>
              </div>
            </div>
            <button onClick={onClose} className={styles.modalCloseButton}>
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="px-4 sm:px-6 py-4">
          <div className={styles.modalFormContainer}>
            <div className={styles.modalFormFields}>
              <input
                type="text"
                value={filenameInput}
                onChange={(e) => setFilenameInput(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                placeholder="Enter filename"
                className={styles.modalFormInput}
              />
            </div>
            <div className="flex justify-end items-center mt-3 pt-3 border-t border-slate-100">
              <button
                onClick={handleSave}
                disabled={!filenameInput.trim()}
                className={styles.modalFormButton}
              >
                <ArrowUpIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
