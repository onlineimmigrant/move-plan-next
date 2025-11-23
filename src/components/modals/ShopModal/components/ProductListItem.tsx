/**
 * ProductListItem Component
 * 
 * Renders a single product card with image, metadata, status indicators,
 * and action buttons. Optimized with React.memo.
 * 
 * Features:
 * - Product image with fallback
 * - Product name and description
 * - Status badge (active/archived)
 * - Stripe sync indicator
 * - Edit/delete actions
 * - Search query highlighting
 * - Keyboard accessible
 */

import React, { useState, memo } from 'react';
import { Edit, Trash2, ExternalLink, Eye, EyeOff } from 'lucide-react';
import type { Product } from '../types';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ProductListItemProps {
  product: Product;
  isSelected?: boolean;
  searchQuery?: string;
  onClick: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: number) => void;
  isDeleting?: boolean;
}

const ProductListItemComponent = ({
  product,
  isSelected = false,
  searchQuery = '',
  onClick,
  onEdit,
  onDelete,
  isDeleting = false,
}: ProductListItemProps) => {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const [imageError, setImageError] = useState(false);

  // Highlight search query in text
  const highlightText = (text: string) => {
    if (!searchQuery || !text) return text;
    
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
          {part}
        </mark>
      ) : part
    );
  };

  // Truncate description
  const truncateDescription = (text: string | null, maxLength: number = 120) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Handle click
  const handleClick = () => {
    onClick(product);
  };

  // Handle edit
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(product);
  };

  // Handle delete
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(product.id);
  };

  return (
    <article
      className={`
        relative group
        bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm
        border-2 rounded-xl p-4
        transition-all duration-200 cursor-pointer
        hover:shadow-lg hover:scale-[1.02]
        ${isSelected 
          ? `border-[${primary.base}] shadow-lg ring-2 ring-[${primary.base}]/20` 
          : 'border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600'
        }
      `}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Product: ${product.product_name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Product Image */}
      <div className="relative h-48 mb-4 bg-slate-100 dark:bg-gray-700 rounded-lg overflow-hidden group/img">
        {product.links_to_image && !imageError ? (
          <>
            <img
              src={product.links_to_image}
              alt={product.product_name || 'Product image'}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
            
            {/* Unsplash Attribution - Two-tier design */}
            {product.attrs?.unsplash_attribution && (
              <>
                {/* Always visible: Small Unsplash badge */}
                <a
                  href="https://unsplash.com/?utm_source=codedharmony&utm_medium=referral"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-1.5 right-1.5 bg-white/70 hover:bg-white/90 backdrop-blur-sm rounded p-1 shadow-md hover:shadow-lg transition-all group-hover/img:opacity-0 z-10"
                  onClick={(e) => e.stopPropagation()}
                  title="Photo from Unsplash"
                >
                  <svg className="w-3 h-3 text-black/80" fill="currentColor" viewBox="0 0 32 32">
                    <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"/>
                  </svg>
                </a>
                
                {/* On hover: Full attribution */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent backdrop-blur-md text-white text-xs px-3 py-2.5 opacity-0 group-hover/img:opacity-100 transition-all duration-300">
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 32 32">
                      <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"/>
                    </svg>
                    <span className="text-white/90">Photo by{' '}
                      <a
                        href={`${product.attrs.unsplash_attribution.photographer_url}?utm_source=codedharmony&utm_medium=referral`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white font-medium hover:text-blue-300 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {product.attrs.unsplash_attribution.photographer}
                      </a>
                      {' '}on{' '}
                      <a
                        href="https://unsplash.com/?utm_source=codedharmony&utm_medium=referral"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white font-medium hover:text-blue-300 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Unsplash
                      </a>
                    </span>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
            <svg 
              className="w-16 h-16" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" 
              />
            </svg>
          </div>
        )}

        {/* Action buttons overlay */}
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={handleEdit}
              className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
              aria-label="Edit product"
              title="Edit product"
            >
              <Edit className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
              aria-label="Delete product"
              title="Delete product"
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-3">
        {/* Name */}
        <h3 className="text-base font-semibold text-slate-900 dark:text-white line-clamp-2 min-h-[3rem]">
          {highlightText(product.product_name || 'Untitled Product')}
        </h3>

        {/* Description */}
        {product.product_description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 min-h-[2.5rem]">
            {highlightText(truncateDescription(product.product_description))}
          </p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Display Status */}
          <span
            className={`
              inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
              ${product.is_displayed 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }
            `}
          >
            {product.is_displayed ? (
              <>
                <Eye className="w-3 h-3" />
                Active
              </>
            ) : (
              <>
                <EyeOff className="w-3 h-3" />
                Hidden
              </>
            )}
          </span>

          {/* Stripe Sync */}
          {product.stripe_product_id && (
            <span 
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
              title={`Stripe ID: ${product.stripe_product_id}`}
            >
              <ExternalLink className="w-3 h-3" />
              Stripe
            </span>
          )}

          {/* Tax Code */}
          {product.product_tax_code && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
              Tax: {product.product_tax_code}
            </span>
          )}
        </div>

        {/* Metadata */}
        <div className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-2">
          <span>ID: {String(product.id).substring(0, 8)}...</span>
          {product.updated_at && (
            <>
              <span>•</span>
              <span>Updated {new Date(product.updated_at).toLocaleDateString()}</span>
            </>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {isDeleting && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 dark:border-slate-600 border-t-transparent"></div>
            <span className="text-sm font-medium">Deleting...</span>
          </div>
        </div>
      )}
    </article>
  );
};

/**
 * Memoized ProductListItem
 * Only re-renders when props change
 */
export const ProductListItem = memo(
  ProductListItemComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.product.id === nextProps.product.id &&
      prevProps.product.product_name === nextProps.product.product_name &&
      prevProps.product.product_description === nextProps.product.product_description &&
      prevProps.product.links_to_image === nextProps.product.links_to_image &&
      prevProps.product.is_displayed === nextProps.product.is_displayed &&
      prevProps.product.stripe_product_id === nextProps.product.stripe_product_id &&
      prevProps.product.product_tax_code === nextProps.product.product_tax_code &&
      prevProps.product.updated_at === nextProps.product.updated_at &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.searchQuery === nextProps.searchQuery &&
      prevProps.isDeleting === nextProps.isDeleting
    );
  }
);

ProductListItem.displayName = 'ProductListItem';
