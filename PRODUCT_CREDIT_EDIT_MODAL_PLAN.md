# ProductCreditEditModal Implementation Plan

## 🎯 Executive Summary

Create a modern, standardized **ProductCreditEditModal** component that follows the proven architecture patterns from `TicketsAdminModal` while incorporating the business logic from `/admin/products/management/page.tsx`. This modal will be integrated into the UnifiedMenu for quick product management.

**Key Objectives**:
- ✅ Unified glass morphism design matching TicketsAdminModal
- ✅ Full separation of concerns (hooks, components, utils, types)
- ✅ Real-time product list updates via Supabase
- ✅ Responsive design (mobile fullscreen, desktop draggable)
- ✅ Complete CRUD operations for products
- ✅ Stripe integration for product synchronization
- ✅ Tax code search and validation
- ✅ Image preview and validation
- ✅ Accessibility compliant (WCAG 2.1 AA)

**Timeline**: 2-3 days

---

## 📊 Current State Analysis

### Existing Product Management (`/admin/products/management/page.tsx`)

**Features**:
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Tax code lookup with autocomplete (~18,000 tax codes)
- ✅ Image URL validation and preview
- ✅ JSON attributes field for custom metadata
- ✅ Display status toggle (is_displayed)
- ✅ Search/filter by product name
- ✅ Tab filtering (all/active/archived)
- ✅ Stripe product integration
- ✅ Toast notifications for success/error

**Current Issues**:
- ❌ Side-panel modal (not modern glass morphism)
- ❌ Not integrated into UnifiedMenu
- ❌ No separation of concerns (all logic in one file)
- ❌ No real-time updates
- ❌ Limited keyboard shortcuts
- ❌ No drag/resize capability
- ❌ Inconsistent with other modals

### Database Schema (`product` table)

