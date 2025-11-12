/**
 * useHeadingDelete Hook
 * 
 * Manages delete functionality with confirmation
 */

import { useState } from 'react';

export function useHeadingDelete(
  deleteSection: () => Promise<void>,
  closeModal: () => void,
  setIsSaving: (saving: boolean) => void
) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const openDeleteConfirm = () => setShowDeleteConfirm(true);
  const cancelDelete = () => setShowDeleteConfirm(false);

  const handleDelete = async () => {
    setIsSaving(true);
    try {
      await deleteSection();
      setShowDeleteConfirm(false);
      closeModal();
    } catch (error) {
      console.error('Failed to delete:', error);
      setIsSaving(false);
    }
  };

  return {
    showDeleteConfirm,
    openDeleteConfirm,
    cancelDelete,
    handleDelete,
  };
}
