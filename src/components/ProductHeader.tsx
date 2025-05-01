// /src/components/ProductHeader.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface ProductHeaderProps {
  productSubType: { name: string } | null; // Revert to null to match Product type
  productName: string;
}

export default function ProductHeader({ productSubType, productName }: ProductHeaderProps) {
  const [isFixed, setIsFixed] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
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
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY, isFixed]);

  return (
    <div
    className={`
        w-full
        px-4 mx-auto max-w-7xl
        will-change-transform
        transition-all duration-800 ease-in-out
        md:static md:bg-transparent md:shadow-none
        ${isFixed
          ? 'fixed top-0 left-0 right-0 z-[51] bg-sky-50 shadow-md translate-y-0 opacity-100'
          : 'relative translate-y-0 opacity-100'
        }
      `}    >
      <div className="flex flex-col bg-sky-50 sm:bg-transparent p-4 -mx-4 px-8">
        <Link
          href="/products"
          className="font-medium text-xs text-sky-500 tracking-widest hover:underline mb-0"
        >
          {productSubType?.name || 'Unknown Sub-Type'}
        </Link>
        <h1 className="text-base md:text-lg font-semibold tracking-tight leading-tight">
          {productName}
        </h1>
      </div>
    </div>
  );
}