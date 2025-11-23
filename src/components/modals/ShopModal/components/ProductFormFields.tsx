/**
 * ProductFormFields Component
 * 
 * All form inputs for product create/edit with proper grid layout and media handling
 * Includes all 17 editable fields plus image preview and media carousel
 */

'use client';

import React from 'react';
import { ImagePreview } from './ImagePreview';
import { TaxCodeSelector } from './TaxCodeSelector';
import ProductMediaCarousel, { ProductMediaCarouselHandle } from '@/components/ProductMediaCarousel';
import type { ProductFormData, Product } from '../types';

interface ProductFormFieldsProps {
  formData: ProductFormData;
  validationErrors: Record<string, string>;
  onFieldChange: (field: keyof ProductFormData, value: any) => void;
  onTaxCodeSelect: (taxCode: string | null) => void;
  onImageUrlChange?: (url: string) => void;
  onOpenImageGallery?: () => void;
  onOpenMediaGallery?: () => void;
  unsplashAttribution?: any;
  selectedProduct?: Product | null;
  carouselRef?: React.RefObject<ProductMediaCarouselHandle>;
}

export function ProductFormFields({
  formData,
  validationErrors,
  onFieldChange,
  onTaxCodeSelect,
  onImageUrlChange,
  onOpenImageGallery,
  onOpenMediaGallery,
  unsplashAttribution,
  selectedProduct,
  carouselRef,
}: ProductFormFieldsProps) {
  const isEditMode = selectedProduct !== null;

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {/* Left Column - Image & Media */}
      <div className="space-y-6 lg:col-span-1">
        {/* Product Image Section */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            Product Image
          </h3>
          <div className="space-y-3">
            {onImageUrlChange && (
              <ImagePreview
                imageUrl={formData.links_to_image}
                productName={formData.product_name}
                onUrlChange={onImageUrlChange}
                onOpenGallery={onOpenImageGallery || (() => {})}
                error={validationErrors.links_to_image}
                attribution={unsplashAttribution}
              />
            )}
          </div>
        </div>

        {/* Additional Media Section - Only show when editing existing product */}
        {isEditMode && selectedProduct && carouselRef && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Media
              </h3>
              <button
                type="button"
                onClick={onOpenMediaGallery || (() => console.warn('⚠️ onOpenMediaGallery not provided'))}
                className="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                +Add
              </button>
            </div>
            <ProductMediaCarousel
              ref={carouselRef}
              productId={selectedProduct.id}
              onAddMedia={() => {}}
            />
          </div>
        )}
      </div>

      {/* Middle Column - Basic Information */}
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
              onChange={(e) => onFieldChange('product_name', e.target.value)}
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
              onChange={(e) => onFieldChange('product_description', e.target.value)}
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

          {/* SEO & Identifiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Slug
              </label>
              <input
                id="slug"
                type="text"
                value={formData.slug}
                onChange={(e) => onFieldChange('slug', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
                placeholder="product-slug"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">URL-friendly identifier</p>
            </div>
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                SKU
              </label>
              <input
                id="sku"
                type="text"
                value={formData.sku}
                onChange={(e) => onFieldChange('sku', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
                placeholder="SKU-12345"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Stock keeping unit</p>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="metadescription_for_page" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Meta Description
              </label>
              <textarea
                id="metadescription_for_page"
                value={formData.metadescription_for_page}
                onChange={(e) => onFieldChange('metadescription_for_page', e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none placeholder:text-slate-400"
                placeholder="SEO meta description for this product page"
                maxLength={160}
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Max 160 characters for SEO</p>
            </div>
          </div>

          {/* Pricing & Tax */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Pricing & Tax
            </h4>
            <TaxCodeSelector
              selectedTaxCode={formData.product_tax_code}
              onSelect={onTaxCodeSelect}
              error={validationErrors.product_tax_code}
            />
          </div>

          {/* Custom Attributes (JSON) */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Custom Attributes
            </h4>
            <div>
              <textarea
                id="attributes"
                value={formData.attributes}
                onChange={(e) => onFieldChange('attributes', e.target.value)}
                rows={4}
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

      {/* Book/Author Information */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 md:col-span-2 lg:col-span-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          Book/Author Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Author
            </label>
            <input
              id="author"
              type="text"
              value={formData.author}
              onChange={(e) => onFieldChange('author', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
              placeholder="Author name"
            />
          </div>
          <div>
            <label htmlFor="author_2" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Co-Author
            </label>
            <input
              id="author_2"
              type="text"
              value={formData.author_2}
              onChange={(e) => onFieldChange('author_2', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
              placeholder="Co-author name"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="isbn" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              ISBN
            </label>
            <input
              id="isbn"
              type="text"
              value={formData.isbn}
              onChange={(e) => onFieldChange('isbn', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
              placeholder="978-3-16-148410-0"
            />
          </div>
        </div>
      </div>

      {/* Display & Ordering */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 md:col-span-2 lg:col-span-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          Display Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="background_color" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Background Color
            </label>
            <input
              id="background_color"
              type="text"
              value={formData.background_color}
              onChange={(e) => onFieldChange('background_color', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
              placeholder="#FFFFFF or rgb(255,255,255)"
            />
          </div>
          <div>
            <label htmlFor="order" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Display Order
            </label>
            <input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) => onFieldChange('order', Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
              placeholder="0"
              min="0"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Lower numbers appear first</p>
          </div>
        </div>
      </div>

      {/* External Links */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 md:col-span-2 lg:col-span-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          External Links
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="amazon_books_url" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Amazon Books URL
            </label>
            <input
              id="amazon_books_url"
              type="url"
              value={formData.amazon_books_url}
              onChange={(e) => onFieldChange('amazon_books_url', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
              placeholder="https://amazon.com/..."
            />
          </div>
          <div>
            <label htmlFor="compare_link_url" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Compare Link URL
            </label>
            <input
              id="compare_link_url"
              type="url"
              value={formData.compare_link_url}
              onChange={(e) => onFieldChange('compare_link_url', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 md:col-span-2 lg:col-span-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          Additional Details
        </h3>
        <div>
          <label htmlFor="details" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
            Additional Information
          </label>
          <textarea
            id="details"
            value={formData.details}
            onChange={(e) => onFieldChange('details', e.target.value)}
            rows={4}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none placeholder:text-slate-400"
            placeholder="Any additional product details or notes..."
          />
        </div>
      </div>
    </div>
  );
}
