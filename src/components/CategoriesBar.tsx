// Define the ProductSubType type
type ProductSubType = {
  id: number;
  name: string;
  title_english?: string;
  [key: string]: any; // For any additional fields
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
  return (
    // Make horizontally scrollable
    <div className="flex space-x-2 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent py-2">
      {/* "All" button */}
      <button
        onClick={() => onCategoryChange(null)}
        className={`px-3 py-1 text-xs font-semibold rounded transition-colors
          ${activeSubTypeName === null ? 'bg-green-100 text-green-800' : 'bg-gray-50 text-gray-800'}
          hover:bg-green-200`}
      >
        All
      </button>

      {/* Buttons for each sub-type */}
      {productSubTypes.map((subType) => {
        const isActive = subType.name === activeSubTypeName;
        return (
          <button
            key={subType.name}
            onClick={() => onCategoryChange(subType)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors
              ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-50 text-green-800'}
              hover:bg-green-200`}
          >
            {subType.title_english || subType.name}
          </button>
        );
      })}
    </div>
  );
}