'use client';

import Image from 'next/image';
import { HiMinus, HiPlus, HiTrash } from 'react-icons/hi';
import { useCallback, memo } from 'react';
import AssociatedFeaturesDisclosure from './AssociatedFeaturesDisclosure';
import { useProductTranslations } from './useProductTranslations';

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
    };
    quantity: number;
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
  const { t } = useProductTranslations();
  const { plan, quantity } = item;
  const { 
    product_name, 
    package: planPackage, 
    measure, 
    currency_symbol, 
    price, 
    promotion_price, 
    is_promotion, 
    links_to_image 
  } = plan;

  const finalPrice = (is_promotion && promotion_price ? promotion_price : price) * quantity / 100;

  const handleIncrement = useCallback(() => {
    updateQuantity(plan.id, quantity + 1);
  }, [plan.id, quantity, updateQuantity]);

  const handleDecrement = useCallback(() => {
    updateQuantity(plan.id, quantity - 1);
  }, [plan.id, quantity, updateQuantity]);

  const handleRemove = useCallback(() => {
    removeFromBasket(plan.id);
  }, [plan.id, removeFromBasket]);

  return (
    <div className="flex items-start space-x-4 p-5 bg-gradient-to-r from-gray-50 to-white rounded-2xl hover:from-gray-100 hover:to-gray-50 transition-all duration-300 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md">
      {/* Enhanced Product Image */}
      <div className="flex-shrink-0">
        {links_to_image ? (
          <div className="relative w-20 h-20 bg-white rounded-xl overflow-hidden shadow-md border border-gray-200">
            <Image
              src={links_to_image}
              alt={product_name || 'Product'}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
        ) : (
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-md border border-gray-200">
            <span className="text-gray-500 text-xs text-center font-medium">{t.noImage}</span>
          </div>
        )}
      </div>

      {/* Item Details */}
      <div className="flex-1 min-w-0">
        <div className="mb-3">
          <h3 className="text-base font-semibold text-gray-900 truncate">
            {product_name || t.product}
          </h3>
          {planPackage && (
            <p className="text-sm text-sky-600 font-medium">{planPackage}</p>
          )}
          {measure && (
            <p className="text-xs text-gray-500 mt-1">{measure}</p>
          )}
        </div>

        {/* Enhanced Quantity Controls */}
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-sm text-gray-600 font-medium">{t.quantity}:</span>
          <div className="flex items-center space-x-0 bg-white rounded-xl border-2 border-gray-200 shadow-sm">
            <button
              onClick={handleDecrement}
              className="p-2.5 hover:bg-gray-50 transition-colors duration-200 rounded-l-xl border-r border-gray-200"
              aria-label={t.decreaseQuantity}
            >
              <HiMinus className="w-4 h-4 text-gray-600" />
            </button>
            <span className="px-4 py-2.5 text-sm font-bold text-gray-900 min-w-[3rem] text-center bg-gray-50">
              {quantity}
            </span>
            <button
              onClick={handleIncrement}
              className="p-2.5 hover:bg-gray-50 transition-colors duration-200 rounded-r-xl border-l border-gray-200"
              aria-label={t.increaseQuantity}
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

      {/* Price and Actions */}
      <div className="text-right flex-shrink-0">
        <div className="mb-3">
          {is_promotion && promotion_price ? (
            <div>
              <p className="text-lg font-bold text-gray-900">
                {currency_symbol}{finalPrice.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 line-through">
                {currency_symbol}{(price * quantity / 100).toFixed(2)}
              </p>
            </div>
          ) : (
            <p className="text-lg font-bold text-gray-900">
              {currency_symbol}{finalPrice.toFixed(2)}
            </p>
          )}
          {quantity > 1 && (
            <p className="text-xs text-gray-500">
              {currency_symbol}{((is_promotion && promotion_price ? promotion_price : price) / 100).toFixed(2)} {t.each}
            </p>
          )}
        </div>
        
        <button
          onClick={handleRemove}
          className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl transition-all duration-200 border border-red-200 hover:border-red-300 shadow-sm hover:shadow-md"
        >
          <HiTrash className="w-4 h-4" />
          <span className="text-sm font-semibold">{t.remove}</span>
        </button>
      </div>
    </div>
  );
});

export default BasketItem;