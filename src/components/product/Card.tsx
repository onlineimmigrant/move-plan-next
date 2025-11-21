import Image from 'next/image';
import { useProductTranslations } from './useProductTranslations';

// Define the Product type
type Product = {
  id: number;
  product_name: string;
  links_to_image?: string;
  price_manual?: number;
  currency_manual?: string;
  product_description?: string;
  [key: string]: any;
};

export default function Card({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { t } = useProductTranslations();
  // Use links_to_image directly, fall back to a local image if not available
  const imageSrc = product.links_to_image || '/images/logo.svg'; // Local fallback

  return (
    <div className="bg-gray-50 border-gray-200 rounded-lg hover:bg-gray-100 p-4 sm:h-96">
      {/* Fixed-size container (48×48) */}
      <div className="relative w-64 sm:w-64 h-96 sm:h-72 mb-2 overflow-hidden">
        {/* Use next/image for optimized image loading */}
        <Image
          src={imageSrc}
          alt={product.product_name || t.product}
          fill // Replaces absolute positioning to fill the container
          priority={priority}
          className="object-contain object-center"
          sizes="(max-width: 640px) 100vw, 256px" // Adjust based on your layout
        />
      </div>

      <h2 className="text-xs font-medium text-gray-800 pt-4">{product.product_name}</h2>

      <div className="flex justify-between items-center text-xs font-medium">
        <span className="text-gray-500 font-light">{t.from}</span>
        <span>
          {product.price_manual
            ? `${product.currency_manual || '£'}${product.price_manual}`
            : '---'}
        </span>
      </div>

      {/* Uncomment if you want to display the description */}
      {/* <p className="text-xs text-gray-500 font-thin">{product.product_description}</p> */}
    </div>
  );
}