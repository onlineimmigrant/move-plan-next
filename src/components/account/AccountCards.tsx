import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Default neutral color for non-hovered state
const NEUTRAL_COLOR = 'rgb(75, 85, 99)'; // gray-600

// TypeScript interfaces
interface DashboardLinkItem {
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  href?: string;
  tooltip: string;
  onClick?: () => void;
  isModal?: boolean;
}

interface PrimaryColors {
  base: string;
  lighter: string;
}

interface AccountLinkCardProps {
  item: DashboardLinkItem;
  pathname: string;
  primary: PrimaryColors;
}

/**
 * Modal Button Card Component with hover state - Memoized to prevent unnecessary re-renders
 */
export const AccountModalCard = React.memo<{ item: DashboardLinkItem; primary: PrimaryColors }>(({ item, primary }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      onClick={item.onClick}
      className="w-full group flex flex-col items-center justify-center p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-700/30 transition-all duration-200 ease-in-out"
      style={{
        backgroundColor: isHovered ? `${primary.lighter}80` : undefined
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={item.label}
      type="button"
      aria-label={item.label}
    >
        <div className="transform group-hover:scale-110 transition-transform">
          <item.icon
            className="h-10 w-10 transition-colors"
            style={{ color: isHovered ? primary.base : NEUTRAL_COLOR }}
            aria-hidden="true"
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

AccountModalCard.displayName = 'AccountModalCard';

/**
 * Navigation Link Card Component with hover state - Memoized to prevent unnecessary re-renders
 */
export const AccountLinkCard = React.memo<AccountLinkCardProps>(({ item, pathname, primary }) => {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const isActive = pathname === item.href;
  const isAdminPage = item.href === '/admin';
  
  // Prefetch on hover for instant navigation
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (item.href) {
      router.prefetch(item.href);
    }
  }, [item.href, router]);
  
  return (
    <Link
      href={item.href!}
      prefetch={true}
      className="group flex flex-col items-center justify-center p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-700/30 transition-all duration-200 ease-in-out"
      style={{
        backgroundColor: isActive ? `${primary.lighter}80` : (isHovered ? `${primary.lighter}80` : undefined)
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      title={item.label}
      aria-current={isActive ? 'page' : undefined}
      aria-label={`Navigate to ${item.label}`}
    >
        <div className="transform group-hover:scale-110 transition-transform">
          <item.icon
            className="h-10 w-10 transition-colors"
            style={{
              color: (isAdminPage || isHovered) ? primary.base : NEUTRAL_COLOR
            }}
            aria-hidden="true"
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

AccountLinkCard.displayName = 'AccountLinkCard';
