import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// TypeScript interfaces
interface CardItem {
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  tooltip: string;
}

export interface ModalCardItem extends CardItem {
  onClick: () => void;
  id: string;
  isModal: true;
}

export interface NavigationCardItem extends CardItem {
  href: string;
  isModal?: false;
}

export interface PrimaryColors {
  base: string;
  lighter: string;
}

// Modal Button Card Component with hover state - Memoized to prevent unnecessary re-renders
export const AdminModalCard = React.memo<{ item: ModalCardItem; primary: PrimaryColors }>(({ item, primary }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);
  
  return (
    <button
      onClick={item.onClick}
      className="w-full group flex flex-col items-center justify-center p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-700/30 transition-all duration-300"
      style={{
        backgroundColor: isHovered ? `${primary.lighter}80` : undefined
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={item.label}
      type="button"
      aria-label={item.label}
    >
        <div className="transform group-hover:scale-110 transition-transform" aria-hidden="true">
          <item.icon
            className="h-10 w-10 transition-colors"
            style={{ color: isHovered ? primary.base : '#4b5563' }}
          />
        </div>
        <span 
          className="mt-3 text-sm font-medium text-center sm:text-base transition-colors text-gray-900 dark:text-white"
          style={{ color: isHovered ? primary.base : undefined }}
        >
          {item.label}
        </span>
      </button>
  );
});

AdminModalCard.displayName = 'AdminModalCard';

// Navigation Link Card Component with hover state - Memoized to prevent unnecessary re-renders
export const AdminLinkCard = React.memo<{ item: NavigationCardItem; pathname: string; primary: PrimaryColors }>(({ item, pathname, primary }) => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const isActive = pathname === item.href;
  
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    // Prefetch the route on hover for better performance
    router.prefetch(item.href);
  }, [item.href, router]);
  
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);
  
  return (
    <Link
      href={item.href}
      className="group flex flex-col items-center justify-center p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-700/30 transition-all duration-300"
      style={{
        backgroundColor: isActive ? `${primary.lighter}80` : (isHovered ? `${primary.lighter}80` : undefined)
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={item.label}
      aria-current={isActive ? 'page' : undefined}
      aria-label={item.label}
    >
        <div className="transform group-hover:scale-110 transition-transform" aria-hidden="true">
          <item.icon
            className="h-10 w-10 transition-colors"
            style={{
              color: (isActive || isHovered) ? primary.base : '#4b5563'
            }}
          />
        </div>
        <span 
          className="mt-3 text-sm font-medium text-center sm:text-base transition-colors text-gray-900 dark:text-white"
          style={{ color: isHovered ? primary.base : undefined }}
        >
          {item.label}
        </span>
      </Link>
  );
});

AdminLinkCard.displayName = 'AdminLinkCard';
