/**
 * ShopModal - Main Component
 * 
 * Modern shop management modal with glass morphism design
 * Manages Products, Pricing Plans, Features, Customers, Orders
 * 
 * Features:
 * - CRUD operations for products, pricing plans, features
 * - Tax code autocomplete
 * - Image validation
 * - Real-time updates
 * - Responsive design (mobile fullscreen, desktop draggable)
 * - Accessibility compliant
 */

'use client';

import React, { useState, useCallback, useRef, lazy, Suspense, useTransition } from 'react';
import { Plus, Archive, CreditCard } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import ImageGalleryModal from '@/components/modals/ImageGalleryModal';
import type { UnsplashAttribution } from '@/components/modals/ImageGalleryModal/UnsplashImageSearch';
import type { PexelsAttributionData } from '@/components/MediaAttribution';
import { ProductMediaCarouselHandle } from '@/components/ProductMediaCarousel';
import {
  ModalContainer,
  ModalHeader,
  MainTabNavigation,
  LoadingState,
  EmptyState,
  ErrorState,
  LiveRegion,
  ProductTable,
  ProductListToolbar,
  ProductDetailView,
  ConfirmationDialog,
} from './components';

// Lazy load heavy tab components
const FeaturesView = lazy(() => import('./components/FeaturesView'));
const InventoryView = lazy(() => import('./components/InventoryView'));
const PricingPlansView = lazy(() => import('./components/PricingPlansView'));
const CustomersView = lazy(() => import('./components/CustomersView'));
const OrdersView = lazy(() => import('./components/OrdersView'));
const StripeView = lazy(() => import('./components/StripeView'));
import {
  useProductData,
  useProductOperations,
  useProductFilters,
  useDebounce,
  useTabDataFetching,
  usePricingPlans,
  useFeatures,
  useInventory,
  usePricingPlansManagement,
} from './hooks';
import { Product, ProductFormData, ProductFilters, Toast } from './types';
import { DEFAULT_FORM_DATA } from './utils';
import { useShopModal } from './context';

// Import MainTab type
import type { MainTab } from './components/MainTabNavigation';

/**
 * Main Shop Management Modal
 * 
 * Integrated with ShopModalProvider context for global state management
 */
