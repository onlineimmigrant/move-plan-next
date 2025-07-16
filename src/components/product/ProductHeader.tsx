'use client';

import RightArrowDynamic from '@/ui/RightArrowDynamic';
import Link from 'next/link';
import { useState, useEffect, useCallback, memo } from 'react';

interface ProductHeaderProps {
  productSubType: { id: number; name: string } | null; // Updated to include id
  productName: string;
}

const ProductHeader = memo(function ProductHeader({ productSubType, productName }: ProductHeaderProps) {
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
        transition-all duration-300 ease-in-out
        md:static md:bg-transparent md:shadow-none
        ${
          isFixed
            ? 'fixed top-0 left-0 right-0 z-[51] bg-white/90 backdrop-blur-sm shadow-lg border-b border-gray-200'
            : 'relative'
        }
      `}
    >
      <div className="flex flex-col bg-gradient-to-r from-sky-50 to-blue-50 sm:bg-transparent p-4 -mx-4 px-8 rounded-lg sm:rounded-none">
        <Link
          href={productSubType ? `/products?category=${productSubType.id}` : '/products'}
          className="flex items-center transition-all duration-200 group font-medium text-xs text-sky-600 tracking-widest hover:text-sky-700 hover:underline mb-1"
        >
          <span className="transition-transform duration-200 group-hover:-translate-x-1">
            {productSubType?.name || 'All Products'}
          </span>
          <RightArrowDynamic />
        </Link>
        <h1 className="text-base md:text-lg font-semibold tracking-tight leading-tight text-gray-900">
          {productName}
        </h1>
      </div>
    </div>
  );
});

export default ProductHeader;