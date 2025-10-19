import { useState, useCallback, useRef } from 'react';
import { validateFile } from '@/lib/fileUpload';

interface UseFileUploadProps {
  selectedFiles: File[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onToast: (toast: { message: string; type: 'success' | 'error' }) => void;
}

interface UseFileUploadReturn {
  isDragging: boolean;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  uploadProgress: Record<string, number>;
  setUploadProgress: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;
}

export function useFileUpload({
  selectedFiles,
  setSelectedFiles,
  fileInputRef,
  onToast,
}: UseFileUploadProps): UseFileUploadReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const validFiles: File[] = [];
    
    for (const file of newFiles) {
      const validation = validateFile(file);
      if (!validation.valid) {
        onToast({ message: validation.error || 'Invalid file', type: 'error' });
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [setSelectedFiles, fileInputRef, onToast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const validFiles: File[] = [];
    
    for (const file of newFiles) {
      const validation = validateFile(file);
      if (!validation.valid) {
        onToast({ message: validation.error || 'Invalid file', type: 'error' });
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  }, [setSelectedFiles, onToast]);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, [setSelectedFiles]);

  const clearFiles = useCallback(() => {
    setSelectedFiles([]);
  }, [setSelectedFiles]);

  return {
    isDragging,
    setIsDragging,
    uploadProgress,
    setUploadProgress,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeFile,
    clearFiles,
  };
}