export default function ShopModal() {
  const { isOpen, closeModal } = useShopModal();
  const { settings } = useSettings();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  // Main tab state
  const [mainTab, setMainTab] = useState<MainTab>('products');
  const [isPending, startTransition] = useTransition();
  
  // View state ('list' or 'form')
  const [view, setView] = useState<'list' | 'form'>('list');
  
  // Image Gallery Modal state
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [isMediaGalleryOpen, setIsMediaGalleryOpen] = useState(false);
  
  // Ref for product media carousel
  const carouselRef = useRef<ProductMediaCarouselHandle>(null);
  
  // State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(DEFAULT_FORM_DATA);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState<ProductFilters>({
    searchQuery: '',
    activeTab: 'all',
    sortBy: 'updated',
  });
  const [toast, setToast] = useState<Toast | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    productId: number | null;
    productName: string | null;
  }>({ isOpen: false, productId: null, productName: null });

  // Toast helper
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
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

  const pricingPlansData = usePricingPlans({
    organizationId: settings.organization_id,
  });

  const pricingPlansManagementData = usePricingPlansManagement({
    organizationId: settings.organization_id,
    onToast: showToast,
  });

  const featuresData = useFeatures({
    organizationId: settings.organization_id,
    onToast: showToast,
  });

  const inventoryData = useInventory({
    organizationId: settings.organization_id,
    onToast: showToast,
  });

  const debouncedSearchQuery = useDebounce(filters.searchQuery, 300);

  const { filteredProducts } = useProductFilters({
    products: productData.products,
    filters: { ...filters, searchQuery: debouncedSearchQuery },
  });

  // Tab-based data fetching for better performance
  useTabDataFetching({
    isOpen,
    activeTab: mainTab,
    onFetchProductsData: async () => {
      await productData.fetchProducts();
    },
    onFetchPricingPlansData: async () => {
      await productData.fetchProducts(); // Need products for dropdown
      await pricingPlansManagementData.fetchPricingPlans();
    },
    onFetchFeaturesData: async () => {
      await pricingPlansData.fetchPricingPlans();
      await featuresData.fetchFeatures();
      await featuresData.fetchPricingPlanFeatures();
    },
    onFetchInventoryData: async () => {
      await pricingPlansData.fetchPricingPlans();
      await inventoryData.fetchInventories();
    },
  });

  // Handlers
  const handleCreateNew = useCallback(() => {
    setSelectedProduct(null);
    setFormData(DEFAULT_FORM_DATA);
    setValidationErrors({});
    setView('form');
    setAnnouncement('Create new product form opened');
  }, []);

  const handleProductSelect = useCallback((product: Product) => {
    setSelectedProduct(product);
    setFormData({
      // Basic Info
      product_name: product.product_name,
      product_description: product.product_description || '',
      is_displayed: product.is_displayed,
      // Media
      links_to_image: product.links_to_image || '',
      links_to_video: product.links_to_video || '',
      // Book/Author
      author: product.author || '',
      author_2: product.author_2 || '',
      isbn: product.isbn || '',
      // SEO & Identifiers
      slug: product.slug || '',
      sku: product.sku || '',
      metadescription_for_page: product.metadescription_for_page || '',
      // Display
      background_color: product.background_color || '',
      order: product.order || 0,
      // Integration
      product_tax_code: product.product_tax_code || '',
      amazon_books_url: product.amazon_books_url || '',
      compare_link_url: product.compare_link_url || '',
      // Additional
      details: product.details || '',
      attributes: product.attrs ? JSON.stringify(product.attrs, null, 2) : '',
    });
    setValidationErrors({});
    setView('form');
    setAnnouncement(`Editing ${product.product_name}`);
  }, []);

  const handleFormDataChange = useCallback((field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    setValidationErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    // Validate
    const errors: Record<string, string> = {};
    if (!formData.product_name.trim()) {
      errors.product_name = 'Product name is required';
    }
    
    if (formData.attributes) {
      try {
        JSON.parse(formData.attributes);
      } catch (e) {
        errors.attributes = 'Invalid JSON format';
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Save
    if (selectedProduct) {
      await productOperations.handleUpdateProduct(selectedProduct.id, formData);
    } else {
      await productOperations.handleCreateProduct(formData);
    }
    
    // Return to list view
    setView('list');
    setSelectedProduct(null);
    setFormData(DEFAULT_FORM_DATA);
  }, [formData, selectedProduct, productOperations]);

  const handleCancel = useCallback(() => {
    setView('list');
    setSelectedProduct(null);
    setFormData(DEFAULT_FORM_DATA);
    setValidationErrors({});
    setAnnouncement('Cancelled product editing');
  }, []);

  const handleDeleteClick = useCallback((productId: number) => {
    const product = productData.products.find(p => p.id === productId);
    setDeleteConfirmation({
      isOpen: true,
      productId,
      productName: product?.product_name || 'this product',
    });
  }, [productData.products]);

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteConfirmation.productId) {
      await productOperations.confirmDeleteProduct(deleteConfirmation.productId);
      setDeleteConfirmation({ isOpen: false, productId: null, productName: null });
      if (selectedProduct?.id === deleteConfirmation.productId) {
        setView('list');
        setSelectedProduct(null);
      }
    }
  }, [deleteConfirmation.productId, selectedProduct?.id, productOperations]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmation({ isOpen: false, productId: null, productName: null });
  }, []);

  // Image Gallery handlers
  const openImageGallery = useCallback(() => {
    setIsImageGalleryOpen(true);
  }, []);

  const closeImageGallery = useCallback(() => {
    setIsImageGalleryOpen(false);
  }, []);

  const handleImageSelect = useCallback((url: string, attribution?: UnsplashAttribution | PexelsAttributionData) => {
    setFormData(prev => {
      const newFormData = { ...prev, links_to_image: url };
      
      // If Unsplash attribution provided, store it in attrs
      if (attribution) {
        try {
          const currentAttrs = prev.attributes ? JSON.parse(prev.attributes) : {};
          const updatedAttrs = {
            ...currentAttrs,
            unsplash_attribution: attribution,
          };
          newFormData.attributes = JSON.stringify(updatedAttrs, null, 2);
        } catch (e) {
          console.error('Error updating attributes with Unsplash attribution:', e);
        }
      }
      
      return newFormData;
    });
    setIsImageGalleryOpen(false);
    setAnnouncement(attribution ? 'Unsplash image selected' : 'Product image updated');
  }, []);

  const openMediaGallery = useCallback(() => {
    console.log('🚀 openMediaGallery called in ProductCreditEditModal');
    setIsMediaGalleryOpen(true);
  }, []);

  const closeMediaGallery = useCallback(() => {
    console.log('🔒 closeMediaGallery called');
    setIsMediaGalleryOpen(false);
  }, []);

  const handleMediaSelect = useCallback(async (url: string, attribution?: UnsplashAttribution | PexelsAttributionData, isVideo?: boolean, videoData?: any) => {
    console.log('📸 handleMediaSelect called with:', { url, attribution, isVideo, videoData });
    if (carouselRef.current) {
      console.log('✅ carouselRef.current exists, calling addMediaItem');
      await carouselRef.current.addMediaItem(url, attribution, isVideo, videoData);
    } else {
      console.error('❌ carouselRef.current is null!');
    }
    closeMediaGallery();
  }, [closeMediaGallery]);

  // Simplified UI for initial testing
  return (
    <>
      <ModalContainer isOpen={isOpen} onClose={closeModal}>
        <ModalHeader
          title="Shop"
          productCount={productData.products.length}
          primaryColor={primary.base}
          onClose={closeModal}
          searchQuery={filters.searchQuery}
          onSearchChange={(query: string) => setFilters(prev => ({ ...prev, searchQuery: query }))}
        />

        {/* Main Tab Navigation */}
        <MainTabNavigation
          activeTab={mainTab}
          onTabChange={(tab) => startTransition(() => setMainTab(tab))}
        />

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {mainTab === 'products' ? (
            view === 'list' ? (
              <>
                {/* Product Table */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {productData.isLoading ? (
                    <LoadingState />
                  ) : productData.error ? (
                    <ErrorState
                      message={productData.error}
                      onRetry={productData.fetchProducts}
                    />
                  ) : (
                    <ProductTable
                      products={filteredProducts}
                      pricingPlansByProduct={pricingPlansData.pricingPlansByProduct}
                      onEdit={handleProductSelect}
                      onDelete={handleDeleteClick}
                    />
                  )}
                </div>

                {/* Fixed Footer with Toolbar */}
                {!productData.isLoading && !productData.error && (
                  <ProductListToolbar
                    products={productData.products}
                    activeTab={filters.activeTab}
                    onTabChange={(tab: 'all' | 'active' | 'archived') => setFilters(prev => ({ ...prev, activeTab: tab }))}
                    filteredCount={filteredProducts.length}
                    onAddProduct={handleCreateNew}
                  />
                )}
              </>
            ) : (
              /* Form View */
              <ProductDetailView
                formData={formData}
                selectedProduct={selectedProduct}
                isCreating={productOperations.isCreating}
                isUpdating={productOperations.isUpdating}
                validationErrors={validationErrors}
                onFormDataChange={handleFormDataChange}
                onSave={handleSave}
                onCancel={handleCancel}
                onImageUrlChange={(url) => handleFormDataChange('links_to_image', url)}
                onTaxCodeSelect={(code) => handleFormDataChange('product_tax_code', code || '')}
                onOpenImageGallery={openImageGallery}
                onOpenMediaGallery={openMediaGallery}
                carouselRef={carouselRef}
              />
            )
          ) : mainTab === 'pricing-plans' ? (
            /* Pricing Plans Tab */
            <Suspense fallback={<LoadingState message="Loading pricing plans..." />}>
              <PricingPlansView
                pricingPlans={pricingPlansManagementData.pricingPlans}
                products={productData.products}
                isLoading={pricingPlansManagementData.isLoading}
                searchQuery={filters.searchQuery}
                onCreatePlan={async (data) => {
                  await pricingPlansManagementData.createPricingPlan(data);
                }}
                onUpdatePlan={async (id, updates) => {
                  await pricingPlansManagementData.updatePricingPlan(id, updates);
                }}
                onDeletePlan={async (id) => {
                  await pricingPlansManagementData.deletePricingPlan(id);
                }}
                onReorderPlans={async (plans) => {
                  await pricingPlansManagementData.reorderPricingPlans(plans);
                }}
              />
            </Suspense>
          ) : mainTab === 'features' ? (
            /* Features Tab */
            <Suspense fallback={<LoadingState message="Loading features..." />}>
              <FeaturesView
                features={featuresData.features}
                pricingPlans={pricingPlansData.allPricingPlans}
                pricingPlanFeatures={featuresData.pricingPlanFeatures}
                isLoading={featuresData.isLoading}
                searchQuery={filters.searchQuery}
                onCreateFeature={async (data) => {
                  await featuresData.createFeature(data);
                }}
                onUpdateFeature={async (id, updates) => {
                  await featuresData.updateFeature(id, updates);
                }}
                onDeleteFeature={async (id) => {
                  await featuresData.deleteFeature(id);
                }}
                onAssignFeature={async (pricingplanId, featureId) => {
                  await featuresData.assignFeatureToPlan(pricingplanId, featureId);
                }}
                onRemoveFeature={async (pricingplanId, featureId) => {
                  await featuresData.removeFeatureFromPlan(pricingplanId, featureId);
                }}
              />
            </Suspense>
          ) : mainTab === 'inventory' ? (
            /* Inventory Tab */
            <Suspense fallback={<LoadingState message="Loading inventory..." />}>
              <InventoryView
                inventories={inventoryData.inventories}
                pricingPlans={pricingPlansData.allPricingPlans}
                isLoading={inventoryData.isLoading}
                searchQuery={filters.searchQuery}
                onCreateInventory={async (data) => {
                  await inventoryData.createInventory(data);
                }}
                onUpdateInventory={async (id, updates) => {
                  await inventoryData.updateInventory(id, updates);
                }}
                onDeleteInventory={async (id) => {
                  await inventoryData.deleteInventory(id);
                }}
              />
            </Suspense>
          ) : mainTab === 'customers' ? (
            /* Customers Tab */
            <Suspense fallback={<LoadingState message="Loading customers..." />}>
              <CustomersView searchQuery={filters.searchQuery} />
            </Suspense>
          ) : mainTab === 'orders' ? (
            /* Orders Tab */
            <Suspense fallback={<LoadingState message="Loading orders..." />}>
              <OrdersView />
            </Suspense>
          ) : mainTab === 'stripe' ? (
            /* Stripe Tab */
            <Suspense fallback={<LoadingState message="Loading Stripe configuration..." />}>
              <StripeView />
            </Suspense>
          ) : null}
        </div>
      </ModalContainer>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteConfirmation.productName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        isProcessing={productOperations.isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Image Gallery Modal - for main product image */}
      {isImageGalleryOpen && (
        <ImageGalleryModal
          isOpen={isImageGalleryOpen}
          onClose={closeImageGallery}
          onSelectImage={handleImageSelect}
        />
      )}

      {/* Media Gallery Modal - for additional product photos */}
      {isMediaGalleryOpen && (
        <ImageGalleryModal
          isOpen={isMediaGalleryOpen}
          onClose={closeMediaGallery}
          onSelectImage={handleMediaSelect}
          productId={selectedProduct?.id ? Number(selectedProduct.id) : undefined}
        />
      )}

      {/* Live Region for Screen Reader Announcements */}
      <LiveRegion message={announcement} />

      {/* Toast Notification */}
      {toast && (
        <div 
          className="fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-white"
          style={{
            backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
            zIndex: 10003,
          }}
        >
          {toast.message}
        </div>
      )}
    </>
  );
}
