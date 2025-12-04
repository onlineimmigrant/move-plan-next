'use client';

import Image from 'next/image';
import { HiMinus, HiPlus, HiTrash } from 'react-icons/hi';
import { useCallback, memo, useState, useEffect, useRef } from 'react';
import AssociatedFeaturesDisclosure from './AssociatedFeaturesDisclosure';
import { useProductTranslations } from './useProductTranslations';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useToast } from '@/hooks/useToast';

interface Feature {
  id: number;
  name: string;
  feature_image?: string;
  content: string;
  slug: string;
}

interface BasketItemProps {
  item: {
    plan: {
      id: number;
      product_name?: string;
      package?: string;
      measure?: string;
      currency: string;
      currency_symbol: string;
      price: number;
      promotion_price?: number;
      is_promotion?: boolean;
      links_to_image?: string;
      type?: string;
      recurring_interval?: string;
      recurring_interval_count?: number;
      annual_size_discount?: number;
      computed_price?: number;
    };
    quantity: number;
    billingCycle?: 'monthly' | 'annual';
  };
  updateQuantity: (planId: number, quantity: number) => void;
  removeFromBasket: (planId: number) => void;
  associatedFeatures?: Feature[];
}

const BasketItem = memo(function BasketItem({
  item,
  updateQuantity,
  removeFromBasket,
  associatedFeatures = [],
}: BasketItemProps) {
  const { t, getSafeTranslation } = useProductTranslations();
  const themeColors = useThemeColors();
  const { primary } = themeColors;
  const toast = useToast();
  const { plan, quantity, billingCycle } = item;
  const removedItemRef = useRef<{ planId: number; quantity: number } | null>(null);
  const { 
    product_name, 
    package: planPackage, 
    measure, 
    currency_symbol, 
    price, 
    promotion_price, 
    is_promotion, 
    links_to_image,
    recurring_interval 
  } = plan;

  // Optimistic UI state
  const [optimisticQuantity, setOptimisticQuantity] = useState(quantity);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Sync optimistic quantity with actual quantity
  useEffect(() => {
    setOptimisticQuantity(quantity);
  }, [quantity]);

  const computeUnit = () => {
    const baseUnit = typeof plan.computed_price === 'number' ? plan.computed_price : ((price ?? 0) / 100);
    const isRecurring = (plan.type || recurring_interval) ? true : false;
    if (billingCycle === 'annual' && isRecurring) {
      const commitmentMonths = (plan as any).commitment_months || 12;
      const discountRaw = plan.annual_size_discount;
      let multiplier = 1;
      if (typeof discountRaw === 'number') {
        if (discountRaw > 1) multiplier = (100 - discountRaw) / 100; else if (discountRaw > 0 && discountRaw <= 1) multiplier = discountRaw;
      }
      return baseUnit * commitmentMonths * multiplier;
    }
    // Monthly/recurring or one-time: prefer computed_price; else cents with promo
    if (typeof plan.computed_price === 'number') return plan.computed_price;
    const cents = (is_promotion && typeof promotion_price === 'number') ? promotion_price : price;
    return (cents || 0) / 100;
  };

  const unitPriceRaw = computeUnit();
  const finalPriceRaw = unitPriceRaw * optimisticQuantity;

  const currencyCode = plan.currency || 'GBP';
  const formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode, minimumFractionDigits: 2 });
  const finalPrice = finalPriceRaw; // keep raw numeric for calculations
  const formattedFinal = formatter.format(finalPrice);
  const formattedUnit = formatter.format(unitPriceRaw);

  const intervalLabel = (() => {
    if (billingCycle === 'annual' && (plan.type || recurring_interval)) {
      return getSafeTranslation('perYear', 'per year');
    }
    if (!recurring_interval) return null;
    const v = String(recurring_interval).toLowerCase();
    if (v === 'month' || v === 'monthly') return getSafeTranslation('perMonth', 'per month');
    if (v === 'week' || v === 'weekly') return getSafeTranslation('perWeek', 'per week');
    if (v === 'year' || v === 'annually' || v === 'annual') return getSafeTranslation('perYear', 'per year');
    if (v === 'day' || v === 'daily') return getSafeTranslation('perDay', 'per day');
    if (v === 'quarter' || v === 'quarterly') return getSafeTranslation('perQuarter', 'per quarter');
    // Fallback for custom intervals like "3 months"
    return getSafeTranslation('everyX', `every ${recurring_interval}`).replace('{interval}', String(recurring_interval));
  })();

  const debouncedUpdate = useCallback((newQuantity: number) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      updateQuantity(plan.id, newQuantity);
    }, 300);
  }, [plan.id, updateQuantity]);

  const handleIncrement = useCallback(() => {
    const newQuantity = optimisticQuantity + 1;
    setOptimisticQuantity(newQuantity);
    debouncedUpdate(newQuantity);
  }, [optimisticQuantity, debouncedUpdate]);

  const handleDecrement = useCallback(() => {
    const newQuantity = Math.max(0, optimisticQuantity - 1);
    setOptimisticQuantity(newQuantity);
    debouncedUpdate(newQuantity);
  }, [optimisticQuantity, debouncedUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleRemove = useCallback(() => {
    // Store item details for undo
    removedItemRef.current = { planId: plan.id, quantity: optimisticQuantity };
    
    // Remove from basket
    removeFromBasket(plan.id);
    
    // Show toast with undo action
    toast.success(
      `${product_name || planPackage || 'Item'} removed from basket`,
      5000,
      {
        label: 'Undo',
        onClick: () => {
          if (removedItemRef.current) {
            updateQuantity(removedItemRef.current.planId, removedItemRef.current.quantity);
            toast.info('Item restored to basket');
            removedItemRef.current = null;
          }
        }
      }
    );
  }, [plan.id, optimisticQuantity, product_name, planPackage, removeFromBasket, updateQuantity, toast]);

  return (
    <div className="flex flex-col md:grid md:grid-cols-12 md:gap-4 p-3 sm:p-4 backdrop-blur-sm rounded-xl transition-all duration-300 border border-gray-200/40 hover:border-gray-300/60 relative overflow-hidden group" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Enhanced Product Image */}
      <div className="relative z-10 flex-shrink-0 w-full sm:w-auto flex justify-center sm:block md:col-span-2">
        {links_to_image ? (
          <div className="relative w-28 h-28 sm:w-24 sm:h-24 bg-white rounded-lg overflow-hidden border border-gray-200">
            <Image
              src={links_to_image}
              alt={product_name || 'Product'}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 112px, 96px"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+"
            />
          </div>
        ) : (
          <div className="w-28 h-28 sm:w-24 sm:h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border border-gray-200">
            <span className="text-gray-500 text-xs text-center font-medium">{t.noImage}</span>
          </div>
        )}
      </div>

      {/* Item Details */}
      <div className="relative z-10 flex-1 min-w-0 w-full md:col-span-6 md:border-l md:border-white/40 dark:md:border-gray-700/40 md:pl-4 group-hover:md:border-white/70 dark:group-hover:md:border-gray-600/70 transition-colors">
        <div className="mb-2 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {product_name || t.product}
            </h3>
            {planPackage && (
              <p className={`text-sm text-${primary.text} font-medium truncate`}>{planPackage}</p>
            )}
            {measure && (
              <p className="text-xs text-gray-500 mt-1">{measure}</p>
            )}
          </div>
          <div className="flex items-center space-x-2 justify-center sm:justify-end">
            {quantity > 1 && (
              <span className="inline-block px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                {(finalPrice).toFixed(2)} {currency_symbol}
              </span>
            )}
          </div>
        </div>

        {/* Mobile: Two-column layout for quantity and price */}
        <div className="md:hidden grid grid-cols-2 gap-3 mt-3 mb-16">
          {/* Left column: Quantity controls and Associated Features */}
          <div className="space-y-3">
            <div className="flex flex-col items-start space-y-1">
              <span className="text-xs text-gray-600 font-medium">{t.quantity}:</span>
              <div className="flex items-center space-x-0 bg-white rounded-md border border-gray-200 w-full" role="group" aria-label={t.quantity}>
                <button
                  onClick={handleDecrement}
                  className="p-1.5 hover:bg-gray-50 transition-colors duration-200 rounded-l-md border-r border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 flex-1"
                  aria-label={`${t.decreaseQuantity} for ${product_name}`}
                  disabled={optimisticQuantity <= 1}
                  tabIndex={0}
                >
                  <HiMinus className="w-3.5 h-3.5 text-gray-600 mx-auto" />
                </button>
                <span 
                  className="px-1.5 py-1.5 text-xs font-bold text-gray-900 text-center bg-gray-50 flex-1"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {optimisticQuantity}
                </span>
                <button
                  onClick={handleIncrement}
                  className="p-1.5 hover:bg-gray-50 transition-colors duration-200 rounded-r-md border-l border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 flex-1"
                  aria-label={`${t.increaseQuantity} for ${product_name}`}
                  tabIndex={0}
                >
                  <HiPlus className="w-3.5 h-3.5 text-gray-600 mx-auto" />
                </button>
              </div>
            </div>
            
            {/* Associated Features - Mobile */}
            {associatedFeatures.length > 0 && (
              <div className="w-full">
                <AssociatedFeaturesDisclosure associatedFeatures={associatedFeatures} />
              </div>
            )}
          </div>

          {/* Right column: Price */}
          <div className="text-right flex flex-col justify-start" aria-live="polite" aria-atomic="true">
            {is_promotion && promotion_price ? (
              <div>
                <p className="text-base font-bold text-gray-900">
                  {formattedFinal}
                </p>
                <p className="text-xs text-gray-500 line-through">
                  {formatter.format(price * quantity / 100)}
                </p>
                {intervalLabel && (
                  <p className="text-[11px] text-gray-600 mt-0.5">{intervalLabel}</p>
                )}
              </div>
            ) : (
              <p className="text-base font-bold text-gray-900">
                {formattedFinal}
              </p>
            )}
            {quantity > 1 && (
              <p className="text-[10px] text-gray-500 mt-1">
                {formattedUnit} {t.each}
              </p>
            )}
            {!is_promotion && intervalLabel && (
              <p className="text-[11px] text-gray-600 mt-0.5">{intervalLabel}</p>
            )}
          </div>
        </div>

        {/* Desktop: Quantity Controls */}
        <div className="hidden md:flex flex-col sm:flex-row items-center sm:items-start space-y-1 sm:space-y-0 sm:space-x-2 mb-3">
          <span className="text-xs text-gray-600 font-medium">{t.quantity}:</span>
          <div className="flex items-center space-x-0 bg-white rounded-md border border-gray-200" role="group" aria-label={t.quantity}>
            <button
              onClick={handleDecrement}
              className="p-1.5 hover:bg-gray-50 transition-colors duration-200 rounded-l-md border-r border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400"
              aria-label={`${t.decreaseQuantity} for ${product_name}`}
              disabled={optimisticQuantity <= 1}
              tabIndex={0}
            >
              <HiMinus className="w-3.5 h-3.5 text-gray-600" />
            </button>
            <span 
              className="px-2.5 py-1.5 text-xs font-bold text-gray-900 min-w-[2rem] text-center bg-gray-50"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {optimisticQuantity}
            </span>
            <button
              onClick={handleIncrement}
              className="p-1.5 hover:bg-gray-50 transition-colors duration-200 rounded-r-md border-l border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400"
              aria-label={`${t.increaseQuantity} for ${product_name}`}
              tabIndex={0}
            >
              <HiPlus className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Price (Desktop only) */}
      <div className="relative z-10 hidden md:flex text-right flex-shrink-0 md:col-span-4 flex-col items-end justify-between md:border-l md:border-white/40 dark:md:border-gray-700/40 md:pl-4 group-hover:md:border-white/70 dark:group-hover:md:border-gray-600/70 transition-colors">
        <div className="mb-3">
          {is_promotion && promotion_price ? (
            <div>
              <p className="text-lg font-bold text-gray-900" aria-live="polite" aria-atomic="true">
                {formattedFinal}
              </p>
              <p className="text-sm text-gray-500 line-through">
                {formatter.format(price * quantity / 100)}
              </p>
              {intervalLabel && (
                <p className="text-xs text-gray-600 mt-0.5">{intervalLabel}</p>
              )}
            </div>
          ) : (
            <p className="text-lg font-bold text-gray-900" aria-live="polite" aria-atomic="true">
              {formattedFinal}
            </p>
          )}
          {quantity > 1 && (
            <p className="text-xs text-gray-500">
              {formattedUnit} {t.each}
            </p>
          )}
          {!is_promotion && intervalLabel && (
            <p className="text-xs text-gray-600 mt-0.5">{intervalLabel}</p>
          )}
        </div>
        
        {/* Associated Features - Desktop only */}
        {associatedFeatures.length > 0 && (
          <div className="mt-3">
            <AssociatedFeaturesDisclosure associatedFeatures={associatedFeatures} />
          </div>
        )}
      </div>
      
      {/* Delete button - Bottom left on mobile, inline on desktop */}
      <button
        onClick={handleRemove}
        className="z-20 absolute left-3 bottom-3 md:relative md:left-0 md:bottom-0 p-1 text-red-500 hover:text-red-700 transition-colors duration-200 focus:outline-none md:col-span-1 md:self-start"
        aria-label={`${t.remove} ${product_name || planPackage || t.product} from basket`}
        tabIndex={0}
      >
        <HiTrash className="w-5 h-5" />
      </button>
    </div>
  );
});

export default BasketItem;