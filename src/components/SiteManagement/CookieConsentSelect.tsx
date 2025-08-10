'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
// Temporarily use a simple button instead of the Button component to fix compilation
// import Button from '@/ui/Button';
import { useAuth } from '@/context/AuthContext';

interface CookieService {
  id?: number;
  name: string;
  description: string;
  active: boolean;
  category_id?: number;
}

interface CookieCategory {
  id?: number;
  name: string;
  description: string;
  cookie_service: CookieService[];
  organization_id?: string;
}

interface CookieConsentSelectProps {
  value: CookieCategory[];
  onChange: (categories: CookieCategory[]) => void;
  error?: string;
}

interface EditingItem {
  type: 'category' | 'service';
  item: CookieCategory | CookieService;
  parentCategoryId?: number;
  isNew: boolean;
}

export const CookieConsentSelect: React.FC<CookieConsentSelectProps> = ({
  value = [],
  onChange,
  error
}) => {
  const { session } = useAuth();
  const [categories, setCategories] = useState<CookieCategory[]>(value);
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [loading, setLoading] = useState(false);

  // Debug logging
  console.log('🍪 CookieConsentSelect - Received value:', value);
  console.log('🍪 CookieConsentSelect - Categories state:', categories);

  useEffect(() => {
    console.log('🍪 CookieConsentSelect - Setting categories from value:', value);
    // If no categories are provided, show sample data for testing
    if (!value || value.length === 0) {
      console.log('🍪 No cookie categories found, using sample data');
      const sampleCategories: CookieCategory[] = [
        {
          id: 1,
          name: 'Essential Cookies',
          description: 'These cookies are necessary for the website to function properly.',
          cookie_service: [
            {
              id: 1,
              name: 'Session Cookie',
              description: 'Keeps you logged in during your visit',
              active: true,
              category_id: 1
            }
          ]
        },
        {
          id: 2,
          name: 'Analytics Cookies',
          description: 'These cookies help us understand how visitors interact with our website.',
          cookie_service: [
            {
              id: 2,
              name: 'Google Analytics',
              description: 'Tracks website usage and performance',
              active: false,
              category_id: 2
            }
          ]
        }
      ];
      setCategories(sampleCategories);
    } else {
      setCategories(value);
    }
  }, [value]);

  // Since categories are global/read-only, we don't trigger onChange
  // The parent component should handle this as display-only data

  const handleAddCategory = () => {
    alert('Cookie categories are managed globally. Please contact your system administrator to add new categories.');
  };

  const handleEditCategory = (category: CookieCategory) => {
    alert('Cookie categories are managed globally. Please contact your system administrator to edit categories.');
  };

  const handleDeleteCategory = (categoryIndex: number) => {
    alert('Cookie categories are managed globally. Please contact your system administrator to delete categories.');
  };

  const handleAddService = (categoryIndex: number) => {
    alert('Cookie services are managed globally. Please contact your system administrator to add new services.');
  };

  const handleEditService = (categoryIndex: number, serviceIndex: number) => {
    alert('Cookie services are managed globally. Please contact your system administrator to edit services.');
  };

  const handleDeleteService = (categoryIndex: number, serviceIndex: number) => {
    alert('Cookie services are managed globally. Please contact your system administrator to delete services.');
  };

  const isEssentialCategory = (categoryName: string): boolean => {
    return categoryName.toLowerCase().includes('essential') || 
           categoryName.toLowerCase().includes('necessary') ||
           categoryName.toLowerCase().includes('required');
  };

  const getCategoryColor = (category: CookieCategory): string => {
    if (isEssentialCategory(category.name)) {
      return 'border-red-200 bg-red-50';
    }
    return 'border-gray-200 bg-white';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Cookie Consent Categories</h3>
          <p className="text-sm text-gray-500">
            View global cookie categories and services used for GDPR compliance
          </p>
        </div>
        <div className="text-sm text-gray-400 italic">
          Read-only: Managed globally
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {categories.map((category, categoryIndex) => (
          <div
            key={category.id || categoryIndex}
            className={`rounded-lg border-2 p-4 transition-all duration-200 ${getCategoryColor(category)}`}
          >
            {/* Category Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-base font-medium text-gray-900 truncate">
                    {category.name || 'Unnamed Category'}
                  </h4>
                  {isEssentialCategory(category.name) && (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                      Essential
                    </span>
                  )}
                </div>
                {category.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {category.description}
                  </p>
                )}
              </div>
              <div className="flex gap-1 ml-2">
                <button
                  onClick={() => handleEditCategory(category)}
                  className="p-1.5 text-gray-300 hover:text-gray-400 rounded cursor-not-allowed"
                  title="Read-only: Categories managed globally"
                  disabled
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(categoryIndex)}
                  className="p-1.5 text-gray-300 hover:text-gray-400 rounded cursor-not-allowed"
                  title="Read-only: Categories managed globally"
                  disabled
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Services */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Services ({category.cookie_service.length})
                </span>
                <button
                  onClick={() => handleAddService(categoryIndex)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-400 cursor-not-allowed rounded"
                  disabled
                  title="Read-only: Services managed globally"
                >
                  <PlusIcon className="w-3 h-3" />
                  View Services
                </button>
              </div>

              {category.cookie_service.length === 0 ? (
                <div className="text-center py-4 text-gray-400">
                  <Cog6ToothIcon className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm">No services configured</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {category.cookie_service.map((service, serviceIndex) => (
                    <div
                      key={service.id || serviceIndex}
                      className="flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 rounded border"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {service.name || 'Unnamed Service'}
                          </span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full ${
                            service.active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {service.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {service.description && (
                          <p className="text-xs text-gray-600 truncate mt-0.5">
                            {service.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => handleEditService(categoryIndex, serviceIndex)}
                          className="p-1 text-gray-300 hover:text-gray-400 rounded cursor-not-allowed"
                          title="Read-only: Services managed globally"
                          disabled
                        >
                          <PencilIcon className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(categoryIndex, serviceIndex)}
                          className="p-1 text-gray-300 hover:text-gray-400 rounded cursor-not-allowed"
                          title="Read-only: Services managed globally"
                          disabled
                        >
                          <TrashIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            <Cog6ToothIcon className="w-12 h-12 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No Cookie Categories Available</p>
            <p className="text-sm mb-4">Contact your system administrator to configure global cookie categories</p>
          </div>
        )}
      </div>
    </div>
  );
};
