import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, Bars3Icon, EyeIcon, EyeSlashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Tooltip from '../Tooltip';
import { createPortal } from 'react-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface BlogPost {
  id?: number;
  title: string;
  slug: string;
  description?: string;
  content?: string;
  order: number;
  display_this_post?: boolean;
  display_as_blog_post?: boolean;
  organization_id?: string | null;
  created_on?: string;
  last_modified?: string;
}

// Sortable Blog Post Item Component
interface SortableBlogPostItemProps {
  post: BlogPost;
  index: number;
  onEdit: (index: number) => void;
  onToggleVisibility: (index: number) => void;
  // Edit form props
  isEditing: boolean;
  editingIndex: number | null;
  editForm: Partial<BlogPost>;
  setEditForm: (form: Partial<BlogPost>) => void;
  handleSave: () => void;
  handleCancel: () => void;
  handleDeleteClick: (index: number) => void;
  isDragDisabled?: boolean;
}

function SortableBlogPostItem({
  post,
  index,
  onEdit,
  onToggleVisibility,
  // Edit form props
  isEditing,
  editingIndex,
  editForm,
  setEditForm,
  handleSave,
  handleCancel,
  handleDeleteClick,
  isDragDisabled = false,
}: SortableBlogPostItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: post.id?.toString() || `temp-${index}`,
    disabled: isDragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Truncate text to specified length with ellipsis
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Create tooltip content with all blog post details
  const tooltipContent = (
    <div className="space-y-1">
      {post.slug && (
        <div><strong>Slug:</strong> /{post.slug}</div>
      )}
      {post.description && (
        <div><strong>Description:</strong> {post.description}</div>
      )}
      {post.content && (
        <div><strong>Content:</strong> {post.content.substring(0, 100)}{post.content.length > 100 ? '...' : ''}</div>
      )}
      {post.order && (
        <div><strong>Order:</strong> {post.order}</div>
      )}
      {post.created_on && (
        <div><strong>Created:</strong> {formatDate(post.created_on)}</div>
      )}
      {post.last_modified && (
        <div><strong>Modified:</strong> {formatDate(post.last_modified)}</div>
      )}
      <div><strong>Visible:</strong> {post.display_this_post ? 'Yes' : 'No'}</div>
      <div><strong>Blog Post:</strong> {post.display_as_blog_post ? 'Yes' : 'No'}</div>
    </div>
  );

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ${
        isDragging ? 'shadow-lg ring-2 ring-sky-500/20' : ''
      }`}
    >
      {/* Main Blog Post Item - Simplified */}
      <div className="flex items-center justify-between p-4 hover:bg-gray-50/80 transition-colors rounded-t-xl">
        <div className="flex items-center gap-3 flex-1">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all duration-200 cursor-grab active:cursor-grabbing touch-none"
            aria-label="Drag to reorder"
            disabled={isDragDisabled}
          >
            <Bars3Icon className="h-4 w-4" />
          </button>
          
          <div className="flex-1 min-w-0">
            <Tooltip content={tooltipContent} variant="info-top">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 truncate cursor-help">
                  {truncateText(post.title, 15)}
                </span>
                {!post.display_this_post && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600 border border-red-200">
                    Hidden
                  </span>
                )}
                {post.display_as_blog_post && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600 border border-blue-200">
                    Blog
                  </span>
                )}
              </div>
            </Tooltip>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onToggleVisibility(index)}
            className={`p-1.5 rounded-lg transition-all duration-200 ${
              post.display_this_post 
                ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
            title={post.display_this_post ? 'Hide post' : 'Show post'}
          >
            {post.display_this_post ? (
              <EyeIcon className="h-4 w-4" />
            ) : (
              <EyeSlashIcon className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onEdit(index)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            title="Edit blog post"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Edit Form - Positioned right under the blog post item */}
      {isEditing && editingIndex === index && (
        <div className="border-t border-gray-200/60 bg-emerald-50 p-4">
          <h4 className="text-sm font-medium text-emerald-900 mb-3">
            Edit Blog Post
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={editForm.title || ''}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g., How to Get Started with Next.js"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Slug *
              </label>
              <input
                type="text"
                value={editForm.slug || ''}
                onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g., how-to-get-started-with-nextjs"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Order
              </label>
              <input
                type="number"
                value={editForm.order || ''}
                onChange={(e) => setEditForm({ ...editForm, order: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                min="1"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  checked={editForm.display_this_post === true}
                  onChange={(e) => setEditForm({ ...editForm, display_this_post: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-xs font-medium text-gray-700">Published</span>
              </label>
            </div>

            <div>
              <label className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  checked={editForm.display_as_blog_post === true}
                  onChange={(e) => setEditForm({ ...editForm, display_as_blog_post: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-xs font-medium text-gray-700">Display as Blog Post</span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Brief description of the blog post..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                value={editForm.content || ''}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Full content of the blog post..."
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center gap-2 pt-4 border-t border-gray-200 mt-4">
            <div>
              {editingIndex !== null && (
                <button
                  type="button"
                  onClick={() => handleDeleteClick(editingIndex)}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:text-red-800"
                >
                  <TrashIcon className="w-3 h-3" />
                  Delete
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!editForm.title || !editForm.slug}
                className="px-3 py-2 text-xs font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingIndex !== null ? 'Update' : 'Add'} Blog Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface BlogPostsSelectProps {
  label: string;
  name: string;
  value: BlogPost[];
  onChange: (name: string, value: BlogPost[]) => void;
}

// Utility function to generate slug from title
const generateSlug = (title: string): string => {
  if (!title) return '';
  
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

export const BlogPostsSelect: React.FC<BlogPostsSelectProps> = ({
  label,
  name,
  value = [],
  onChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<BlogPost>>({});
  const [displayCount, setDisplayCount] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAdd = useCallback(() => {
    const nextOrder = Math.max(0, ...value.map(post => post.order || 0)) + 1;
    setEditForm({
      title: '',
      slug: '',
      description: '',
      content: '',
      order: nextOrder,
      display_this_post: true,
      display_as_blog_post: true
    });
    setEditingIndex(null);
    setIsEditing(true);
  }, [value]);

    // Listen for custom add blog post event
  useEffect(() => {
    const handleAddBlogPostEvent = () => {
      handleAdd();
    };
    
    window.addEventListener('addBlogPost', handleAddBlogPostEvent);
    
    return () => {
      window.removeEventListener('addBlogPost', handleAddBlogPostEvent);
    };
  }, [handleAdd]);

  const handleEdit = (index: number) => {
    setEditForm({ ...value[index] });
    setEditingIndex(index);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editForm.title || !editForm.slug) return;

    const newPost: BlogPost = {
      ...editForm,
      title: editForm.title!,
      slug: editForm.slug!,
      description: editForm.description || '',
      content: editForm.content || '',
      order: editForm.order || 1,
      display_this_post: editForm.display_this_post === true,
      display_as_blog_post: editForm.display_as_blog_post === true
    };

    let newValue: BlogPost[];
    if (editingIndex !== null) {
      // Editing existing post
      newValue = [...value];
      newValue[editingIndex] = newPost;
    } else {
      // Adding new post
      newValue = [...value, newPost];
    }

    onChange(name, newValue);
    setIsEditing(false);
    setEditForm({});
    setEditingIndex(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({});
    setEditingIndex(null);
  };

  // Register action content with parent if callback provided
  useEffect(() => {
    // This useEffect is no longer needed since we're not using actionContent
  }, [editForm, handleSave, handleCancel]);

  const handleDeleteClick = (index: number) => {
    setPostToDelete(index);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (postToDelete !== null) {
      const newValue = value.filter((_, i) => i !== postToDelete);
      // Update order values to be sequential
      const reorderedValue = newValue.map((post, idx) => ({
        ...post,
        order: idx + 1,
      }));
      onChange(name, reorderedValue);
      setShowDeleteModal(false);
      setPostToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setPostToDelete(null);
  };

  const handleToggleVisibility = (index: number) => {
    const newValue = [...value];
    newValue[index] = {
      ...newValue[index],
      display_this_post: !newValue[index].display_this_post
    };
    onChange(name, newValue);
  };

  // Handle drag and drop reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = value.findIndex(post => 
        (post.id?.toString() || `temp-${value.indexOf(post)}`) === active.id
      );
      const newIndex = value.findIndex(post => 
        (post.id?.toString() || `temp-${value.indexOf(post)}`) === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const newValue = arrayMove(value, oldIndex, newIndex);
        
        // Update order values to match new positions
        const updatedValue = newValue.map((post, index) => ({
          ...post,
          order: index + 1,
        }));

        onChange(name, updatedValue);

        // Dispatch auto-save event for blog posts
        const autoSaveEvent = new CustomEvent('autoSaveBlogPostChanges', { 
          detail: { 
            type: 'blog_post_reorder',
            updatedPosts: updatedValue 
          }
        });
        window.dispatchEvent(autoSaveEvent);
        console.log('🚀 Auto-save event dispatched for blog post reorder');
      }
    }
  };

  const loadMoreBlogPosts = () => {
    setDisplayCount(prev => prev + 10);
  };

  // Filter blog posts based on search query
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) {
      return value;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return value.filter(post => {
      const title = post.title?.toLowerCase() || '';
      const description = post.description?.toLowerCase() || '';
      
      return title.includes(query) || description.includes(query);
    });
  }, [value, searchQuery]);

  const sortedPosts = filteredPosts.sort((a, b) => (a.order || 0) - (b.order || 0));
  const displayedPosts = sortedPosts.slice(0, displayCount);
  const hasMorePosts = sortedPosts.length > displayCount;

  return (
    <div className="space-y-4">
      {/* Add Form - Only for adding new blog posts - Positioned at top */}
      {isEditing && editingIndex === null && (
        <div className="border border-purple-300 rounded-lg p-4 bg-purple-50 space-y-4">
          <h4 className="text-sm font-medium text-purple-900">
            Add Blog Post
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={editForm.title || ''}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  const newSlug = generateSlug(newTitle);
                  setEditForm(prev => ({ 
                    ...prev, 
                    title: newTitle,
                    slug: newSlug
                  }));
                }}
                placeholder="Enter blog post title"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Slug (URL-friendly name) *
              </label>
              <input
                type="text"
                value={editForm.slug || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="blog-post-slug"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={editForm.description || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the blog post"
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 resize-none"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                value={editForm.content || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Blog post content"
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 resize-none"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.display_this_post === true}
                    onChange={(e) => setEditForm(prev => ({ ...prev, display_this_post: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-xs font-medium text-gray-700">Display this post</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.display_as_blog_post === true}
                    onChange={(e) => setEditForm(prev => ({ ...prev, display_as_blog_post: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-xs font-medium text-gray-700">Display as blog post</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!editForm.title}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Add Post
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500/20"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search Input - Only show when there are blog posts */}
      {value && value.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm p-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDisplayCount(10); // Reset display count when searching
              }}
              placeholder="Search blog posts by title or description..."
              className="w-full px-4 py-3 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 bg-white/90"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDisplayCount(10);
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="mt-2 text-xs text-gray-600">
              Found {filteredPosts.length} blog post{filteredPosts.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </div>
          )}
        </div>
      )}

      {/* Blog Posts List */}
      <div className="space-y-2 max-h-[48rem] overflow-y-auto">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={displayedPosts.map(post => post.id?.toString() || `temp-${sortedPosts.indexOf(post)}`)}
            strategy={verticalListSortingStrategy}
          >
            {displayedPosts.map((post, index) => (
                <SortableBlogPostItem
                  key={`${post.id?.toString() || `temp-${index}`}-${post.title}-${post.order}`}
                  post={post}
                  index={sortedPosts.indexOf(post)} // Use original index for operations
                  onEdit={handleEdit}
                  onToggleVisibility={handleToggleVisibility}
                  isEditing={isEditing}
                  editingIndex={editingIndex}
                  editForm={editForm}
                  setEditForm={setEditForm}
                  handleSave={handleSave}
                  handleCancel={handleCancel}
                  handleDeleteClick={handleDeleteClick}
                  isDragDisabled={isEditing}
                />
              ))
            }
          </SortableContext>
        </DndContext>
        
        {/* Load More Button */}
        {hasMorePosts && (
          <div className="text-center py-4">
            <button
              onClick={loadMoreBlogPosts}
              className="px-4 py-2 text-sm font-medium text-sky-600 bg-sky-50 border border-sky-200 rounded-md hover:bg-sky-100 hover:border-sky-300 transition-colors duration-200"
            >
              Load More Posts (+10)
            </button>
          </div>
        )}

        {/* Empty State Handling */}
        {displayedPosts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? (
              <div>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">No blog posts found</h3>
                <p className="text-xs text-gray-500 mb-3">
                  No blog posts match "{searchQuery}". Try a different search term.
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-purple-600 hover:text-purple-800 underline text-sm"
                >
                  Clear search
                </button>
              </div>
            ) : value.length === 0 ? (
              <div className="max-w-sm mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PlusIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">No blog posts yet</h3>
                <p className="text-xs text-gray-500">
                  Use "Add Post" in the section header to create your first blog post.
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && postToDelete !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Delete Blog Post</h3>
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{truncateText(value[postToDelete]?.title || '', 30)}"?
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
