'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import styles from './ChatWidget.module.css';

interface SaveFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (filename: string, format: 'txt' | 'pdf' | 'json') => void;
  defaultFilename: string;
}

export default function SaveFileModal({
  isOpen,
  onClose,
  onSave,
  defaultFilename,
}: SaveFileModalProps) {
  const [filenameInput, setFilenameInput] = useState(defaultFilename);
  const [fileFormat, setFileFormat] = useState<'txt' | 'pdf' | 'json'>('txt');

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

  return createPortal(
    <div className={styles.modalOverlay} style={{ zIndex: 10000010 }}>
      <div className={styles.modalContent} style={{ zIndex: 10000011 }}>
        <div className={styles.modalHeader}>
          <div className="flex justify-between items-center w-full">
            <h2 className={styles.modalTitle}>Save File</h2>
            <button onClick={onClose} className={styles.modalCloseButton}>
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>Filename</h3>
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
          <div className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>Format</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setFileFormat('txt')}
                className={`${styles.modalBadge} ${fileFormat === 'txt' ? styles.selected : ''}`}
              >
                TXT
              </button>
              <button
                onClick={() => setFileFormat('pdf')}
                className={`${styles.modalBadge} ${fileFormat === 'pdf' ? styles.selected : ''}`}
              >
                PDF
              </button>
              <button
                onClick={() => setFileFormat('json')}
                className={`${styles.modalBadge} ${fileFormat === 'json' ? styles.selected : ''}`}
              >
                JSON
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
