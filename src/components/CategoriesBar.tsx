// app/components/CategoriesBar.tsx
type ProductSubType = {
  id: number;
  name: string;
  display_for_products: boolean;
  title_english?: string;
  [key: string]: any;
};

interface CategoriesBarProps {
  productSubTypes: ProductSubType[];
  onCategoryChange: (subType: ProductSubType | null) => void;
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
      <button
        onClick={() => onCategoryChange(null)}
        className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
          activeSubTypeName === null ? 'bg-sky-100 text-sky-500' : 'bg-gray-50 text-gray-800'
        } hover:bg-sky-200`}
      >
        All
      </button>

      {/* Buttons for each filtered sub-type */}
      {visibleSubTypes.map((subType) => {
        const isActive = subType.name === activeSubTypeName;
        return (
          <button
            key={subType.id}
            onClick={() => onCategoryChange(subType)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              isActive ? 'bg-sky-100 text-sky-500' : 'bg-gray-50 text-gray-800'
            } hover:bg-sky-200`}
          >
            {subType.title_english || subType.name}
          </button>
        );
      })}
    </div>
  );
}