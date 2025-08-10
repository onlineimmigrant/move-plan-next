import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, Bars3Icon, EyeIcon, EyeSlashIcon, ChevronUpDownIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';
import Tooltip from '../Tooltip';
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

// Currency options for the dropdown
interface CurrencyOption {
  name: string;
  value: string;
  symbol: string;
}

const currencyOptions: CurrencyOption[] = [
  { name: 'US Dollar', value: 'USD', symbol: '$' },
  { name: 'Euro', value: 'EUR', symbol: '€' },
  { name: 'British Pound', value: 'GBP', symbol: '£' },
  { name: 'Japanese Yen', value: 'JPY', symbol: '¥' },
  { name: 'Canadian Dollar', value: 'CAD', symbol: 'C$' },
  { name: 'Australian Dollar', value: 'AUD', symbol: 'A$' },
  { name: 'Swiss Franc', value: 'CHF', symbol: 'CHF' },
  { name: 'Chinese Yuan', value: 'CNY', symbol: '¥' },
  { name: 'Indian Rupee', value: 'INR', symbol: '₹' },
  { name: 'South Korean Won', value: 'KRW', symbol: '₩' },
  { name: 'Mexican Peso', value: 'MXN', symbol: 'MX$' },
  { name: 'Brazilian Real', value: 'BRL', symbol: 'R$' },
  { name: 'Russian Ruble', value: 'RUB', symbol: '₽' },
  { name: 'Singapore Dollar', value: 'SGD', symbol: 'S$' },
  { name: 'Hong Kong Dollar', value: 'HKD', symbol: 'HK$' },
];

