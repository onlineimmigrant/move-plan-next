/**
 * ProductDetailView Component
 * 
 * Form container for creating and editing products
 * Shows product form fields and handles validation
 */

'use client';

import React, { memo, useRef } from 'react';
import Button from '@/ui/Button';
import { ImagePreview } from './ImagePreview';
import { TaxCodeSelector } from './TaxCodeSelector';
import { ProductFormFields } from './ProductFormFields';
import ProductMediaCarousel, { ProductMediaCarouselHandle } from '@/components/ProductMediaCarousel';
import type { Product, ProductFormData } from '../types';

interface ProductDetailViewProps {
  // Form data
  formData: ProductFormData;
  selectedProduct: Product | null;
  
  // UI state
  isCreating: boolean;
  isUpdating: boolean;
  validationErrors: Record<string, string>;
  
  // Callbacks
  onFormDataChange: (field: keyof ProductFormData, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  onImageUrlChange: (url: string) => void;
  onTaxCodeSelect: (taxCode: string | null) => void;
  onOpenImageGallery: () => void;
  onOpenMediaGallery?: () => void;
  carouselRef?: React.RefObject<any>;
}

const ProductDetailViewComponent = ({
  formData,
  selectedProduct,
  isCreating,
  isUpdating,
  validationErrors,
  onFormDataChange,
  onSave,
  onCancel,
  onImageUrlChange,
  onTaxCodeSelect,
  onOpenImageGallery,
  onOpenMediaGallery,
  carouselRef,
}: ProductDetailViewProps) => {
  const isEditMode = selectedProduct !== null;
  const isSaving = isCreating || isUpdating;

  // Extract Unsplash attribution from attrs if it exists
  let unsplashAttribution = null;
  try {
    if (formData.attributes) {
      const attrs = JSON.parse(formData.attributes);
      unsplashAttribution = attrs.unsplash_attribution || null;
    }
  } catch (e) {
    // Ignore parse errors
  }

  return (
    <div className="flex flex-col h-full bg-white/50 dark:bg-gray-900/50">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {isEditMode 
              ? selectedProduct.product_name || 'Untitled Product'
              : 'Fill in the details'
            }
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Product Visibility
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={formData.is_displayed}
              onClick={() => onFormDataChange('is_displayed', !formData.is_displayed)}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${formData.is_displayed 
                  ? 'bg-blue-600' 
                  : 'bg-slate-300 dark:bg-gray-600'
                }
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${formData.is_displayed ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Content - Scrollable Form with Grid Layout */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Use ProductFormFields component for all form inputs */}
        <ProductFormFields
          formData={formData}
          validationErrors={validationErrors}
          onFieldChange={onFormDataChange}
          onImageUrlChange={onImageUrlChange}
          onTaxCodeSelect={onTaxCodeSelect}
          onOpenImageGallery={onOpenImageGallery}
          onOpenMediaGallery={onOpenMediaGallery}
          unsplashAttribution={unsplashAttribution}
          selectedProduct={selectedProduct}
          carouselRef={carouselRef}
        />
      </div>

      {/* Footer - Action Buttons */}
      <div className="px-6 py-4 border-t border-slate-200/50 dark:border-gray-700/50 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-b-2xl">
        <div className="flex items-center justify-between w-full gap-3">
          {/* Left side - timestamp for edit mode */}
          {isEditMode ? (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {selectedProduct?.updated_at && (
                <span>Updated: {new Date(selectedProduct.updated_at).toLocaleString()}</span>
              )}
            </div>
          ) : (
            <div></div>
          )}
          
          {/* Right side - action buttons */}
          <div className="flex items-center gap-3 ml-auto">
            <Button
              variant="secondary"
              onClick={onCancel}
              disabled={isSaving}
              className="px-6 py-2"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={onSave}
              disabled={Object.keys(validationErrors).length > 0}
              loading={isSaving}
              loadingText={isEditMode ? 'Updating...' : 'Creating...'}
              className="px-6 py-2"
            >
              {isEditMode ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Memoized ProductDetailView
 * Only re-renders when props change
 */
export const ProductDetailView = memo(
  ProductDetailViewComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.formData === nextProps.formData &&
      prevProps.selectedProduct?.id === nextProps.selectedProduct?.id &&
      prevProps.isCreating === nextProps.isCreating &&
      prevProps.isUpdating === nextProps.isUpdating &&
      JSON.stringify(prevProps.validationErrors) === JSON.stringify(nextProps.validationErrors)
    );
  }
);

ProductDetailView.displayName = 'ProductDetailView';
