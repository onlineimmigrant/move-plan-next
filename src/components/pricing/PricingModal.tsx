/*
 * Advanced Product Pricing Linking System
 * 
 * This PricingModal component now supports advanced URL-based product linking:
 * 
 * URL Formats:
 * - /#pricing                    -> Opens modal with first available product
 * - /#pricing#product_name       -> Opens modal with specific product (by name)
 * - /#pricing#product_id         -> Opens modal with specific product (by ID)
 * - /#pricing#product_slug       -> Opens modal with specific product (by slug)
 * 
 * Examples:
 * - /#pricing#basic_plan         -> Selects product with name "Basic Plan"
 * - /#pricing#123                -> Selects product with ID 123
 * - /#pricing#premium_package    -> Selects product with name "Premium Package"
 * 
 * Product Name Conversion:
 * Product names are converted to URL-safe identifiers by:
 * 1. Converting to lowercase
 * 2. Replacing non-alphanumeric characters with underscores
 * 3. Removing duplicate underscores
 * 4. Trimming underscores from start/end
 * 
 * Fallback Logic:
 * 1. Try to match by converted product name
 * 2. Try to match by product ID
 * 3. Try to match by product slug
 * 4. Fall back to first product if no matches found
 */

"use client";

import React, { useEffect, useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useSettings } from '@/context/SettingsContext';
import { getTranslatedMenuContent, getLocaleFromPathname } from '@/utils/menuTranslations';
import { useThemeColors } from '@/hooks/useThemeColors';
import PricingModalProductBadges from '@/components/PricingModalProductBadges';
import { PricingComparisonProduct } from '@/types/product';
import PricingCard from '@/components/pricing/PricingCard';
// Lazy load comparison table - only loads when user scrolls down
const PricingComparisonTable = lazy(() => import('@/components/pricing/PricingComparisonTable'));
import { 
  generateProductPricingUrl, 
  generateBasicPricingUrl,
  parseProductFromHash,
  updatePricingHash,
  removePricingHash,
  getCurrencySymbol,
  productNameToIdentifier
} from '@/utils/pricingUtils';
import { PRICING_CONSTANTS } from '@/utils/pricingConstants';
import { usePricingTranslations } from './usePricingTranslations';
import { useCurrencyDetection } from './useCurrencyDetection';
import { usePricingPlans, usePlanFeatures } from './usePricingData';
import { transformPricingPlans } from './transformPricingPlans';
import type { PricingModalProps, PricingComparison } from './types';
import { PRICING_GRID_CLASSES, PRICING_MODAL_STYLES, TOGGLE_STYLES, PRODUCT_TAB_STYLES, DISCOUNT_BADGE_STYLES, TEXT_STYLES } from './pricingModalStyles';
import { ANIMATION_CLASSES, ANIMATION_TIMING, getCardAnimationDelay } from './animations';
import { PricingErrorBoundary } from './PricingErrorBoundary';
import { announceToScreenReader, MODAL_ARIA_ATTRS, getToggleLabel } from './accessibilityUtils';
import { measureTimeToInteractive } from './performanceUtils';

// Re-export utility functions for external use
export { generateProductPricingUrl, generateBasicPricingUrl };

/**
 * Full-screen pricing modal component that displays pricing plans with product selection,
 * currency detection, and feature comparison. Supports URL-based product linking.
 * 
 * @param {PricingModalProps} props - Component props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {PricingComparison} [props.pricingComparison] - Optional pricing comparison data for translations
 * 
 * @example
 * <PricingModal 
 *   isOpen={showPricing} 
 *   onClose={() => setShowPricing(false)}
 *   pricingComparison={comparisonData}
 * />
 */
