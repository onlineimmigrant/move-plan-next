import Link from 'next/link';

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

export default function CategoriesBar({
  productSubTypes,
  onCategoryChange,
  activeSubTypeName,
}: CategoriesBarProps) {
  // Filter sub-types to only show those with display_for_products === true
  const visibleSubTypes = productSubTypes.filter((subType) => subType.display_for_products);

  return (
    <div className="flex space-x-2 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent py-2">
      {/* "All" button */}
      <Link
        href="/products"
        onClick={() => onCategoryChange(null)} // Trigger client-side callback for compatibility
        className={`cursor-pointer px-3 py-1 text-sm font-semibold rounded transition-colors ${
          activeSubTypeName === null ? 'bg-sky-100 text-sky-500' : 'bg-gray-50 text-gray-800'
        } hover:bg-sky-200`}
      >
        All
      </Link>

      {/* Links for each filtered sub-type */}
      {visibleSubTypes.map((subType) => {
        const isActive = subType.name === activeSubTypeName;
        return (
          <Link
            key={subType.id}
            href={`/products?category=${subType.id}`}
            onClick={() => onCategoryChange(subType)} // Trigger client-side callback
            className={`cursor-pointer px-3 py-1 text-sm font-medium rounded transition-colors ${
              isActive ? 'bg-sky-100 text-sky-500' : 'bg-gray-50 text-gray-800'
            } hover:bg-sky-200`}
          >
            {subType.title_english || subType.name}
          </Link>
        );
      })}
    </div>
  );
}