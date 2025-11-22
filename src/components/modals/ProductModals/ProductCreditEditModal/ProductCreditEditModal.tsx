/**
 * ProductCreditEditModal - Main Component
 * 
 * Modern product management modal with glass morphism design
 * Follows TicketsAdminModal architecture patterns
 * 
 * Features:
 * - CRUD operations for products
 * - Tax code autocomplete
 * - Image validation
 * - Real-time updates
 * - Responsive design (mobile fullscreen, desktop draggable)
 * - Accessibility compliant
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
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
  FeaturesView,
} from './components';
import {
  useProductData,
  useProductOperations,
  useProductFilters,
  useDebounce,
  useModalDataFetching,
  usePricingPlans,
  useFeatures,
} from './hooks';
import { Product, ProductFormData, ProductFilters, Toast } from './types';
import { DEFAULT_FORM_DATA } from './utils';
import { useProductModal } from './context';

// Import MainTab type
import type { MainTab } from './components/MainTabNavigation';

/**
 * Main Product Management Modal
 * 
 * Integrated with ProductModalProvider context for global state management
 */
export default function ProductCreditEditModal() {
  const { isOpen, closeModal } = useProductModal();
  const { settings } = useSettings();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  // Main tab state
  const [mainTab, setMainTab] = useState<MainTab>('products');
  
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
    productId: string | null;
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

  const featuresData = useFeatures({
    organizationId: settings.organization_id,
    onToast: showToast,
  });

  const debouncedSearchQuery = useDebounce(filters.searchQuery, 300);

  const { filteredProducts } = useProductFilters({
    products: productData.products,
    filters: { ...filters, searchQuery: debouncedSearchQuery },
  });

  // Fetch products, pricing plans, and features on modal open
  useModalDataFetching({
    isOpen,
    onFetchData: async () => {
      await productData.fetchProducts();
      await pricingPlansData.fetchPricingPlans();
      await featuresData.fetchFeatures();
      await featuresData.fetchPricingPlanFeatures();
    },
  });

  // Handlers
  const handleCreateNew = () => {
    setSelectedProduct(null);
    setFormData(DEFAULT_FORM_DATA);
    setValidationErrors({});
    setView('form');
    setAnnouncement('Create new product form opened');
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      product_name: product.product_name,
      product_description: product.product_description || '',
      links_to_image: product.links_to_image || '',
      product_tax_code: product.product_tax_code || '',
      attributes: product.attrs ? JSON.stringify(product.attrs, null, 2) : '',
      is_displayed: product.is_displayed,
    });
    setValidationErrors({});
    setView('form');
    setAnnouncement(`Editing ${product.product_name}`);
  };

  const handleFormDataChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSave = async () => {
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
  };

  const handleCancel = () => {
    setView('list');
    setSelectedProduct(null);
    setFormData(DEFAULT_FORM_DATA);
    setValidationErrors({});
    setAnnouncement('Cancelled product editing');
  };

  const handleDeleteClick = (productId: string) => {
    const product = productData.products.find(p => p.id === productId);
    setDeleteConfirmation({
      isOpen: true,
      productId,
      productName: product?.product_name || 'this product',
    });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmation.productId) {
      await productOperations.confirmDeleteProduct(deleteConfirmation.productId);
      setDeleteConfirmation({ isOpen: false, productId: null, productName: null });
      if (selectedProduct?.id === deleteConfirmation.productId) {
        setView('list');
        setSelectedProduct(null);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation({ isOpen: false, productId: null, productName: null });
  };

  // Image Gallery handlers
  const openImageGallery = () => {
    setIsImageGalleryOpen(true);
  };

  const closeImageGallery = () => {
    setIsImageGalleryOpen(false);
  };

  const handleImageSelect = (url: string, attribution?: UnsplashAttribution | PexelsAttributionData) => {
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
  };

  const openMediaGallery = () => {
    console.log('🚀 openMediaGallery called in ProductCreditEditModal');
    setIsMediaGalleryOpen(true);
  };

  const closeMediaGallery = () => {
    console.log('🔒 closeMediaGallery called');
    setIsMediaGalleryOpen(false);
  };

  const handleMediaSelect = async (url: string, attribution?: UnsplashAttribution | PexelsAttributionData, isVideo?: boolean, videoData?: any) => {
    console.log('📸 handleMediaSelect called with:', { url, attribution, isVideo, videoData });
    if (carouselRef.current) {
      console.log('✅ carouselRef.current exists, calling addMediaItem');
      await carouselRef.current.addMediaItem(url, attribution, isVideo, videoData);
    } else {
      console.error('❌ carouselRef.current is null!');
    }
    closeMediaGallery();
  };

  // Simplified UI for initial testing
  return (
    <>
      <ModalContainer isOpen={isOpen} onClose={closeModal}>
        <ModalHeader
          title="Products & Services"
          subtitle={view === 'form' 
            ? (selectedProduct ? 'Edit' : 'Create')
            : 'Manage your products and pricing'
          }
          productCount={productData.products.length}
          primaryColor={primary.base}
          onClose={closeModal}
        />

        {/* Main Tab Navigation */}
        <MainTabNavigation
          activeTab={mainTab}
          onTabChange={setMainTab}
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
                      searchQuery={filters.searchQuery}
                      onSearchChange={(query: string) => setFilters(prev => ({ ...prev, searchQuery: query }))}
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
                  />
                )}

                {/* Floating Create Button */}
                {!productData.isLoading && !productData.error && (
                  <button
                    onClick={handleCreateNew}
                    className="fixed bottom-20 right-6 sm:bottom-24 sm:right-8 p-4 rounded-full shadow-lg hover:shadow-xl transition-shadow text-white flex items-center gap-2"
                    style={{ backgroundColor: primary.base, zIndex: 10002 }}
                    aria-label="Create new product"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
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
          ) : mainTab === 'features' ? (
            /* Features Tab */
            <FeaturesView
              features={featuresData.features}
              pricingPlans={Object.values(pricingPlansData.pricingPlansByProduct).flat()}
              pricingPlanFeatures={featuresData.pricingPlanFeatures}
              isLoading={featuresData.isLoading}
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
          ) : mainTab === 'inventory' ? (
            /* Inventory Tab - Coming Soon */
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <Archive className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Inventory Management</h3>
                <p className="text-sm text-gray-500">Coming soon...</p>
              </div>
            </div>
          ) : (
            /* Stripe Tab - Coming Soon */
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Stripe Integration</h3>
                <p className="text-sm text-gray-500">Coming soon...</p>
              </div>
            </div>
          )}
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
