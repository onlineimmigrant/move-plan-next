/**
 * useProductOperations Hook
 * 
 * Handles CRUD operations for products
 * Create, Update, Delete with Stripe synchronization
 */

import { useState, useCallback } from 'react';
import { Product, ProductFormData } from '../types';
import { API_ENDPOINTS, validateURL, validateJSON, sanitizeImageUrl } from '../utils';

interface UseProductOperationsProps {
  onToast: (message: string, type: 'success' | 'error') => void;
  onRefreshProducts: () => Promise<void>;
}

interface UseProductOperationsReturn {
  isSubmitting: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  showDeleteConfirmation: boolean;
  productToDelete: Product | null;
  setShowDeleteConfirmation: (show: boolean) => void;
  setProductToDelete: (product: Product | null) => void;
  handleCreateProduct: (formData: ProductFormData) => Promise<boolean>;
  handleUpdateProduct: (productId: number, formData: ProductFormData) => Promise<boolean>;
  confirmDeleteProduct: (productId: number) => Promise<void>;
}

/**
 * Hook for product CRUD operations
 * 
 * @param onToast - Callback for showing toast notifications
 * @param onRefreshProducts - Callback to refresh product list after operations
 * @returns Operation handlers and state
 * 
 * @example
 * ```tsx
 * const operations = useProductOperations({
 *   onToast: showToast,
 *   onRefreshProducts: fetchProducts,
 * });
 * 
 * // Create
 * await operations.handleCreateProduct(formData);
 * 
 * // Update
 * await operations.handleUpdateProduct(productId, formData);
 * 
 * // Delete
 * operations.setProductToDelete(product);
 * operations.setShowDeleteConfirmation(true);
 * await operations.confirmDeleteProduct();
 * ```
 */
export function useProductOperations({
  onToast,
  onRefreshProducts,
}: UseProductOperationsProps): UseProductOperationsReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  /**
   * Create a new product
   */
  const handleCreateProduct = useCallback(async (formData: ProductFormData): Promise<boolean> => {
    setIsSubmitting(true);
    setIsCreating(true);
    
    try {
      // Validate form data
      if (!formData.product_name.trim()) {
        throw new Error('Product name is required');
      }

      if (formData.links_to_image && !validateURL(formData.links_to_image)) {
        throw new Error('Invalid image URL');
      }

      let attrs: Record<string, any> | undefined;
      if (formData.attributes.trim()) {
        if (!validateJSON(formData.attributes)) {
          throw new Error('Invalid JSON in attributes field');
        }
        attrs = JSON.parse(formData.attributes);
      }

      // Prepare payload
      const payload = {
        product_name: formData.product_name.trim(),
        is_displayed: formData.is_displayed,
        product_description: formData.product_description.trim() || undefined,
        links_to_image: sanitizeImageUrl(formData.links_to_image) || undefined,
        attrs: attrs,
        product_tax_code: formData.product_tax_code?.trim() ? formData.product_tax_code.trim() : undefined,
        // Media
        links_to_video: formData.links_to_video?.trim() || undefined,
        // Book/Author
        author: formData.author?.trim() || undefined,
        author_2: formData.author_2?.trim() || undefined,
        isbn: formData.isbn?.trim() || undefined,
        // SEO & Identifiers
        slug: formData.slug?.trim() || undefined,
        sku: formData.sku?.trim() || undefined,
        metadescription_for_page: formData.metadescription_for_page?.trim() || undefined,
        // Display
        background_color: formData.background_color?.trim() || undefined,
        order: formData.order,
        // External Links
        amazon_books_url: formData.amazon_books_url?.trim() || undefined,
        compare_link_url: formData.compare_link_url?.trim() || undefined,
        // Additional
        details: formData.details?.trim() || undefined,
      };

      const response = await fetch(API_ENDPOINTS.MANAGE_PRODUCTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create product');
      }

      onToast('Product created successfully', 'success');
      await onRefreshProducts();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create product';
      onToast(message, 'error');
      console.error('Error creating product:', error);
      return false;
    } finally {
      setIsSubmitting(false);
      setIsCreating(false);
    }
  }, [onToast, onRefreshProducts]);

  /**
   * Update an existing product
   */
  const handleUpdateProduct = useCallback(async (
    productId: number,
    formData: ProductFormData
  ): Promise<boolean> => {
    setIsSubmitting(true);
    setIsUpdating(true);
    
    try {
      // Validate form data
      if (!formData.product_name.trim()) {
        throw new Error('Product name is required');
      }

      if (formData.links_to_image && !validateURL(formData.links_to_image)) {
        throw new Error('Invalid image URL');
      }

      let attrs: Record<string, any> | undefined;
      if (formData.attributes.trim()) {
        if (!validateJSON(formData.attributes)) {
          throw new Error('Invalid JSON in attributes field');
        }
        attrs = JSON.parse(formData.attributes);
      }

      // Prepare payload
      const updates = {
        product_name: formData.product_name.trim(),
        is_displayed: formData.is_displayed,
        product_description: formData.product_description.trim() || undefined,
        links_to_image: sanitizeImageUrl(formData.links_to_image) || undefined,
        attrs: attrs,
        product_tax_code: formData.product_tax_code?.trim() ? formData.product_tax_code.trim() : undefined,
        // Media
        links_to_video: formData.links_to_video?.trim() || undefined,
        // Book/Author
        author: formData.author?.trim() || undefined,
        author_2: formData.author_2?.trim() || undefined,
        isbn: formData.isbn?.trim() || undefined,
        // SEO & Identifiers
        slug: formData.slug?.trim() || undefined,
        sku: formData.sku?.trim() || undefined,
        metadescription_for_page: formData.metadescription_for_page?.trim() || undefined,
        // Display
        background_color: formData.background_color?.trim() || undefined,
        order: formData.order,
        // External Links
        amazon_books_url: formData.amazon_books_url?.trim() || undefined,
        compare_link_url: formData.compare_link_url?.trim() || undefined,
        // Additional
        details: formData.details?.trim() || undefined,
      };

      const response = await fetch(API_ENDPOINTS.MANAGE_PRODUCTS, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: String(productId), updates }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update product');
      }

      onToast('Product updated successfully', 'success');
      await onRefreshProducts();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update product';
      onToast(message, 'error');
      console.error('Error updating product:', error);
      return false;
    } finally {
      setIsSubmitting(false);
      setIsUpdating(false);
    }
  }, [onToast, onRefreshProducts]);

  /**
   * Delete a product (with confirmation)
   */
  const confirmDeleteProduct = useCallback(async (productId: number) => {
    setIsDeleting(true);
    
    try {
      const response = await fetch(API_ENDPOINTS.MANAGE_PRODUCTS, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: String(productId) }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete product');
      }

      onToast('Product deleted successfully', 'success');
      await onRefreshProducts();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete product';
      onToast(message, 'error');
      console.error('Error deleting product:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [onToast, onRefreshProducts]);

  return {
    isSubmitting,
    isCreating,
    isUpdating,
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