// Utility function to generate slug from product name
const generateSlug = (productName: string): string => {
  if (!productName) return '';
  
  return productName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Currency Dropdown Component
interface CurrencyDropdownProps {
  value: string;
  onChange: (symbol: string) => void;
  className?: string;
}

const CurrencyDropdown: React.FC<CurrencyDropdownProps> = ({ 
  value, 
  onChange, 
  className = ''
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  const selectedOption = currencyOptions.find(option => option.symbol === value) || currencyOptions[0];
  
  const updateButtonRect = () => {
    if (buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateButtonRect();
      const handleScroll = () => updateButtonRect();
      const handleResize = () => updateButtonRect();
      
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen]);

  const handleChange = (symbol: string) => {
    onChange(symbol);
    setIsOpen(false);
  };

  const dropdownContent = isOpen && buttonRect && createPortal(
    <div
      className="fixed z-[99999] mt-2 max-h-80 overflow-auto rounded-xl bg-white/95 backdrop-blur-sm shadow-2xl border border-gray-200/60"
      style={{
        top: buttonRect.bottom + window.scrollY + 8,
        left: buttonRect.left + window.scrollX,
        width: Math.max(buttonRect.width, 200),
      }}
    >
      <div className="py-2">
        {currencyOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleChange(option.symbol)}
            className={`relative cursor-pointer select-none py-3 px-4 w-full text-left transition-colors duration-200 hover:bg-sky-50/80 hover:text-sky-900 ${
              option.symbol === value ? 'bg-sky-100/60 text-sky-900' : 'text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-50 rounded-md">
                <span className="text-sm font-semibold text-gray-700">
                  {option.symbol}
                </span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{option.name}</div>
                <div className="text-xs text-gray-500">{option.value}</div>
              </div>
              {option.symbol === value && (
                <CheckIcon className="h-4 w-4 text-sky-600" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>,
    document.body
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative cursor-pointer bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm ${className}`}
      >
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-gray-700">{selectedOption.symbol}</span>
          <span className="text-gray-500 text-xs">{selectedOption.value}</span>
        </div>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronUpDownIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
        </span>
      </button>
      {dropdownContent}
    </div>
  );
};

interface Product {
  id?: number;
  product_name: string;
  slug?: string;
  product_description?: string;
  links_to_image?: string;
  order: number;
  is_displayed?: boolean;
  price_manual?: string;
  currency_manual_symbol?: string;
  product_tax_code?: string;
  product_sub_type_id?: number;
  organization_id?: string | null;
  created_at?: string;
  updated_at?: string;
  stripe_product_id?: string;
  attrs?: any;
}

// Sortable Product Item Component
interface SortableProductItemProps {
  product: Product;
  index: number;
  onEdit: (index: number) => void;
  onToggleVisibility: (index: number) => void;
  // Edit form props
  isEditing: boolean;
  editingIndex: number | null;
  editForm: Partial<Product>;
  setEditForm: (form: Partial<Product>) => void;
  handleSave: () => void;
  handleCancel: () => void;
  handleDeleteClick: () => void;
  isDragDisabled?: boolean;
}

function SortableProductItem({
  product,
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
}: SortableProductItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: product.id?.toString() || `temp-${index}`,
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

  // Create tooltip content with all product details
  const tooltipContent = (
    <div className="space-y-1">
      {product.slug && (
        <div><strong>Slug:</strong> /products/{product.slug}</div>
      )}
      {product.product_description && (
        <div><strong>Description:</strong> {product.product_description}</div>
      )}
      {product.price_manual && (
        <div><strong>Price:</strong> {product.currency_manual_symbol}{product.price_manual}</div>
      )}
      {product.order && (
        <div><strong>Order:</strong> {product.order}</div>
      )}
      {product.created_at && (
        <div><strong>Created:</strong> {formatDate(product.created_at)}</div>
      )}
      {product.stripe_product_id && (
        <div><strong>Stripe ID:</strong> {product.stripe_product_id}</div>
      )}
      <div><strong>Status:</strong> {product.is_displayed ? 'Visible' : 'Hidden'}</div>
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
      {/* Main Product Item - Simplified */}
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
                  {truncateText(product.product_name, 15)}
                </span>
                {!product.is_displayed && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600 border border-red-200">
                    <EyeSlashIcon className="h-4 w-4" />
                  </span>
                )}
                {product.stripe_product_id && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-600 border border-purple-200">
                    S
                  </span>
                )}
                {product.price_manual && (
                  <span className="text-xs text-green-600 font-medium">
                    {product.currency_manual_symbol}{product.price_manual}
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
              product.is_displayed 
                ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
            title={product.is_displayed ? 'Hide product' : 'Show product'}
          >
            {product.is_displayed ? (
              <EyeIcon className="h-4 w-4" />
            ) : (
              <EyeSlashIcon className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onEdit(index)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            title="Edit product"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Edit Form - Positioned right under the product item */}
      {isEditing && editingIndex === index && (
        <div className="border-t border-gray-200/60 bg-emerald-50 p-4">
          <h4 className="text-sm font-medium text-emerald-900 mb-3">
            Edit Product
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={editForm.product_name || ''}
                onChange={(e) => {
                  const newProductName = e.target.value;
                  setEditForm({ 
                    ...editForm, 
                    product_name: newProductName,
                    slug: generateSlug(newProductName) // Auto-generate slug
                  });
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g., Premium Learning Course"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Slug
              </label>
              <input
                type="text"
                value={editForm.slug || ''}
                onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50"
                placeholder="e.g., premium-learning-course"
                title="Auto-generated from product name, but can be manually edited"
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
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Price
              </label>
              <div className="flex gap-2">
                <CurrencyDropdown
                  value={editForm.currency_manual_symbol || '$'}
                  onChange={(symbol) => setEditForm({ ...editForm, currency_manual_symbol: symbol })}
                  className="w-20"
                />
                <input
                  type="text"
                  value={editForm.price_manual || ''}
                  onChange={(e) => setEditForm({ ...editForm, price_manual: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="99.00"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  checked={editForm.is_displayed === true}
                  onChange={(e) => setEditForm({ ...editForm, is_displayed: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-xs font-medium text-gray-700">Displayed</span>
              </label>
            </div>

            <div className="md:col-span-2">
              {/* Display image above the Image URL field if URL exists */}
              {editForm.links_to_image && (
                <div className="mb-3">
                  <div className="flex items-center justify-center w-full h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden">
                    <img
                      src={editForm.links_to_image}
                      alt="Product preview"
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden text-gray-400 text-sm text-center p-4">
                      <span>Failed to load image</span>
                    </div>
                  </div>
                </div>
              )}
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={editForm.links_to_image || ''}
                onChange={(e) => setEditForm({ ...editForm, links_to_image: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={editForm.product_description || ''}
                onChange={(e) => setEditForm({ ...editForm, product_description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Brief description of the product..."
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-4">
            {/* Delete button - only show when editing existing product */}
            <div>
              {editingIndex !== null && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="px-3 py-2 text-xs font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/20 flex items-center gap-2"
                  title="Delete this product"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              )}
            </div>
            
            {/* Save/Cancel buttons */}
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
                disabled={!editForm.product_name}
                className="px-3 py-2 text-xs font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingIndex !== null ? 'Update' : 'Add'} Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ProductSelectProps {
  label: string;
  name: string;
  value: Product[];
  onChange: (name: string, value: Product[]) => void;
}

export const ProductSelect: React.FC<ProductSelectProps> = ({
  label,
  name,
  value = [],
  onChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [displayCount, setDisplayCount] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Delete functionality
  const handleDelete = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    // Update order values to be sequential
    const reorderedValue = newValue.map((product, idx) => ({
      ...product,
      order: idx + 1,
    }));
    onChange(name, reorderedValue);
    
    // Dispatch auto-save event for products
    const autoSaveEvent = new CustomEvent('autoSaveProductChanges', { 
      detail: { 
        type: 'product_delete',
        updatedProducts: reorderedValue 
      }
    });
    window.dispatchEvent(autoSaveEvent);
    console.log('🚀 Auto-save event dispatched for product delete');
  };

  const handleDeleteClick = () => {
    if (editingIndex !== null) {
      setProductToDelete(editingIndex);
      setShowDeleteModal(true);
    }
  };

  const handleConfirmDelete = () => {
    if (productToDelete !== null) {
      handleDelete(productToDelete);
      setShowDeleteModal(false);
      setProductToDelete(null);
      setIsEditing(false);
      setEditingIndex(null);
      setEditForm({});
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  const handleAdd = useCallback(() => {
    const nextOrder = Math.max(0, ...value.map(product => product.order || 0)) + 1;
    setEditForm({
      product_name: '',
      slug: '',
      product_description: '',
      links_to_image: '',
      price_manual: '',
      currency_manual_symbol: '$',
      order: nextOrder,
      is_displayed: true
    });
    setEditingIndex(null);
    setIsEditing(true);
  }, [value]);

  // Listen for custom add product event
  useEffect(() => {
    const handleAddProductEvent = () => {
      handleAdd();
    };
    
    window.addEventListener('addProduct', handleAddProductEvent);
    
    return () => {
      window.removeEventListener('addProduct', handleAddProductEvent);
    };
  }, [handleAdd]);

  const handleEdit = (index: number) => {
    setEditForm({ ...value[index] });
    setEditingIndex(index);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editForm.product_name) return;

    const newProduct: Product = {
      ...editForm,
      product_name: editForm.product_name!,
      slug: editForm.slug || '',
      product_description: editForm.product_description || '',
      links_to_image: editForm.links_to_image || '',
      price_manual: editForm.price_manual || '',
      currency_manual_symbol: editForm.currency_manual_symbol || '£',
      order: editForm.order || 1,
      is_displayed: editForm.is_displayed === true
    };

    let newValue: Product[];
    let operationType: string;
    
    if (editingIndex !== null) {
      // Editing existing product - preserve the original ID
      const originalProduct = value[editingIndex];
      newValue = [...value];
      newValue[editingIndex] = {
        ...newProduct,
        id: originalProduct.id, // Preserve the existing ID
        created_at: originalProduct.created_at, // Preserve original creation date
        organization_id: originalProduct.organization_id // Preserve organization ID
      };
      operationType = 'product_edit';
    } else {
      // Adding new product
      newValue = [...value, newProduct];
      operationType = 'product_add';
    }

    onChange(name, newValue);
    
    // Dispatch auto-save event for products
    const autoSaveEvent = new CustomEvent('autoSaveProductChanges', { 
      detail: { 
        type: operationType,
        updatedProducts: newValue 
      }
    });
    window.dispatchEvent(autoSaveEvent);
    console.log('🚀 Auto-save event dispatched for product', operationType);
    
    setIsEditing(false);
    setEditForm({});
    setEditingIndex(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({});
    setEditingIndex(null);
  };

  const handleToggleVisibility = (index: number) => {
    const newValue = [...value];
    newValue[index] = {
      ...newValue[index],
      is_displayed: !newValue[index].is_displayed
    };
    onChange(name, newValue);
    
    // Dispatch auto-save event for products
    const autoSaveEvent = new CustomEvent('autoSaveProductChanges', { 
      detail: { 
        type: 'product_visibility_toggle',
        updatedProducts: newValue 
      }
    });
    window.dispatchEvent(autoSaveEvent);
    console.log('🚀 Auto-save event dispatched for product visibility toggle');
  };

  // Handle drag and drop reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = value.findIndex(product => 
        (product.id?.toString() || `temp-${value.indexOf(product)}`) === active.id
      );
      const newIndex = value.findIndex(product => 
        (product.id?.toString() || `temp-${value.indexOf(product)}`) === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const newValue = arrayMove(value, oldIndex, newIndex);
        
        // Update order values to match new positions
        const updatedValue = newValue.map((product, index) => ({
          ...product,
          order: index + 1,
        }));

        onChange(name, updatedValue);

        // Dispatch auto-save event for products
        const autoSaveEvent = new CustomEvent('autoSaveProductChanges', { 
          detail: { 
            type: 'product_reorder',
            updatedProducts: updatedValue 
          }
        });
        window.dispatchEvent(autoSaveEvent);
        console.log('🚀 Auto-save event dispatched for product reorder');
      }
    }
  };

  const loadMoreProducts = () => {
    setDisplayCount(prev => prev + 10);
  };

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return value;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return value.filter(product => {
      const productName = product.product_name?.toLowerCase() || '';
      const productDescription = product.product_description?.toLowerCase() || '';
      
      return productName.includes(query) || productDescription.includes(query);
    });
  }, [value, searchQuery]);

  const sortedProducts = filteredProducts.sort((a, b) => (a.order || 0) - (b.order || 0));
  const displayedProducts = sortedProducts.slice(0, displayCount);
  const hasMoreProducts = sortedProducts.length > displayCount;

  return (
    <div className="space-y-4">
      {/* Add Form - Only for adding new products - Positioned at top */}
      {isEditing && editingIndex === null && (
        <div className="border border-emerald-300 rounded-lg p-4 bg-emerald-50 space-y-4">
          <h4 className="text-sm font-medium text-emerald-900">
            Add Product
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={editForm.product_name || ''}
                onChange={(e) => {
                  const newProductName = e.target.value;
                  const newSlug = generateSlug(newProductName);
                  setEditForm(prev => ({ 
                    ...prev, 
                    product_name: newProductName,
                    slug: newSlug
                  }));
                }}
                placeholder="Enter product name"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
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
                placeholder="product-slug"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Price *
              </label>
              <input
                type="text"
                value={editForm.price_manual || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, price_manual: e.target.value }))}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Currency *
              </label>
              <CurrencyDropdown
                value={editForm.currency_manual_symbol || '$'}
                onChange={(symbol) => setEditForm(prev => ({ ...prev, currency_manual_symbol: symbol }))}
                className="w-full"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={editForm.product_description || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, product_description: e.target.value }))}
                placeholder="Product description"
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 resize-none"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={editForm.links_to_image || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, links_to_image: e.target.value }))}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!editForm.product_name || !editForm.price_manual || !editForm.currency_manual_symbol}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Add Product
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

      {/* Search Input - Only show when there are products */}
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
              placeholder="Search products by name or description..."
              className="w-full px-4 py-3 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white/90"
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
              Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </div>
          )}
        </div>
      )}

      {/* Products List */}
      <div className="space-y-2 max-h-[48rem] overflow-y-auto">
        {value && value.length > 0 ? (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={displayedProducts.map(product => product.id?.toString() || `temp-${sortedProducts.indexOf(product)}`)}
              strategy={verticalListSortingStrategy}
            >
              {displayedProducts.map((product, index) => (
                  <SortableProductItem
                    key={`${product.id?.toString() || `temp-${index}`}-${product.product_name}-${product.order}`}
                    product={product}
                    index={sortedProducts.indexOf(product)} // Use original index for operations
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
        ) : (
          <div className="text-sm text-gray-500 text-center py-4">
            {searchQuery ? (
              <div>
                <p>No products found matching "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-blue-600 hover:text-blue-800 underline text-sm"
                >
                  Clear search
                </button>
              </div>
            ) : (
              "No products added yet. Use \"Add Product\" in the section header to get started."
            )}
          </div>
        )}

        {/* Load More Button */}
        {hasMoreProducts && (
          <div className="text-center py-4">
            <button
              onClick={loadMoreProducts}
              className="px-4 py-2 text-sm font-medium text-sky-600 bg-sky-50 border border-sky-200 rounded-md hover:bg-sky-100 hover:border-sky-300 transition-colors duration-200"
            >
              Load More Products (+10)
            </button>
          </div>
        )}
        
        {value.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PlusIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">No products yet</h3>
              <p className="text-xs text-gray-500">
                Use "Add Product" in the section header to create your first product.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Product</h3>
                <p className="text-sm text-gray-600">Are you sure you want to delete this product?</p>
              </div>
            </div>
            
            {productToDelete !== null && value[productToDelete] && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-900">
                  {value[productToDelete].product_name}
                </p>
                <p className="text-xs text-gray-600">
                  This action cannot be undone.
                </p>
              </div>
            )}
            
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500/20"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