**Core Fields Used**:
```sql
- id (SERIAL PRIMARY KEY)
- product_name (VARCHAR(500) NOT NULL)
- product_description (TEXT)
- is_displayed (BOOLEAN DEFAULT true)
- links_to_image (TEXT[]) -- We'll use first element
- attrs (JSONB) -- Custom attributes
- product_tax_code (VARCHAR(50))
- stripe_product_id (VARCHAR(255))
- organization_id (INTEGER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**API Endpoints**:
- `POST /api/products` - Create product
- `PUT /api/products` - Update product
- `DELETE /api/products` - Delete product
- `GET /api/products/list` - List all products for org

### Reference Modal (TicketsAdminModal)

**Architecture Strengths**:
- ✅ Glass morphism container with backdrop blur
- ✅ Draggable/resizable (React-rnd)
- ✅ Separation of concerns:
  - `hooks/` - 25+ custom hooks
  - `components/` - 30+ reusable components
  - `utils/` - Helper functions
  - `types.ts` - TypeScript interfaces
- ✅ Real-time subscriptions
- ✅ Keyboard shortcuts
- ✅ Loading/empty/error states
- ✅ Accessibility features
- ✅ Toast notifications
- ✅ Search and filtering

---

## 🏗️ Architecture Design

### File Structure

```
src/components/modals/ProductModals/
├── ProductCreditEditModal/
│   ├── ProductCreditEditModal.tsx          # Main modal component
│   ├── ProductCreditEditToggleButton.tsx   # UnifiedMenu integration button
│   │
│   ├── components/
│   │   ├── index.ts                        # Barrel exports
│   │   ├── ModalContainer.tsx              # Glass morphism container
│   │   ├── ModalHeader.tsx                 # Header with tabs/badges
│   │   ├── ProductList.tsx                 # Product list view
│   │   ├── ProductListItem.tsx             # Individual product card
│   │   ├── ProductDetailView.tsx           # Product edit form
│   │   ├── ProductFormFields.tsx           # Form input components
│   │   ├── TaxCodeSelector.tsx             # Tax code autocomplete
│   │   ├── ImagePreview.tsx                # Image validation/preview
│   │   ├── ProductSearchBar.tsx            # Search input
│   │   ├── ProductFilterBar.tsx            # Filter tabs (all/active/archived)
│   │   ├── EmptyState.tsx                  # No products state
│   │   ├── LoadingState.tsx                # Loading skeleton
│   │   ├── ErrorState.tsx                  # Error display
│   │   ├── ConfirmationDialog.tsx          # Delete confirmation
│   │   └── LiveRegion.tsx                  # Screen reader announcements
│   │
│   ├── hooks/
│   │   ├── index.ts                        # Barrel exports
│   │   ├── useProductData.ts               # Fetch/manage products
│   │   ├── useProductOperations.ts         # CRUD operations
│   │   ├── useProductFilters.ts            # Search/filter logic
│   │   ├── useTaxCodeSearch.ts             # Tax code autocomplete
│   │   ├── useImageValidation.ts           # URL validation
│   │   ├── useDebounce.ts                  # Debounce search
│   │   ├── useLocalStorageFilters.ts       # Persist filters
│   │   ├── useModalDataFetching.ts         # Initial data load
│   │   ├── useProductKeyboardShortcuts.ts  # Keyboard navigation
│   │   └── useRealtimeSubscription.ts      # Supabase real-time
│   │
│   ├── utils/
│   │   ├── index.ts                        # Barrel exports
│   │   ├── validation.ts                   # URL/JSON validators
│   │   ├── productHelpers.ts               # Helper functions
│   │   ├── apiClient.ts                    # API call wrappers
│   │   └── constants.ts                    # Constants
│   │
│   ├── types.ts                            # TypeScript interfaces
│   └── context.tsx                         # Modal context provider
│
└── index.ts                                # Public exports
```

---

## 📋 Implementation Plan

### Phase 1: Foundation (Day 1 - Morning)

**1.1 Create Type Definitions** (`types.ts`)

```typescript
// Product interface matching database schema
export interface Product {
  id: string;
  product_name: string;
  product_description?: string;
  is_displayed: boolean;
  links_to_image?: string; // First image from array
  attrs?: Record<string, any>;
  product_tax_code?: string;
  stripe_product_id?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

// Form data for create/update
export interface ProductFormData {
  product_name: string;
  is_displayed: boolean;
  product_description: string;
  links_to_image: string;
  attributes: string; // JSON string
  product_tax_code: string;
}

// Tax code from tax_codes.json
export interface TaxCode {
  product_tax_code: string;
  description: string;
  tax_category: string;
}

// Filter state
export interface ProductFilters {
  searchQuery: string;
  activeTab: 'all' | 'active' | 'archived';
  sortBy: 'name' | 'created' | 'updated';
}

// Modal props
export interface ProductCreditEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**1.2 Create Context Provider** (`context.tsx`)

```typescript
import React, { createContext, useContext, useState } from 'react';

interface ProductModalContextType {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const ProductModalContext = createContext<ProductModalContextType | undefined>(undefined);

export function ProductModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <ProductModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
    </ProductModalContext.Provider>
  );
}

export function useProductModal() {
  const context = useContext(ProductModalContext);
  if (!context) throw new Error('useProductModal must be used within ProductModalProvider');
  return context;
}
```

**1.3 Create Utility Functions** (`utils/validation.ts`)

```typescript
export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateJSON(json: string): boolean {
  try {
    JSON.parse(json);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeImageUrl(url: string): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://') ? url : undefined;
  } catch {
    return undefined;
  }
}
```

**Deliverables**:
- ✅ TypeScript types defined
- ✅ Context provider created
- ✅ Validation utilities ready

---

### Phase 2: Core Hooks (Day 1 - Afternoon)

**2.1 Product Data Hook** (`useProductData.ts`)

```typescript
import { useState, useCallback } from 'react';
import { Product } from '../types';

interface UseProductDataProps {
  organizationId: string;
  onToast: (message: string, type: 'success' | 'error') => void;
}

export function useProductData({ organizationId, onToast }: UseProductDataProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/products/list');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      onToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [onToast]);

  return {
    products,
    setProducts,
    isLoading,
    error,
    fetchProducts,
  };
}
```

**2.2 Product Operations Hook** (`useProductOperations.ts`)

```typescript
import { useState, useCallback } from 'react';
import { Product, ProductFormData } from '../types';

interface UseProductOperationsProps {
  onToast: (message: string, type: 'success' | 'error') => void;
  onRefreshProducts: () => void;
}

export function useProductOperations({ onToast, onRefreshProducts }: UseProductOperationsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const handleCreateProduct = useCallback(async (formData: ProductFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: formData.product_name,
          is_displayed: formData.is_displayed,
          product_description: formData.product_description || undefined,
          links_to_image: formData.links_to_image || undefined,
          attrs: formData.attributes ? JSON.parse(formData.attributes) : undefined,
          product_tax_code: formData.product_tax_code || undefined,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
      
      onToast('Product created successfully', 'success');
      onRefreshProducts();
      return true;
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Failed to create product', 'error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [onToast, onRefreshProducts]);

  const handleUpdateProduct = useCallback(async (productId: string, formData: ProductFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          updates: {
            product_name: formData.product_name,
            is_displayed: formData.is_displayed,
            product_description: formData.product_description || undefined,
            links_to_image: formData.links_to_image || undefined,
            attrs: formData.attributes ? JSON.parse(formData.attributes) : undefined,
            product_tax_code: formData.product_tax_code || undefined,
          },
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
      
      onToast('Product updated successfully', 'success');
      onRefreshProducts();
      return true;
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Failed to update product', 'error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [onToast, onRefreshProducts]);

  const confirmDeleteProduct = useCallback(async () => {
    if (!productToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: productToDelete.id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
      
      onToast('Product deleted successfully', 'success');
      onRefreshProducts();
      setShowDeleteConfirmation(false);
      setProductToDelete(null);
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Failed to delete product', 'error');
    } finally {
      setIsDeleting(false);
    }
  }, [productToDelete, onToast, onRefreshProducts]);

  return {
    isSubmitting,
    isDeleting,
    showDeleteConfirmation,
    productToDelete,
    setShowDeleteConfirmation,
    setProductToDelete,
    handleCreateProduct,
    handleUpdateProduct,
    confirmDeleteProduct,
  };
}
```

**2.3 Tax Code Search Hook** (`useTaxCodeSearch.ts`)

```typescript
import { useState, useMemo } from 'react';
import taxCodesData from '@/components/tax_codes.json';
import { TaxCode } from '../types';

export function useTaxCodeSearch() {
  const [taxCodes] = useState<TaxCode[]>(taxCodesData);
  const [taxCodeSearch, setTaxCodeSearch] = useState('');
  const [isTaxCodeDropdownOpen, setIsTaxCodeDropdownOpen] = useState(false);

  const filteredTaxCodes = useMemo(() => {
    if (!taxCodeSearch) return [];
    
    return taxCodes.filter(tc =>
      tc.description.toLowerCase().includes(taxCodeSearch.toLowerCase()) ||
      tc.product_tax_code.toLowerCase().includes(taxCodeSearch.toLowerCase())
    ).slice(0, 50); // Limit to 50 results for performance
  }, [taxCodes, taxCodeSearch]);

  return {
    taxCodes,
    taxCodeSearch,
    setTaxCodeSearch,
    isTaxCodeDropdownOpen,
    setIsTaxCodeDropdownOpen,
    filteredTaxCodes,
  };
}
```

**2.4 Product Filters Hook** (`useProductFilters.ts`)

```typescript
import { useMemo } from 'react';
import { Product, ProductFilters } from '../types';

interface UseProductFiltersProps {
  products: Product[];
  filters: ProductFilters;
}

export function useProductFilters({ products, filters }: UseProductFiltersProps) {
  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    
    // Filter by tab (all/active/archived)
    if (filters.activeTab === 'active') {
      filtered = filtered.filter(p => p.is_displayed);
    } else if (filters.activeTab === 'archived') {
      filtered = filtered.filter(p => !p.is_displayed);
    }
    
    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.product_name.toLowerCase().includes(query) ||
        p.product_description?.toLowerCase().includes(query)
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return a.product_name.localeCompare(b.product_name);
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [products, filters]);

  return { filteredProducts };
}
```

**Deliverables**:
- ✅ Product data management hook
- ✅ CRUD operations hook
- ✅ Tax code search hook
- ✅ Filter/search hook

---

### Phase 3: UI Components (Day 2 - Morning)

**3.1 Modal Container** (`components/ModalContainer.tsx`)

```typescript
import React from 'react';
import { Rnd } from 'react-rnd';

interface ModalContainerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function ModalContainer({ isOpen, onClose, children }: ModalContainerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal - Desktop Draggable */}
      <div className="hidden sm:block">
        <Rnd
          default={{
            x: window.innerWidth / 2 - 560,
            y: window.innerHeight / 2 - 450,
            width: 1120,
            height: 900,
          }}
          minWidth={800}
          minHeight={700}
          bounds="window"
          dragHandleClassName="drag-handle"
          className="z-[10001]"
        >
          <div className="h-full w-full bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl border border-white/20 dark:border-gray-700/20 shadow-2xl rounded-2xl overflow-hidden flex flex-col">
            {children}
          </div>
        </Rnd>
      </div>

      {/* Modal - Mobile Fullscreen */}
      <div className="sm:hidden fixed inset-0 z-[10001]">
        <div className="h-[90vh] w-full bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl border border-white/20 dark:border-gray-700/20 shadow-2xl rounded-2xl overflow-hidden flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
```

**3.2 Modal Header** (`components/ModalHeader.tsx`)

```typescript
import React from 'react';
import { XMarkIcon, CubeIcon } from '@heroicons/react/24/outline';

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
    <div className="drag-handle flex-shrink-0 border-b border-gray-200/50 dark:border-gray-700/50 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedProduct && onBack && (
            <button
              onClick={onBack}
              className="sm:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Back to product list"
            >
              ←
            </button>
          )}
          
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <CubeIcon
              className="h-6 w-6"
              style={{ color: primaryColor }}
            />
          </div>
          
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

        <div className="flex items-center gap-2">
          {/* Product Count Badge */}
          {!selectedProduct && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {productCount} products
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
```

**3.3 Product List** (`components/ProductList.tsx`)

```typescript
import React from 'react';
import { ProductListItem } from './ProductListItem';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { Product } from '../types';

interface ProductListProps {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  onSelectProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onRefresh: () => void;
}

export function ProductList({
  products,
  isLoading,
  error,
  searchQuery,
  onSelectProduct,
  onDeleteProduct,
  onRefresh,
}: ProductListProps) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRefresh} />;
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title="No products found"
        description={
          searchQuery
            ? `No products match "${searchQuery}"`
            : "Create your first product to get started"
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 sm:p-6">
      {products.map((product) => (
        <ProductListItem
          key={product.id}
          product={product}
          onSelect={() => onSelectProduct(product)}
          onDelete={() => onDeleteProduct(product)}
        />
      ))}
    </div>
  );
}
```

**3.4 Product Detail View** (`components/ProductDetailView.tsx`)

```typescript
import React from 'react';
import { ProductFormFields } from './ProductFormFields';
import { Product, ProductFormData } from '../types';

interface ProductDetailViewProps {
  product: Product | null;
  formData: ProductFormData;
  isSubmitting: boolean;
  onFormDataChange: (data: ProductFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function ProductDetailView({
  product,
  formData,
  isSubmitting,
  onFormDataChange,
  onSubmit,
  onCancel,
  onDelete,
}: ProductDetailViewProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          {product ? 'Edit Product' : 'Create Product'}
        </h3>

        <ProductFormFields
          formData={formData}
          onChange={onFormDataChange}
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
          </button>

          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>

          {product && onDelete && (
            <button
              onClick={onDelete}
              className="ml-auto px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
            >
              Delete Product
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Deliverables**:
- ✅ Glass morphism container
- ✅ Modal header with badges
- ✅ Product list view
- ✅ Product detail/form view

---

### Phase 4: Integration (Day 2 - Afternoon)

**4.1 Main Modal Component** (`ProductCreditEditModal.tsx`)

```typescript
'use client';

import React, { useState, useCallback } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import {
  ModalContainer,
  ModalHeader,
  ProductList,
  ProductDetailView,
  ProductSearchBar,
  ProductFilterBar,
  ConfirmationDialog,
  LiveRegion,
} from './components';
import {
  useProductData,
  useProductOperations,
  useProductFilters,
  useTaxCodeSearch,
  useDebounce,
  useModalDataFetching,
} from './hooks';
import { Product, ProductFormData, ProductFilters } from './types';

interface ProductCreditEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductCreditEditModal({
  isOpen,
  onClose,
}: ProductCreditEditModalProps) {
  const { settings } = useSettings();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  // State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    product_name: '',
    is_displayed: true,
    product_description: '',
    links_to_image: '',
    attributes: '',
    product_tax_code: '',
  });
  const [filters, setFilters] = useState<ProductFilters>({
    searchQuery: '',
    activeTab: 'all',
    sortBy: 'updated',
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [announcement, setAnnouncement] = useState('');

  // Toast helper
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  // Hooks
  const productData = useProductData({
    organizationId: settings.organization_id,
    onToast: showToast,
  });

  const productOperations = useProductOperations({
    onToast: showToast,
    onRefreshProducts: productData.fetchProducts,
  });

  const debouncedSearchQuery = useDebounce(filters.searchQuery, 300);

  const { filteredProducts } = useProductFilters({
    products: productData.products,
    filters: { ...filters, searchQuery: debouncedSearchQuery },
  });

  // Fetch products on modal open
  useModalDataFetching({
    isOpen,
    onFetchData: productData.fetchProducts,
  });

  // Handlers
  const handleSelectProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
    setFormData({
      product_name: product.product_name,
      is_displayed: product.is_displayed,
      product_description: product.product_description || '',
      links_to_image: product.links_to_image || '',
      attributes: product.attrs ? JSON.stringify(product.attrs, null, 2) : '',
      product_tax_code: product.product_tax_code || '',
    });
  }, []);

  const handleCreateNew = useCallback(() => {
    setSelectedProduct(null);
    setFormData({
      product_name: '',
      is_displayed: true,
      product_description: '',
      links_to_image: '',
      attributes: '',
      product_tax_code: '',
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    const success = selectedProduct
      ? await productOperations.handleUpdateProduct(selectedProduct.id, formData)
      : await productOperations.handleCreateProduct(formData);

    if (success) {
      setSelectedProduct(null);
      handleCreateNew();
    }
  }, [selectedProduct, formData, productOperations, handleCreateNew]);

  const handleDelete = useCallback((product: Product) => {
    productOperations.setProductToDelete(product);
    productOperations.setShowDeleteConfirmation(true);
  }, [productOperations]);

  return (
    <>
      <ModalContainer isOpen={isOpen} onClose={onClose}>
        <ModalHeader
          title="Products"
          subtitle="Manage your products and credits"
          productCount={productData.products.length}
          primaryColor={primary.base}
          onClose={onClose}
          selectedProduct={selectedProduct}
          onBack={() => setSelectedProduct(null)}
        />

        {selectedProduct ? (
          <ProductDetailView
            product={selectedProduct}
            formData={formData}
            isSubmitting={productOperations.isSubmitting}
            onFormDataChange={setFormData}
            onSubmit={handleSubmit}
            onCancel={() => setSelectedProduct(null)}
            onDelete={() => handleDelete(selectedProduct)}
          />
        ) : (
          <>
            <div className="p-4 sm:p-6 border-b border-gray-200/50 dark:border-gray-700/50 space-y-4">
              <ProductSearchBar
                value={filters.searchQuery}
                onChange={(query) => setFilters({ ...filters, searchQuery: query })}
              />
              <ProductFilterBar
                activeTab={filters.activeTab}
                onTabChange={(tab) => setFilters({ ...filters, activeTab: tab })}
                counts={{
                  all: productData.products.length,
                  active: productData.products.filter(p => p.is_displayed).length,
                  archived: productData.products.filter(p => !p.is_displayed).length,
                }}
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              <ProductList
                products={filteredProducts}
                isLoading={productData.isLoading}
                error={productData.error}
                searchQuery={debouncedSearchQuery}
                onSelectProduct={handleSelectProduct}
                onDeleteProduct={handleDelete}
                onRefresh={productData.fetchProducts}
              />
            </div>

            {/* Floating Create Button */}
            <button
              onClick={handleCreateNew}
              className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 p-4 rounded-full shadow-lg hover:shadow-xl transition-shadow"
              style={{ backgroundColor: primary.base }}
              aria-label="Create new product"
            >
              <span className="text-white text-2xl">+</span>
            </button>
          </>
        )}
      </ModalContainer>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={productOperations.showDeleteConfirmation}
        title="Delete Product"
        message={`Are you sure you want to delete "${productOperations.productToDelete?.product_name}"?`}
        confirmLabel="Delete"
        onConfirm={productOperations.confirmDeleteProduct}
        onCancel={() => productOperations.setShowDeleteConfirmation(false)}
        isLoading={productOperations.isDeleting}
      />

      {/* Live Region */}
      <LiveRegion message={announcement} />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-[10002]">
          {/* Toast component */}
        </div>
      )}
    </>
  );
}
```

**4.2 UnifiedMenu Integration**

Update `SiteActionsModal.tsx`:

```typescript
import { useProductModal } from '@/components/modals/ProductModals/ProductCreditEditModal/context';

