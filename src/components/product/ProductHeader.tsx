'use client';

import RightArrowDynamic from '@/ui/RightArrowDynamic';
import Link from 'next/link';
import { useState, useEffect, useCallback, memo } from 'react';
import { useProductTranslations } from './useProductTranslations';

interface ProductHeaderProps {
  productSubType: { id: number; name: string } | null; // Updated to include id
  productName: string;
}

const ProductHeader = memo(function ProductHeader({ productSubType, productName }: ProductHeaderProps) {
  const { t } = useProductTranslations();
  const [isFixed, setIsFixed] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

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
        <Link
          href={productSubType ? `/products?category=${productSubType.id}` : '/products'}
          className="flex items-center transition-all duration-200 group font-medium text-xs sm:text-sm text-sky-600 tracking-wide hover:text-sky-700 no-underline hover:no-underline mb-2"
        >
          <span className="transition-transform duration-200 group-hover:-translate-x-1">
            {productSubType?.name || t.allProducts}
          </span>
          <RightArrowDynamic />
        </Link>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-tight text-gray-900">
          {productName}
        </h1>
      </div>
    </div>
  );
});

export default ProductHeader;