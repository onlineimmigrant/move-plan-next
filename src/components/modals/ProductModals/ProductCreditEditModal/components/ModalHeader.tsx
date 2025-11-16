/**
 * ModalHeader Component
 * 
 * Header with title, icon, product count badge, and close button
 * Includes drag handle for desktop
 */

'use client';

import React from 'react';
import { XMarkIcon, CubeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  productCount: number;
  primaryColor: string;
  onClose: () => void;
  selectedProduct?: any;
  onBack?: () => void;
}

export function ModalHeader({
  title,
  subtitle,
  productCount,
  primaryColor,
  onClose,
  selectedProduct,
  onBack,
}: ModalHeaderProps) {
  return (
    <div className="modal-drag-handle flex-shrink-0 border-b border-gray-200/50 dark:border-gray-700/50 px-4 sm:px-6 py-4 cursor-move">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Back Button (mobile only, when viewing product detail) */}
          {selectedProduct && onBack && (
            <button
              onClick={onBack}
              className="sm:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Back to product list"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          
          {/* Icon */}
          <div
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <CubeIcon
              className="h-6 w-6"
              style={{ color: primaryColor }}
            />
          </div>
          
          {/* Title and Subtitle */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Side - Badge and Close */}
        <div className="flex items-center gap-2">
          {/* Product Count Badge (hide when viewing single product) */}
          {!selectedProduct && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {productCount} {productCount === 1 ? 'product' : 'products'}
              </span>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
