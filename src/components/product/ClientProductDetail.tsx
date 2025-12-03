'use client';

import { useState, memo } from 'react';
import parse from 'html-react-parser';
import ProductHeader from './ProductHeader';
import ProductDetailPricingPlans from './ProductDetailPricingPlans';

interface ProductSubType { id: number; name: string }
interface Feature { id: string; name: string; content: string; slug: string }
interface PricingPlan {
  id: number;
  product_id?: number;
  package?: string;
  type?: string;
  measure?: string;
  currency: string;
  currency_symbol: string;
  price: number;
  promotion_price?: number;
  promotion_percent?: number;
  is_promotion?: boolean;
  inventory?: { status: string }[];
  buy_url?: string;
  slug?: string;
  product_name?: string;
  links_to_image?: string;
  features?: Feature[];
  computed_price?: number;
  computed_currency_symbol?: string;
  computed_stripe_price_id?: string;
  user_currency?: string;
  recurring_interval?: string;
  recurring_interval_count?: number;
  annual_size_discount?: number;
}

interface ClientProductDetailProps {
  productSubType: ProductSubType | null;
  productName: string;
  productId: number;
  productImage?: string;
  productDescription?: string;
  pricingPlans: PricingPlan[];
  amazonBooksUrl?: string;
}

const ClientProductDetail = memo(function ClientProductDetail({
  productSubType,
  productName,
  productId,
  productImage,
  productDescription,
  pricingPlans,
  amazonBooksUrl,
}: ClientProductDetailProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  return (
    <>
      <ProductHeader
        productSubType={productSubType}
        productName={productName}
        productId={productId}
        productImage={productImage}
        productDescription={productDescription}
        billingCycle={billingCycle}
        onBillingCycleChange={setBillingCycle}
        pricingPlans={pricingPlans}
      />
      {productDescription && (
        <div className="relative bg-white/40 backdrop-blur-sm border border-white/30 rounded-2xl px-6 py-2 mt-2 md:mt-3 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/20 rounded-2xl"></div>
          {/* Subtle texture overlay for glass realism */}
          <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' /%3E%3C/svg%3E")' }}></div>
          <div className="relative text-gray-700 text-base md:text-lg font-normal leading-relaxed">
            {parse(productDescription)}
          </div>
        </div>
      )}
      {pricingPlans && pricingPlans.length > 0 ? (
        <div id="pricing-plans" className={productDescription ? 'mt-3' : 'mt-3'}>
          <ProductDetailPricingPlans pricingPlans={pricingPlans} amazonBooksUrl={amazonBooksUrl} billingCycle={billingCycle} />
        </div>
      ) : (
        <div className="mt-6 bg-white/60 backdrop-blur-sm border border-white/30 rounded-2xl p-8 shadow-lg">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No pricing plans available at the moment</p>
            <p className="text-gray-500 text-sm mt-2">Please check back later or contact support</p>
          </div>
        </div>
      )}
    </>
  );
});

export default ClientProductDetail;
