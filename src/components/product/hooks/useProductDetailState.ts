/**
 * Product Detail State Management Hook
 * Separates UI state logic from component for better maintainability
 * Pattern inspired by Meetings modal architecture
 */

import { useState, useCallback } from 'react';

export function useProductDetailState() {
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const selectPlan = useCallback((planId: number) => {
    setSelectedPlanId(planId);
    setError(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPlanId(null);
  }, []);

  const toggleImageGallery = useCallback(() => {
    setShowImageGallery(prev => !prev);
  }, []);

  const setMediaIndex = useCallback((index: number) => {
    setActiveMediaIndex(index);
  }, []);

  const resetState = useCallback(() => {
    setSelectedPlanId(null);
    setIsAddingToCart(false);
    setShowImageGallery(false);
    setActiveMediaIndex(0);
    setError(null);
  }, []);

  return {
    selectedPlanId,
    isAddingToCart,
    showImageGallery,
    activeMediaIndex,
    error,
    selectPlan,
    clearSelection,
    toggleImageGallery,
    setMediaIndex,
    setIsAddingToCart,
    setError,
    resetState,
  };
}
