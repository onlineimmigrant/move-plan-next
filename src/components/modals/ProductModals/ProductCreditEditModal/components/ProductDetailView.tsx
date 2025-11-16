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
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          {isEditMode 
            ? selectedProduct.product_name || 'Untitled Product'
            : 'Fill in the details'
          }
        </h2>
      </div>

      {/* Content - Scrollable Form with Grid Layout */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {/* Left Column - Image & Media */}
          <div className="space-y-6 lg:col-span-1">
            {/* Product Image Section */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                Product Image
              </h3>
              <div className="space-y-3">
                <ImagePreview
                  imageUrl={formData.links_to_image}
                  productName={formData.product_name}
                  onUrlChange={onImageUrlChange}
                  onOpenGallery={onOpenImageGallery}
                  error={validationErrors.links_to_image}
                  attribution={unsplashAttribution}
                />
              </div>
            </div>

            {/* Additional Media Section - Only show when editing existing product */}
            {isEditMode && selectedProduct && carouselRef && (
              <ProductMediaCarousel
                ref={carouselRef}
                productId={parseInt(selectedProduct.id as string, 10)}
                onAddMedia={onOpenMediaGallery || (() => console.warn('⚠️ onOpenMediaGallery not provided'))}
              />
            )}
            {/* Debug: Show why carousel might not appear */}
            {!isEditMode && <div className="text-xs text-gray-500 p-2">Carousel hidden: Not in edit mode</div>}
            {isEditMode && !selectedProduct && <div className="text-xs text-gray-500 p-2">Carousel hidden: No product selected</div>}
            {isEditMode && selectedProduct && !carouselRef && <div className="text-xs text-gray-500 p-2">Carousel hidden: No carouselRef</div>}
          </div>

          {/* Basic Information Section */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
              Basic Information
            </h3>
            <div className="space-y-4">
              {/* Product Name */}
              <div>
                <label 
                  htmlFor="product_name" 
                  className="block text-sm font-medium text-slate-900 dark:text-white mb-2"
                >
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="product_name"
                  type="text"
                  value={formData.product_name}
                  onChange={(e) => onFormDataChange('product_name', e.target.value)}
                  className={`
                    w-full px-4 py-2.5 rounded-lg border
                    ${validationErrors.product_name 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-slate-300 dark:border-gray-600 focus:ring-blue-500'
                    }
                    bg-white dark:bg-gray-800 
                    text-slate-900 dark:text-white
                    focus:ring-2 focus:outline-none
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                  `}
                  placeholder="Enter product name"
                  required
                />
                {validationErrors.product_name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {validationErrors.product_name}
                  </p>
                )}
              </div>

              {/* Product Description */}
              <div>
                <label 
                  htmlFor="product_description" 
                  className="block text-sm font-medium text-slate-900 dark:text-white mb-2"
                >
                  Description
                </label>
                <textarea
                  id="product_description"
                  value={formData.product_description}
                  onChange={(e) => onFormDataChange('product_description', e.target.value)}
                  rows={4}
                  className={`
                    w-full px-4 py-2.5 rounded-lg border
                    ${validationErrors.product_description 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-slate-300 dark:border-gray-600 focus:ring-blue-500'
                    }
                    bg-white dark:bg-gray-800 
                    text-slate-900 dark:text-white
                    focus:ring-2 focus:outline-none
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                    resize-none
                  `}
                  placeholder="Enter product description (optional)"
                />
                {validationErrors.product_description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {validationErrors.product_description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing & Tax Section */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 md:col-span-2 lg:col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
              Pricing & Tax
            </h3>
            <div className="space-y-3">
              <TaxCodeSelector
                selectedTaxCode={formData.product_tax_code}
                onSelect={onTaxCodeSelect}
                error={validationErrors.product_tax_code}
              />
            </div>
          </div>

          {/* Settings Section */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
              Settings
            </h3>
            <div className="space-y-4">
              {/* Display Status Toggle */}
              <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700">
                <div>
                  <label 
                    htmlFor="is_displayed" 
                    className="text-sm font-medium text-slate-900 dark:text-white"
                  >
                    Product Visibility
                  </label>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {formData.is_displayed 
                      ? 'Product is visible to customers' 
                      : 'Product is hidden from customers'
                    }
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.is_displayed}
                  onClick={() => onFormDataChange('is_displayed', !formData.is_displayed)}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${formData.is_displayed 
                      ? 'bg-green-600' 
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

              {/* Custom Attributes (JSON) */}
              <div>
                <label 
                  htmlFor="attributes" 
                  className="block text-sm font-medium text-slate-900 dark:text-white mb-2"
                >
                  Custom Attributes (JSON)
                </label>
                <textarea
                  id="attributes"
                  value={formData.attributes}
                  onChange={(e) => onFormDataChange('attributes', e.target.value)}
                  rows={6}
                  className={`
                    w-full px-4 py-2.5 rounded-lg border
                    ${validationErrors.attributes 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-slate-300 dark:border-gray-600 focus:ring-blue-500'
                    }
                    bg-white dark:bg-gray-800 
                    text-slate-900 dark:text-white
                    focus:ring-2 focus:outline-none
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                    font-mono text-sm
                    resize-none
                  `}
                  placeholder='{"key": "value"}'
                />
                {validationErrors.attributes && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {validationErrors.attributes}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Optional JSON object for custom product attributes
                </p>
              </div>
            </div>
          </div>
        </div>
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