// In component:
const { openModal: openProductModal } = useProductModal();

// In quickActions array:
{
  id: 'product_page',
  label: 'Product',
  icon: CubeIcon,
  shortcut: `${modifierKey}P`,
  action: () => {
    onClose();
    openProductModal();
  },
},
```

**4.3 Toggle Button** (`ProductCreditEditToggleButton.tsx`)

```typescript
'use client';

import React from 'react';
import { CubeIcon } from '@heroicons/react/24/outline';
import { useProductModal } from './context';
import { useThemeColors } from '@/hooks/useThemeColors';

export function ProductCreditEditToggleButton() {
  const { openModal } = useProductModal();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  return (
    <button
      onClick={openModal}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Open product management"
      title="Products (⌘P)"
    >
      <CubeIcon
        className="h-5 w-5"
        style={{ color: primary.base }}
      />
    </button>
  );
}
```

**Deliverables**:
- ✅ Main modal component complete
- ✅ UnifiedMenu integration
- ✅ Toggle button created

---

### Phase 5: Polish & Testing (Day 3)

**5.1 Keyboard Shortcuts**

```typescript
// useProductKeyboardShortcuts.ts
export function useProductKeyboardShortcuts({
  isOpen,
  onClose,
  onCreateNew,
  selectedProduct,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreateNew: () => void;
  selectedProduct: Product | null;
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape' && !selectedProduct) {
        onClose();
      }

      // Cmd/Ctrl + N to create new
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        onCreateNew();
      }

      // Cmd/Ctrl + S to save (handled in form)
      // Cmd/Ctrl + F to focus search (handled in search bar)
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onCreateNew, selectedProduct]);
}
```

**5.2 Real-time Subscription**

```typescript
// useRealtimeSubscription.ts
export function useRealtimeSubscription({
  isOpen,
  organizationId,
  onProductChange,
}: {
  isOpen: boolean;
  organizationId: string;
  onProductChange: () => void;
}) {
  useEffect(() => {
    if (!isOpen) return;

    const channel = supabase
      .channel('product-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product',
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          onProductChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, organizationId, onProductChange]);
}
```

**5.3 Testing Checklist**

- [ ] Modal opens/closes correctly
- [ ] Create product works (with Stripe sync)
- [ ] Update product works
- [ ] Delete product works (with confirmation)
- [ ] Search filters products
- [ ] Tab filtering (all/active/archived)
- [ ] Tax code autocomplete works
- [ ] Image URL validation works
- [ ] JSON attributes validation works
- [ ] Real-time updates work
- [ ] Keyboard shortcuts work
- [ ] Mobile responsive
- [ ] Desktop drag/resize works
- [ ] Accessibility (screen reader, keyboard nav)
- [ ] Toast notifications work
- [ ] Loading states display correctly
- [ ] Empty states display correctly
- [ ] Error states display correctly

**Deliverables**:
- ✅ Keyboard shortcuts implemented
- ✅ Real-time updates working
- ✅ All tests passing
- ✅ Accessibility verified

---

## 🎨 Design Specifications

### Visual Identity

**Glass Morphism** (matching TicketsAdminModal):
```css
.modal-container {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(32px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border-radius: 1rem;
}

.modal-container-dark {
  background: rgba(17, 24, 39, 0.5);
  border: 1px solid rgba(75, 85, 99, 0.2);
}
```

**Product Card Design**:
```
┌─────────────────────────────────┐
│ [Image Preview]                 │
│                                 │
│ Product Name                    │
│ Brief description...            │
│                                 │
│ [Active Badge] [Tax Code]       │
│                                 │
│ [Edit] [Delete]                 │
└─────────────────────────────────┘
```

**Responsive Behavior**:
- **Mobile**: Fullscreen modal, single column product grid
- **Tablet**: 2-column product grid
- **Desktop**: 3-column product grid, draggable modal

---

## 📊 Success Metrics

### Code Quality
- ✅ 100% TypeScript coverage
- ✅ Separation of concerns (25+ files)
- ✅ Zero ESLint errors
- ✅ Consistent with TicketsAdminModal patterns

### Performance
- ✅ <100ms modal open time
- ✅ 60fps animations
- ✅ Debounced search (300ms)
- ✅ Lazy loading for tax codes

### Accessibility
- ✅ WCAG 2.1 AA compliance
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Focus management

### User Experience
- ✅ Consistent glass morphism design
- ✅ Smooth animations
- ✅ Clear loading/error states
- ✅ Real-time updates

---

## 🔄 Migration Path

### Before (Current State)
```typescript
// Route: /admin/products/management
// 821 lines in single file
// Side panel modal
// No separation of concerns
```

### After (New State)
```typescript
// Modal: ProductCreditEditModal
// Accessible via UnifiedMenu (⌘P)
// 25+ files (hooks, components, utils)
// Glass morphism design
// Real-time updates
```

**Transition Plan**:
1. Build new modal (Phase 1-5)
2. Test thoroughly
3. Update UnifiedMenu
4. Update Product button click handler
5. Mark old page as deprecated
6. Remove old page after 1 sprint

---

## ⚠️ Risk Mitigation

### Identified Risks

1. **Stripe Integration Breaking**
   - Risk: High
   - Mitigation: Use existing API endpoints, no changes to Stripe logic
   - Test: Create/update/delete products and verify Stripe sync

2. **Tax Code Performance**
   - Risk: Medium (18,000 tax codes)
   - Mitigation: Debounced search, limit results to 50
   - Test: Search performance with large dataset

3. **Real-time Updates**
   - Risk: Medium
   - Mitigation: Follow TicketsAdminModal patterns
   - Test: Multiple users editing products simultaneously

4. **Mobile UX**
   - Risk: Low
   - Mitigation: Fullscreen modal, responsive grid
   - Test: Test on various mobile devices

---

## 📅 Timeline

| Day | Phase | Focus | Hours |
|-----|-------|-------|-------|
| 1 AM | Phase 1 | Types, Context, Utils | 3h |
| 1 PM | Phase 2 | Core Hooks | 4h |
| 2 AM | Phase 3 | UI Components | 4h |
| 2 PM | Phase 4 | Integration | 3h |
| 3 | Phase 5 | Polish & Testing | 6h |

**Total**: ~20 hours (2.5 days)

---

## 🚀 Next Steps

### Immediate Actions

1. **Review & Approve Plan**
   - [ ] Architecture approval
   - [ ] Timeline confirmation
   - [ ] Design review

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/product-credit-edit-modal
   ```

3. **Start Phase 1**
   - [ ] Create directory structure
   - [ ] Create types.ts
   - [ ] Create context.tsx
   - [ ] Create validation utils

---

## 📚 References

### Design Inspiration
- **TicketsAdminModal**: `/src/components/modals/TicketsModals/TicketsAdminModal/`
- **MeetingsAdminModal**: `/src/components/modals/MeetingsModals/MeetingsAdminModal/`

### Existing Code
- **Product Page**: `/src/app/[locale]/admin/products/management/page.tsx`
- **Product API**: `/src/app/api/products/route.ts`
- **Tax Codes**: `/src/components/tax_codes.json`

### Technical Resources
- React-rnd: https://github.com/bokuweb/react-rnd
- Supabase Real-time: https://supabase.com/docs/guides/realtime
- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/

---

## 📝 Appendix

### A. Component Dependencies

```
ProductCreditEditModal
├── useSettings (context)
├── useThemeColors (hook)
├── ModalContainer
│   └── Rnd (react-rnd)
├── ModalHeader
├── ProductList
│   └── ProductListItem[]
├── ProductDetailView
│   └── ProductFormFields
│       ├── TaxCodeSelector
│       └── ImagePreview
├── ProductSearchBar
├── ProductFilterBar
├── ConfirmationDialog
└── LiveRegion
```

### B. API Contract

**GET /api/products/list**
- Returns: `Product[]`
- Filters by: `organization_id`

**POST /api/products**
- Body: `ProductFormData`
- Creates: Product in Supabase + Stripe
- Returns: Success message

**PUT /api/products**
- Body: `{ productId, updates: ProductFormData }`
- Updates: Product in Supabase + Stripe
- Returns: Success message

**DELETE /api/products**
- Body: `{ productId }`
- Deletes: Product from Supabase + Stripe
- Returns: Success message

---

**Document Status**: ✅ Ready for Approval

**Next Action**: Get stakeholder approval to begin implementation

**Estimated Completion**: 2-3 days (20 hours)

**Maintained By**: Development Team

**Created**: November 15, 2025
