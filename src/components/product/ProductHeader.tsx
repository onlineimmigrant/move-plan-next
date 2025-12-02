'use client';

import RightArrowDynamic from '@/ui/RightArrowDynamic';
import Link from 'next/link';
import { useState, useEffect, useCallback, memo } from 'react';
import { useProductTranslations } from './useProductTranslations';
import { supabase } from '@/lib/supabaseClient';
import dynamic from 'next/dynamic';
import { useThemeColors } from '@/hooks/useThemeColors';

// Dynamically import ProductVideoGenerator to avoid loading it unless needed
const ProductVideoGeneratorInline = dynamic(
  () => import('@/components/ProductVideoGenerator'),
  { 
    loading: () => <div className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>,
    ssr: false 
  }
);

interface ProductHeaderProps {
  productSubType: { id: number; name: string } | null;
  productName: string;
  productId?: number;
  productImage?: string;
  productDescription?: string;
  onGenerateVideo?: () => void;
  billingCycle?: 'monthly' | 'annual';
  onBillingCycleChange?: (v: 'monthly' | 'annual') => void;
}

const ProductHeader = memo(function ProductHeader({ 
  productSubType, 
  productName,
  productId,
  productImage,
  productDescription,
  onGenerateVideo,
  billingCycle,
  onBillingCycleChange,
}: ProductHeaderProps) {
  const { t } = useProductTranslations();
  const themeColors = useThemeColors();
  const [isFixed, setIsFixed] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showVideoGenerator, setShowVideoGenerator] = useState(false);

  // Check if user is admin/owner
  useEffect(() => {
    async function checkAdminStatus() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        setIsAdmin(profile?.role === 'admin' || profile?.role === 'owner');
      }
    }
    checkAdminStatus();
  }, []);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;

    // Unfix the element if we're at the top of the page
    if (currentScrollY <= 0) {
      setIsFixed(false);
    } else if (currentScrollY > lastScrollY && !isFixed) {
      // Fix the element when scrolling the content up (user swipes down), but only if it's not already fixed
      setIsFixed(true);
    }
    // Note: We no longer unfix when scrolling down; the element stays fixed until we reach the top

    setLastScrollY(currentScrollY);
  }, [lastScrollY, isFixed]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return (
    <div
      className={`
        w-full px-4 mx-auto max-w-7xl will-change-transform
        transition-all duration-500 ease-out
        md:static md:bg-transparent md:shadow-none
        ${
          isFixed
            ? 'fixed top-0 left-0 right-0 z-[51] bg-white/80 backdrop-blur-md shadow-2xl shadow-blue-100/20 border-b border-white/30'
            : 'relative'
        }
      `}
    >
      <div className="mt-4 flex flex-col">
        <div className="flex items-center justify-between mb-2 gap-3">
          <Link
            href={productSubType ? `/products?category=${productSubType.id}` : '/products'}
            className={`flex items-center transition-all duration-200 group font-medium text-xs sm:text-sm text-${themeColors.primary.text} tracking-wide hover:text-${themeColors.primary.textHover} no-underline hover:no-underline`}
          >
            <span className="transition-transform duration-200 group-hover:-translate-x-1">
              {productSubType?.name || t.allProducts}
            </span>
            <RightArrowDynamic />
          </Link>
          {onBillingCycleChange && billingCycle && (
            <div className="inline-flex items-center rounded-full border border-gray-200 bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => onBillingCycleChange('monthly')}
                className={`px-3 py-1 text-xs font-medium ${
                  billingCycle === 'monthly'
                    ? `bg-${themeColors.primary.bgLight} text-${themeColors.primary.text}`
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                aria-pressed={billingCycle === 'monthly'}
              >
                Monthly
              </button>
              <span className="h-4 w-px bg-gray-200" aria-hidden="true" />
              <button
                type="button"
                onClick={() => onBillingCycleChange('annual')}
                className={`px-3 py-1 text-xs font-medium ${
                  billingCycle === 'annual'
                    ? `bg-${themeColors.primary.bgLight} text-${themeColors.primary.text}`
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                aria-pressed={billingCycle === 'annual'}
              >
                Annual
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-tight text-gray-900">
            {productName}
          </h1>
          
          {/* AI Video Generator Button - Only for Admin/Owner */}
          {isAdmin && productId && productImage && (
            <button
              onClick={() => setShowVideoGenerator(!showVideoGenerator)}
              className="group relative flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              title="Generate AI Talking Video"
            >
              <svg 
                className="w-5 h-5 transition-transform group-hover:rotate-12" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" 
                />
              </svg>
              <span className="hidden sm:inline text-sm font-medium">AI Video</span>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
              </span>
            </button>
          )}
        </div>
      </div>
      
      {/* AI Video Generator Panel - Collapsible */}
      {isAdmin && showVideoGenerator && productId && productImage && (
        <div className="mt-4 mb-2 animate-slideDown">
          <div className="relative bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700 rounded-2xl p-1 shadow-lg">
            <div className="relative bg-white dark:bg-gray-800 rounded-xl p-4">
              {/* Dynamically import the generator to avoid bundle bloat */}
              <ProductVideoGeneratorInline 
                productId={productId.toString()}
                imageUrl={productImage}
                productName={productName}
                productDescription={productDescription}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default ProductHeader;