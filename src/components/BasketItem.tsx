'use client';

import Image from 'next/image';
import { HiMinus, HiPlus, HiTrash } from 'react-icons/hi';
import AssociatedFeaturesDisclosure from './AssociatedFeaturesDisclosure'; // Import the new component

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

export default function BasketItem({
  item,
  updateQuantity,
  removeFromBasket,
  associatedFeatures = [],
}: BasketItemProps) {
  const { plan, quantity } = item;
  const { product_name, package: planPackage, measure, currency, price, promotion_price, is_promotion, links_to_image } =
    plan;

  const finalPrice = (is_promotion && promotion_price ? promotion_price : price) * quantity;

  return (
    <div className="flex items-center p-4 border border-gray-300 rounded-lg bg-white hover:shadow-md transition-shadow duration-200">
      {/* Product Image */}
      <div className="mr-4">
        {links_to_image ? (
          <Image
            src={links_to_image}
            alt={product_name || 'Product'}
            width={96}
            height={96}
            className="w-24 h-24 object-contain rounded"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-100 flex items-center justify-center rounded border border-gray-200">
            <span className="text-gray-400 text-sm">No image</span>
          </div>
        )}
      </div>

      {/* Item Details */}
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-gray-900">
          {product_name} – {planPackage || 'Standard'}
        </h3>
        <p className="text-xs text-gray-500 font-light">{measure || 'Product'}</p>
        <div className="mt-2 flex items-center space-x-2">
          <button
            onClick={() => updateQuantity(plan.id, quantity - 1)}
            className="p-1.5 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors duration-200"
          >
            <HiMinus className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-900">{quantity}</span>
          <button
            onClick={() => updateQuantity(plan.id, quantity + 1)}
            className="p-1.5 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors duration-200"
          >
            <HiPlus className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Associated Features Disclosure */}
        {associatedFeatures.length > 0 && (
          <AssociatedFeaturesDisclosure associatedFeatures={associatedFeatures} />
        )}
      </div>

      {/* Price and Remove Button */}
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">
          {currency} {finalPrice}
        </p>
        <button
          onClick={() => removeFromBasket(plan.id)}
          className="mt-2 flex items-center gap-1 text-xs font-medium text-red-700 hover:text-red-800 transition-colors duration-200"
        >
          <HiTrash className="w-4 h-4" />
          Remove
        </button>
      </div>
    </div>
  );
}