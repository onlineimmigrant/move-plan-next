import Link from 'next/link';
import { memo, useMemo } from 'react';
import { useProductTranslations } from './useProductTranslations';
import { useThemeColors } from '@/hooks/useThemeColors';

type ProductSubType = {
  id: number;
  name: string;
  display_for_products: boolean;
  title_english?: string;
  [key: string]: any;
};

interface CategoriesBarProps {
  productSubTypes: ProductSubType[];
  onCategoryChange: (subType: ProductSubType | null) => void; // Keep for compatibility
  activeSubTypeName: string | null;
}

const CategoriesBar = memo(function CategoriesBar({
  productSubTypes,
  onCategoryChange,
  activeSubTypeName,
}: CategoriesBarProps) {
  const { t } = useProductTranslations();
  const themeColors = useThemeColors();
  
  // Memoized filtered sub-types for better performance
  const visibleSubTypes = useMemo(() => 
    productSubTypes.filter((subType) => subType.display_for_products),
    [productSubTypes]
  );

  return (
    <div className="flex space-x-2 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent py-2 px-1">
      {/* "All" button with improved styling */}
      <Link
        href="/products"
        onClick={() => onCategoryChange(null)}
        className={`
          cursor-pointer px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex-shrink-0
          ${activeSubTypeName === null 
            ? `bg-${themeColors.primary.bgLight} text-${themeColors.primary.text} ring-2 ring-${themeColors.primary.border}` 
            : `bg-gray-50 text-gray-700 hover:bg-${themeColors.primary.bgLighter} hover:text-${themeColors.primary.textHover}`
          }
        `}
      >
        {t.allCategories}
      </Link>

      {/* Enhanced category links */}
      {visibleSubTypes.map((subType) => {
        const isActive = subType.name === activeSubTypeName;
        return (
          <Link
            key={subType.id}
            href={`/products?category=${subType.id}`}
            onClick={() => onCategoryChange(subType)}
            className={`
              cursor-pointer px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex-shrink-0
              ${isActive 
                ? `bg-${themeColors.primary.bgLight} text-${themeColors.primary.text} ring-2 ring-${themeColors.primary.border}` 
                : `bg-gray-50 text-gray-700 hover:bg-${themeColors.primary.bgLighter} hover:text-${themeColors.primary.textHover}`
              }
            `}
          >
            {subType.title_english || subType.name}
          </Link>
        );
      })}
    </div>
  );
});

export default CategoriesBar;