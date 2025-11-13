import React from 'react';
import { ArrowRightIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BlogPost } from '../hooks/useBlogPostData';

interface BlogPostGridProps {
  posts: BlogPost[];
  onDragEnd: (event: any) => void;
  primaryColor: string;
  primaryHoverColor: string;
  organizationLogo?: string | null;
}

interface BlogPostCardProps {
  post: BlogPost;
  index: number;
  primaryColor: string;
  organizationLogo?: string | null;
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({ post, index, primaryColor, organizationLogo }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: post.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Determine which image to use: main_photo or organization logo
  const imageUrl = post.main_photo && post.main_photo.trim() !== '' ? post.main_photo : organizationLogo;
  // Check if the image is SVG format
  const isSvg = imageUrl?.toLowerCase().endsWith('.svg');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative h-full cursor-move',
        isDragging && 'opacity-50 scale-105 shadow-2xl z-50'
      )}
    >
      {/* Drag Handle Indicator - Top Left */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'absolute top-2 left-2 z-20',
          'p-1.5 rounded-md',
          'bg-white/90 dark:bg-gray-800/90',
          'border border-gray-300 dark:border-gray-600',
          'opacity-0 group-hover:opacity-100',
          'transition-opacity duration-200',
          'cursor-grab active:cursor-grabbing'
        )}
      >
        <svg
          className="w-4 h-4 text-gray-600 dark:text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8h16M4 16h16"
          />
        </svg>
      </div>

      {/* Order Badge - Top Right */}
      <div
        className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md"
        style={{ backgroundColor: primaryColor }}
      >
        {index + 1}
      </div>

      {/* Preview Link - Appears on hover below order badge */}
      <a
        href={`/${post.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'absolute top-12 right-2 z-20',
          'p-1.5 rounded-md',
          'bg-white/90 dark:bg-gray-700/90',
          'border border-gray-200 dark:border-gray-600',
          'opacity-0 group-hover:opacity-100',
          'transition-opacity duration-200',
          'hover:bg-gray-50 dark:hover:bg-gray-600'
        )}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        aria-label="Open blog post in new tab"
      >
        <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      </a>

      {/* Card Content - Mirroring Blog Page Design */}
      <div className="h-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col transition-shadow duration-200 group-hover:shadow-md">
        {/* Image Section */}
        {imageUrl ? (
          <div className="w-full h-48 flex-shrink-0 bg-gray-100 relative overflow-hidden flex items-center justify-center">
            <img
              src={imageUrl}
              alt={post.title ?? 'Blog post image'}
              className={isSvg ? 'max-w-[60%] max-h-[60%] object-contain' : 'w-full h-full object-cover'}
              onError={(e) => {
                // Silently handle image load failure with fallback UI
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.classList.add('bg-gradient-to-br', 'from-sky-50', 'to-blue-100');
                  const fallbackIcon = document.createElement('div');
                  fallbackIcon.className = 'absolute inset-0 flex items-center justify-center text-6xl';
                  fallbackIcon.textContent = '📄';
                  parent.appendChild(fallbackIcon);
                }
              }}
            />
          </div>
        ) : (
          <div className="w-full h-48 flex-shrink-0 bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center">
            <span className="text-6xl">📄</span>
          </div>
        )}

        {/* Content Section */}
        <div className="p-6 flex flex-col flex-grow">
          <h2 className="tracking-tight text-lg line-clamp-1 font-semibold text-gray-900 mb-3 group-hover:text-sky-400 transition-colors duration-200">
            {post.title ?? 'Untitled'}
          </h2>
          <p className="tracking-widest text-base text-gray-600 font-light line-clamp-2 flex-grow">
            {post.description ?? 'No description available'}
          </p>
        </div>

        {/* Footer Section */}
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-transparent flex-shrink-0 flex justify-end relative">
          {post.subsection && post.subsection.trim() !== '' ? (
            <>
              <span className="text-gray-500 text-sm font-medium group-hover:opacity-0 transition-opacity duration-200">
                {post.subsection}
              </span>
              <span className="absolute right-6 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <ArrowRightIcon className="h-5 w-5" />
              </span>
            </>
          ) : (
            <span className="text-sky-400">
              <ArrowRightIcon className="h-5 w-5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const BlogPostGrid: React.FC<BlogPostGridProps> = ({
  posts,
  onDragEnd,
  primaryColor,
  primaryHoverColor,
  organizationLogo,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-6xl mb-3">📄</div>
          <p className="text-gray-500 dark:text-gray-400">No blog posts found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Create blog posts to manage their order here
          </p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={posts.map(p => p.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {posts.map((post, index) => (
            <BlogPostCard
              key={post.id}
              post={post}
              index={index}
              primaryColor={primaryColor}
              organizationLogo={organizationLogo}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
