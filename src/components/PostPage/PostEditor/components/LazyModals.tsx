import dynamic from 'next/dynamic';
import { Suspense } from 'react';

/**
 * Lazy-loaded ImageGalleryModal with code splitting
 * @performance Reduces initial bundle size by ~50KB
 */
export const ImageGalleryModalLazy = dynamic(
  () => import('@/components/modals/ImageGalleryModal'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    ),
    ssr: false,
  }
);

/**
 * Wrapper component for lazy modals with Suspense fallback
 */
export function LazyModalWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          <div className="animate-pulse text-gray-500">Loading...</div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
