/**
 * ProductFormFields Component
 * 
 * All form inputs for product create/edit
 * Includes: name, description, image URL, attributes JSON, tax code, is_displayed
 */

'use client';

import React from 'react';
import { TaxCodeSelector } from './TaxCodeSelector';
import type { ProductFormData } from '../types';

interface ProductFormFieldsProps {
  formData: ProductFormData;
  validationErrors: Record<string, string>;
  onFieldChange: (field: keyof ProductFormData, value: any) => void;
  onTaxCodeSelect: (taxCode: string | null) => void;
}

export function ProductFormFields({
  formData,
  validationErrors,
  onFieldChange,
  onTaxCodeSelect,
}: ProductFormFieldsProps) {
  return (
    <div className="space-y-6">
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

      {/* Image URL */}
      <div>
        <label 
          htmlFor="links_to_image" 
          className="block text-sm font-medium text-slate-900 dark:text-white mb-2"
        >
          Image URL
        </label>
        <input
          id="links_to_image"
          type="url"
          value={formData.links_to_image}
          onChange={(e) => onFieldChange('links_to_image', e.target.value)}
          className={`
            w-full px-4 py-2.5 rounded-lg border
            ${validationErrors.links_to_image 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-slate-300 dark:border-gray-600 focus:ring-blue-500'
            }
            bg-white dark:bg-gray-800 
            text-slate-900 dark:text-white
            focus:ring-2 focus:outline-none
            placeholder:text-slate-400 dark:placeholder:text-slate-500
          `}
          placeholder="https://example.com/image.jpg"
        />
        {validationErrors.links_to_image && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {validationErrors.links_to_image}
          </p>
        )}
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Enter a valid URL to an image (HTTPS required for production)
        </p>
      </div>

      {/* Tax Code Selector */}
      <div>
        <label 
          htmlFor="product_tax_code" 
          className="block text-sm font-medium text-slate-900 dark:text-white mb-2"
        >
          Tax Code
        </label>
        <TaxCodeSelector
          selectedTaxCode={formData.product_tax_code}
          onSelect={onTaxCodeSelect}
          error={validationErrors.product_tax_code}
        />
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
          onChange={(e) => onFieldChange('attributes', e.target.value)}
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

      {/* Display Status Toggle */}
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-800/50 rounded-lg border border-slate-200 dark:border-gray-700">
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
          onClick={() => onFieldChange('is_displayed', !formData.is_displayed)}
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
    </div>
  );
}
