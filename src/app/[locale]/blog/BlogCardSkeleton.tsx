export default function BlogCardSkeleton() {
  return (
    <div className="h-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col animate-pulse">
      {/* Image skeleton */}
      <div className="relative w-full aspect-square flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      </div>
      
      {/* Content skeleton */}
      <div className="flex flex-col p-6 flex-grow">
        {/* Title skeleton */}
        <div className="h-5 bg-gradient-to-r from-gray-100 to-gray-200 rounded mb-3 w-3/4" />
        
        {/* Description skeleton - 2 lines */}
        <div className="space-y-2 flex-grow">
          <div className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-full" />
          <div className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-5/6" />
        </div>
      </div>
      
      {/* Footer skeleton */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-transparent flex justify-end">
        <div className="h-3 w-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded" />
      </div>
    </div>
  );
}
