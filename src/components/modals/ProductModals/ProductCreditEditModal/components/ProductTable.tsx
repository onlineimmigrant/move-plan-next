'use client';

import React, { useState } from 'react';
import { FaTrash, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { Product } from '../types';
import type { PricingPlan } from '@/types/pricingplan';

interface ProductTableProps {
  products: Product[];
  pricingPlansByProduct: Record<number, PricingPlan[]>;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export default function ProductTable({
  products,
  pricingPlansByProduct,
  onEdit,
  onDelete,
  searchQuery,
  onSearchChange,
}: ProductTableProps) {
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  console.log('ProductTable - Products:', products.length);
  console.log('ProductTable - PricingPlansByProduct:', pricingPlansByProduct);
  console.log('ProductTable - Keys:', Object.keys(pricingPlansByProduct));

  const toggleProductExpansion = (productId: string) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const formatPrice = (price?: number, currency?: string) => {
    if (price === undefined || price === null) return 'N/A';
    const symbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
    return `${symbol}${price.toFixed(2)}`;
  };

  const formatInterval = (interval?: string, count?: number) => {
    if (!interval) return 'One-time';
    const countStr = count && count > 1 ? `${count} ` : '';
    return `${countStr}${interval}${count && count > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search products by name..."
          className="w-full px-4 py-2 text-sm border border-slate-200/50 rounded-lg bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
          aria-label="Search products"
        />
      </div>

      {/* Table */}
      {products.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-8">No products found.</p>
      ) : (
        <div className="relative bg-white/30 backdrop-blur-sm rounded-lg border border-slate-200/50">
          <div className="max-h-[500px] overflow-x-auto overflow-y-auto">
            <table className="w-full divide-y divide-slate-200/50">
              <thead className="bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Price/Tax Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Interval/Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50">
                {products.map((product, index) => {
                  const productIdNum = Number(product.id);
                  const isExpanded = expandedProducts.has(product.id);
                  const productPlans = pricingPlansByProduct[productIdNum] || [];
                  const hasPlans = productPlans.length > 0;

                  // Debug logging
                  if (index === 0) {
                    console.log('First product ID (string):', product.id);
                    console.log('First product ID (number):', productIdNum);
                    console.log('Plans for first product:', productPlans);
                  }

                  return (
                    <React.Fragment key={product.id}>
                      {/* Product Row */}
                      <tr
                        className={`transition duration-150 ease-in-out ${
                          index % 2 === 0 ? 'bg-white/30' : 'bg-white/50'
                        } hover:bg-blue-50/50`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            {/* Expand/Collapse Icon */}
                            {hasPlans && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleProductExpansion(product.id);
                                }}
                                className="mr-2 text-gray-500 hover:text-gray-700 transition-colors"
                                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                              >
                                {isExpanded ? (
                                  <FaChevronDown className="h-3 w-3" />
                                ) : (
                                  <FaChevronRight className="h-3 w-3" />
                                )}
                              </button>
                            )}
                            
                            {/* Product Image */}
                            <div className="relative group/img">
                              {product.links_to_image ? (
                                <>
                                  <img
                                    src={Array.isArray(product.links_to_image) ? product.links_to_image[0] : product.links_to_image}
                                    alt={`Image for ${product.product_name}`}
                                    className={`h-8 w-8 ${hasPlans ? 'mr-3' : 'mr-3 ml-7'} rounded object-cover flex-shrink-0`}
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                  />
                                  {/* Unsplash Attribution Tooltip */}
                                  {product.attrs?.unsplash_attribution && (
                                    <div className="absolute left-0 top-full mt-1 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50 opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none">
                                      Photo by{' '}
                                      <a
                                        href={`${product.attrs.unsplash_attribution.photographer_url}?utm_source=codedharmony&utm_medium=referral`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline hover:text-blue-300 pointer-events-auto"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {product.attrs.unsplash_attribution.photographer}
                                      </a>
                                      {' '}on{' '}
                                      <a
                                        href="https://unsplash.com/?utm_source=codedharmony&utm_medium=referral"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline hover:text-blue-300 pointer-events-auto"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        Unsplash
                                      </a>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className={`h-8 w-8 ${hasPlans ? 'mr-3' : 'mr-3 ml-7'} bg-slate-200/50 rounded flex items-center justify-center flex-shrink-0`}>
                                  <span className="text-xs text-gray-400">No img</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Product Name - Clickable to Edit */}
                            <button
                              onClick={() => onEdit(product)}
                              className="text-sm font-medium text-gray-900 min-w-[150px] text-left hover:text-blue-600 transition-colors"
                            >
                              {product.product_name}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-[250px]">
                          <span className="text-sm text-gray-600 block truncate">
                            {product.product_description || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {product.product_tax_code || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              product.is_displayed
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {product.is_displayed ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td
                          className="px-4 py-3 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onDelete(product.id)}
                            className="text-red-600 hover:text-red-700 transition duration-150 ease-in-out p-2"
                            aria-label={`Delete ${product.product_name}`}
                          >
                            <FaTrash className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>

                      {/* Pricing Plan Rows (Nested) */}
                      {isExpanded && productPlans.map((plan, planIndex) => (
                        <tr
                          key={`plan-${plan.id}`}
                          className="bg-blue-50/30 hover:bg-blue-50/50 transition duration-150 ease-in-out"
                        >
                          <td className="px-4 py-2 pl-16 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-700">
                              <span className="font-medium">{plan.package || `Plan ${planIndex + 1}`}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 max-w-[250px]">
                            <span className="text-sm text-gray-600 block truncate">
                              {plan.description || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {formatPrice(plan.price, plan.currency)}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {formatInterval(plan.recurring_interval, plan.recurring_interval_count)}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                plan.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {plan.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 text-xs text-gray-600 bg-white/30 backdrop-blur-sm border-t border-slate-200/50">
            {products.length} {products.length === 1 ? 'product' : 'products'}
          </div>
        </div>
      )}
    </div>
  );
}