export default function PricingModal({ isOpen, onClose, pricingComparison }: PricingModalProps) {
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PricingComparisonProduct | null>(null);
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>(() => {
    // Load from localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pricing-expanded-features');
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    }
    return {};
  });
  const [initialProductIdentifier, setInitialProductIdentifier] = useState<string | null>(null);
  const [hoveredProductId, setHoveredProductId] = useState<number | null>(null);
  const modalRef = React.useRef<HTMLDivElement>(null);
  
  const translations = usePricingTranslations();
  const pathname = usePathname();
  const { settings } = useSettings();
  const themeColors = useThemeColors();
  
  // Get current locale for content translations
  const currentLocale = getLocaleFromPathname(pathname);

  // Fetch pricing plans
  const { pricingPlans, isLoadingPlans, error: plansError } = usePricingPlans(
    settings?.organization_id,
    selectedProduct?.id,
    'USD' // Will be updated by currency detection
  );
  
  // Detect user currency
  const { userCurrency, currencySymbol } = useCurrencyDetection(pricingPlans);
  
  // Fetch plan features
  const { planFeatures, isLoadingFeatures, error: featuresError } = usePlanFeatures(
    pricingPlans,
    settings?.organization_id
  );

  // Update URL hash when product changes
  const handleProductSelect = useCallback((product: PricingComparisonProduct) => {
    setSelectedProduct(product);
    updatePricingHash(product);
  }, []);

  const displayPlans = useMemo(() => 
    transformPricingPlans(pricingPlans, planFeatures, userCurrency, currencySymbol), 
    [pricingPlans, planFeatures, userCurrency, currencySymbol]
  );

  // Check if any plans are one-time payments to hide annual/monthly toggle
  const hasOneTimePlans = useMemo(() => pricingPlans.some(plan => plan.type === 'one_time'), [pricingPlans]);

  /**
   * Get translated title for pricing modal
   * Falls back to default English text if no comparison data provided
   */
  const getTranslatedTitle = useCallback(() => {
    if (!pricingComparison) return "Choose the plan that's right for you.";
    const localeToUse = currentLocale || 'en';
    return getTranslatedMenuContent(pricingComparison.name, pricingComparison.name_translation, localeToUse);
  }, [pricingComparison, currentLocale]);

  /**
   * Get translated description for pricing modal
   * Falls back to default English text if no comparison data provided
   */
  const getTranslatedDescription = useCallback(() => {
    if (!pricingComparison) return "Cancel or change plans anytime. No hidden fees, no surprises.";
    const localeToUse = currentLocale || 'en';
    return getTranslatedMenuContent(pricingComparison.description, pricingComparison.description_translation, localeToUse);
  }, [pricingComparison, currentLocale]);

  /**
   * Lock body scroll when modal is open to prevent background scrolling
   */
  useEffect(() => {
    if (isOpen) {
      // Store original overflow value
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore original overflow value
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  /**
   * Focus trap - keeps keyboard navigation within modal
   */
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  /**
   * Persist expanded features to localStorage
   */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pricing-expanded-features', JSON.stringify(expandedFeatures));
      } catch (error) {
        console.error('Failed to save expanded state:', error);
      }
    }
  }, [expandedFeatures]);

  /**
   * Handle modal open/close effects:
   * - Set up keyboard listeners (ESC to close)
   * - Parse initial product from URL hash
   * - Update URL hash if needed
   * - Measure time to interactive
   */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      measureTimeToInteractive('pricing-modal-open');
      document.addEventListener('keydown', handleEscape);
      
      // Capture the initial product identifier from URL hash when modal opens
      const productIdentifier = parseProductFromHash();
      setInitialProductIdentifier(productIdentifier);
      
      // Update URL hash when modal opens (if no specific product is targeted)
      const currentHash = window.location.hash;
      const hashParts = currentHash.split('#').filter(Boolean);
      
      if (hashParts.length === 0 || (hashParts.length === 1 && hashParts[0] !== 'pricing')) {
        // No hash or incorrect hash, set to #pricing
        window.history.replaceState(null, '', window.location.pathname + window.location.search + '#pricing');
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <PricingErrorBoundary>
      <div className={PRICING_MODAL_STYLES.container}>
        {/* Backdrop */}
        <div 
          className={PRICING_MODAL_STYLES.backdrop}
          onClick={() => {
            onClose();
            removePricingHash();
          }}
          aria-hidden="true"
        />
        
        {/* Modal - Full Screen */}
        <div className={PRICING_MODAL_STYLES.modal}>
          <div 
            ref={modalRef} 
            className={`${PRICING_MODAL_STYLES.content} ${ANIMATION_CLASSES.modalFadeIn} ${ANIMATION_TIMING.modalEntry}`}
            {...MODAL_ARIA_ATTRS}
          >
          
          {/* Header */}
          <div className={PRICING_MODAL_STYLES.header}>
            <button
              onClick={() => {
                onClose();
                removePricingHash();
              }}
              className={PRICING_MODAL_STYLES.closeButton}
              aria-label="Close pricing modal"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            
            <div className="text-center max-w-4xl mx-auto">
              <h2 id="pricing-modal-title" className={TEXT_STYLES.title}>
                {getTranslatedTitle()}
              </h2>
              <p id="pricing-modal-description" className={TEXT_STYLES.description}>
                {getTranslatedDescription()}
              </p>
              
              {/* Product Selection Badges */}
              <div className="mb-4 sm:mb-6">
                <PricingModalProductBadges
                  onProductSelect={handleProductSelect}
                  selectedProductId={selectedProduct?.id}
                  initialProductIdentifier={initialProductIdentifier}
                />
              </div>
              
              {/* Pricing Toggle - Only show for recurring plans */}
              {!hasOneTimePlans && (
                <div className="flex justify-center">
                  <div className={TOGGLE_STYLES.container}>
                    <button 
                      onClick={() => {
                        setIsAnnual(false);
                        announceToScreenReader('Switched to monthly billing');
                      }}
                      className={!isAnnual ? TOGGLE_STYLES.button.active : TOGGLE_STYLES.button.inactive}
                      aria-label={getToggleLabel(false)}
                      aria-pressed={!isAnnual}
                    >
                      {translations.monthly}
                    </button>
                    <button 
                      onClick={() => {
                        setIsAnnual(true);
                        announceToScreenReader('Switched to annual billing');
                      }}
                      className={isAnnual ? TOGGLE_STYLES.button.active : TOGGLE_STYLES.button.inactive}
                      aria-label={getToggleLabel(true)}
                      aria-pressed={isAnnual}
                    >
                      <span>{translations.annual}</span>
                      {(() => {
                        const firstPlan = displayPlans[0];
                        const discount = firstPlan?.annualSizeDiscount;
                        return discount && discount > 0 ? (
                          <span 
                            className={DISCOUNT_BADGE_STYLES.base}
                            style={{
                              background: isAnnual 
                                ? `linear-gradient(135deg, ${themeColors.cssVars.primary.base}, ${themeColors.cssVars.primary.hover})` 
                                : `${themeColors.cssVars.primary.base}15`,
                              color: isAnnual 
                                ? 'white' 
                                : themeColors.cssVars.primary.base,
                              fontWeight: '600',
                              boxShadow: isAnnual 
                                ? `0 2px 4px ${themeColors.cssVars.primary.base}30` 
                                : 'none',
                            }}
                          >
                            -{discount}%
                          </span>
                        ) : null;
                      })()}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className={PRICING_MODAL_STYLES.body}>
            


            {/* Pricing Cards - Smaller on Desktop */}
            <div className={PRICING_GRID_CLASSES.container}>
              {plansError ? (
                // Error state - failed to load plans
                <div className="col-span-full text-center py-12">
                  <div className="max-w-md mx-auto">
                    <div className="text-red-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className={TEXT_STYLES.errorTitle}>Failed to load pricing plans</h3>
                    <p className={TEXT_STYLES.errorDescription}>{plansError}</p>
                    <button 
                      onClick={() => window.location.reload()}
                      className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{ 
                        backgroundColor: themeColors.cssVars.primary.base,
                        color: 'white'
                      }}
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : isLoadingPlans ? (
                // Loading skeleton
                Array.from({ length: PRICING_GRID_CLASSES.skeletonCount }).map((_, index) => (
                  <div
                    key={index}
                    className="relative bg-white rounded-3xl border border-gray-200 shadow-sm p-8 animate-pulse"
                  >
                    <div className="text-center mb-8">
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-100 rounded mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded mb-8"></div>
                      <div className="h-12 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                ))
              ) : displayPlans.length === 0 ? (
                // Error state - no plans available
                <div className="col-span-full text-center py-12">
                  <div className="max-w-md mx-auto">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className={TEXT_STYLES.errorTitle}>No pricing plans available</h3>
                    <p className={TEXT_STYLES.errorDescription}>Please try again later or contact support if the problem persists.</p>
                  </div>
                </div>
              ) : (
                displayPlans.map((plan, index) => (
                  <div
                    key={plan.name}
                    className={`${ANIMATION_CLASSES.cardFadeIn} ${ANIMATION_TIMING.cardEntry} ${getCardAnimationDelay(index)}`}
                  >
                    <PricingCard
                      name={plan.name}
                    description={plan.description}
                    monthlyPrice={plan.monthlyPrice}
                    annualPrice={plan.annualPrice}
                    currencySymbol={plan.currencySymbol || currencySymbol}
                    annualCurrencySymbol={plan.annualCurrencySymbol}
                    isAnnual={isAnnual}
                    hasOneTimePlans={hasOneTimePlans}
                    annualSizeDiscount={plan.annualSizeDiscount || 0}
                    isPromotion={plan.isPromotion}
                    monthlyPromotionPrice={plan.monthlyPromotionPrice}
                    annualPromotionPrice={plan.annualPromotionPrice}
                    monthlyRecurringCount={plan.monthlyRecurringCount}
                    annualRecurringCount={plan.annualRecurringCount}
                    actualAnnualPrice={plan.actualAnnualPrice}
                    buttonText={plan.buttonText}
                    buttonVariant={plan.buttonVariant}
                    highlighted={plan.highlighted}
                    features={plan.features}
                    realFeatures={plan.realFeatures}
                    productSlug={plan.productSlug}
                    isExpanded={expandedFeatures[plan.name] || false}
                    onToggleExpanded={() => setExpandedFeatures(prev => ({
                      ...prev,
                      [plan.name]: !prev[plan.name]
                    }))}
                    translations={translations}
                    isLoadingFeatures={isLoadingFeatures}
                  />
                </div>
              ))
            )}
            </div>

            {/* Feature Comparison Table - Lazy loaded */}
            <Suspense fallback={
              <div className="max-w-6xl mx-auto mb-20 animate-pulse">
                <div className="h-12 bg-gray-200 rounded mb-8 max-w-md mx-auto"></div>
                <div className="h-64 bg-gray-100 rounded"></div>
              </div>
            }>
              <PricingComparisonTable
                plans={displayPlans}
                isAnnual={isAnnual}
                hasOneTimePlans={hasOneTimePlans}
                currencySymbol={currencySymbol}
                translations={{
                  features: translations.compareAllFeatures,
                  limitedTimeOffer: translations.limitedTimeOffer,
                }}
              />
            </Suspense>
          </div>
          </div>
        </div>
      </div>
    </PricingErrorBoundary>
  );
}
