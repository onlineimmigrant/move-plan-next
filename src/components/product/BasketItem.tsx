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
    <div className="flex flex-col md:grid md:grid-cols-12 md:gap-4 p-3 sm:p-4 backdrop-blur-lg bg-gradient-to-r from-white/60 to-white/40 dark:from-gray-800/60 dark:to-gray-700/40 rounded-xl hover:from-white/80 hover:to-white/60 dark:hover:from-gray-800/80 dark:hover:to-gray-700/60 transition-all duration-300 border border-white/60 dark:border-gray-700/60 hover:border-white/80 dark:hover:border-gray-600/80 shadow-sm hover:shadow-md relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative z-10 md:contents flex flex-col space-y-2 sm:space-y-0 w-full">
      {/* Enhanced Product Image */}
      <div className="flex-shrink-0 w-full sm:w-auto flex justify-center sm:block md:col-span-2">
        {links_to_image ? (
          <div className="relative w-20 h-20 sm:w-16 sm:h-16 bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
            <Image
              src={links_to_image}
              alt={product_name || 'Product'}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 96px, 80px"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+"
            />
          </div>
        ) : (
          <div className="w-20 h-20 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
            <span className="text-gray-500 text-xs text-center font-medium">{t.noImage}</span>
          </div>
        )}
      </div>

      {/* Item Details */}
      <div className="flex-1 min-w-0 w-full md:col-span-6 md:border-l md:border-white/40 dark:md:border-gray-700/40 md:pl-4 group-hover:md:border-white/70 dark:group-hover:md:border-gray-600/70 transition-colors">
        <div className="mb-2 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {product_name || t.product}
            </h3>
            {planPackage && (
              <p className={`text-sm text-${primary.text} font-medium`}>{planPackage}</p>
            )}
            {measure && (
              <p className="text-xs text-gray-500 mt-1">{measure}</p>
            )}
            {recurring_interval && (
              <p className="text-xs text-gray-500 mt-1">{getSafeTranslation('billed', 'Billed')} {intervalLabel || String(recurring_interval)}</p>
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

        {/* Enhanced Quantity Controls */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-1.5 sm:space-y-0 sm:space-x-2 mb-3">
          <span className="text-sm text-gray-600 font-medium">{t.quantity}:</span>
          <div className="flex items-center space-x-0 bg-white rounded-lg border border-gray-200" role="group" aria-label={t.quantity}>
            <button
              onClick={handleDecrement}
              className="p-2 hover:bg-gray-50 transition-colors duration-200 rounded-l-lg border-r border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400"
              aria-label={`${t.decreaseQuantity} for ${product_name}`}
              disabled={optimisticQuantity <= 1}
              tabIndex={0}
            >
              <HiMinus className="w-4 h-4 text-gray-600" />
            </button>
            <span 
              className="px-3 py-2 text-sm font-bold text-gray-900 min-w-[2.5rem] text-center bg-gray-50"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {optimisticQuantity}
            </span>
            <button
              onClick={handleIncrement}
              className="p-2 hover:bg-gray-50 transition-colors duration-200 rounded-r-lg border-l border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400"
              aria-label={`${t.increaseQuantity} for ${product_name}`}
              tabIndex={0}
            >
              <HiPlus className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Associated Features */}
        {associatedFeatures.length > 0 && (
          <div className="mt-3">
            <AssociatedFeaturesDisclosure associatedFeatures={associatedFeatures} />
          </div>
        )}
      </div>

      {/* Price (hidden on mobile, shown on md+) */}
      <div className="hidden md:flex text-right flex-shrink-0 md:col-span-4 flex-col items-end justify-between md:border-l md:border-white/40 dark:md:border-gray-700/40 md:pl-4 group-hover:md:border-white/70 dark:group-hover:md:border-gray-600/70 transition-colors">
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
        
      </div>
      </div>
      {/* Mobile price bottom-right */}
      <div className="md:hidden absolute right-3 bottom-3 text-right" aria-live="polite" aria-atomic="true">
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
          <p className="text-[10px] text-gray-500">
            {formattedUnit} {t.each}
          </p>
        )}
        {!is_promotion && intervalLabel && (
          <p className="text-[11px] text-gray-600 mt-0.5">{intervalLabel}</p>
        )}
      </div>
      {/* Icon-only remove button bottom-left */}
      <button
        onClick={handleRemove}
        className="absolute left-3 bottom-3 p-2 rounded-lg bg-red-50/60 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200/60 hover:border-red-300 shadow-sm hover:shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-400"
        aria-label={`${t.remove} ${product_name || planPackage || t.product} from basket`}
        tabIndex={0}
      >
        <HiTrash className="w-4 h-4" />
      </button>
    </div>
  );
});

export default BasketItem;