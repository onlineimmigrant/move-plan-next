/**
 * CustomerDetailModal Component
 * 
 * Displays detailed information about a customer including:
 * - Profile information (name, email, location)
 * - Customer data (company, rating, testimonial)
 * - Purchase history
 * 
 * Positioned above ShopModal with higher z-index
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Mail, MapPin, Building2, Star, ShoppingCart, Calendar, User, Phone, Globe, Briefcase, MessageSquare, Award, Package } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useThemeColors } from '@/hooks/useThemeColors';

interface CustomerProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  created_at: string;
  organization_id: string;
  customer: {
    image: string | null;
    rating: number;
    company: string;
    job_title: string;
    pseudonym: string | null;
    description: string;
    is_customer: boolean;
    is_featured: boolean;
    company_logo: string | null;
    linkedin_url: string | null;
    project_type: string;
    display_order: number;
    testimonial_date: string | null;
    testimonial_text: string;
    assigned_sections: string[];
  };
}

interface Purchase {
  id: string;
  purchased_item_id: string;
  transaction_id: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  pricingplan: {
    package: string | null;
    price: number | null;
    currency_symbol: string | null;
    product: {
      product_name: string;
    } | null;
  } | null;
}

interface CustomerDetailModalProps {
  isOpen: boolean;
  customer: CustomerProfile | null;
  onClose: () => void;
}

export default function CustomerDetailModal({ isOpen, customer, onClose }: CustomerDetailModalProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(false);

  const fetchPurchases = useCallback(async () => {
    if (!customer?.id) return;

    try {
      setIsLoadingPurchases(true);
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          id,
          purchased_item_id,
          transaction_id,
          start_date,
          end_date,
          is_active,
          created_at,
          pricingplan:purchased_item_id (
            package,
            price,
            currency_symbol,
            product:product_id (
              product_name
            )
          )
        `)
        .eq('profiles_id', customer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Raw purchase data:', data);
      console.log('First purchase sample:', data?.[0]);
      
      // Transform data - handle both object and array structures from Supabase
      const transformedPurchases = (data || []).map((item: any) => {
        // Supabase might return pricingplan as object or array depending on version
        const pricingplan = Array.isArray(item.pricingplan) 
          ? item.pricingplan[0] 
          : item.pricingplan;
          
        const product = pricingplan?.product
          ? (Array.isArray(pricingplan.product) ? pricingplan.product[0] : pricingplan.product)
          : null;
        
        return {
          id: item.id,
          purchased_item_id: item.purchased_item_id,
          transaction_id: item.transaction_id,
          start_date: item.start_date,
          end_date: item.end_date,
          is_active: item.is_active,
          created_at: item.created_at,
          pricingplan: pricingplan ? {
            package: pricingplan.package,
            price: pricingplan.price,
            currency_symbol: pricingplan.currency_symbol,
            product: product ? { product_name: product.product_name } : null
          } : null
        };
      });
      
      setPurchases(transformedPurchases);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setIsLoadingPurchases(false);
    }
  }, [customer?.id]);

  useEffect(() => {
    if (isOpen && customer) {
      fetchPurchases();
    }
  }, [isOpen, customer, fetchPurchases]);

  // Calculate stats with proper active check
  const stats = {
    totalPurchases: purchases.length,
    activePurchases: purchases.filter(p => {
      const isActive = p.is_active && (!p.end_date || new Date(p.end_date) > new Date());
      return isActive;
    }).length,
    totalSpent: purchases.reduce((sum, p) => sum + ((p.pricingplan?.price || 0) / 100), 0),
    currency: purchases.find(p => p.pricingplan?.currency_symbol)?.pricingplan?.currency_symbol || '$',
  };

  if (!isOpen || !customer) return null;

  return (
    <>
      {/* Modal */}
      <div className="fixed inset-0 md:inset-4 z-[10004] flex items-center justify-center pointer-events-none">
        <div
          className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-6xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="relative px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {customer.customer?.image ? (
                    <img
                      src={customer.customer.image}
                      alt={customer.full_name || 'Customer'}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${primary.base}20` }}
                    >
                      <User className="w-8 h-8" style={{ color: primary.base }} />
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {customer.full_name || customer.username || 'Anonymous'}
                    </h2>
                    {customer.customer?.job_title && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {customer.customer.job_title}
                        {customer.customer?.company && ` at ${customer.customer.company}`}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Featured & Rating Badges */}
              <div className="flex items-center gap-2 mt-3">
                {customer.customer?.is_featured && (
                  <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded-full">
                    Featured Customer
                  </span>
                )}
                {customer.customer?.rating && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {customer.customer.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Contact & Profile Info */}
                <div className="lg:col-span-1 space-y-4">
                  {/* Contact Information */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Mail className="w-4 h-4" style={{ color: primary.base }} />
                      Contact Information
                    </h3>
                    <div className="space-y-3">
                      {customer.email && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                          <p className="text-sm text-gray-900 dark:text-white break-all">{customer.email}</p>
                        </div>
                      )}
                      {customer.customer?.linkedin_url && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">LinkedIn</p>
                          <a
                            href={customer.customer.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm hover:underline"
                            style={{ color: primary.base }}
                          >
                            View Profile
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  {(customer.city || customer.country || customer.postal_code) && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4" style={{ color: primary.base }} />
                        Location
                      </h3>
                      <div className="space-y-1 text-sm text-gray-900 dark:text-white">
                        {customer.city && <p>{customer.city}</p>}
                        {customer.postal_code && <p>{customer.postal_code}</p>}
                        {customer.country && <p>{customer.country}</p>}
                      </div>
                    </div>
                  )}

                  {/* Company Information */}
                  {customer.customer?.company && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4" style={{ color: primary.base }} />
                        Company
                      </h3>
                      <div className="space-y-2">
                        {customer.customer.company_logo && (
                          <img
                            src={customer.customer.company_logo}
                            alt={customer.customer.company}
                            className="h-12 object-contain"
                          />
                        )}
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {customer.customer.company}
                        </p>
                        {customer.customer?.project_type && (
                          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Project Type</p>
                            <p className="text-sm text-gray-900 dark:text-white">{customer.customer.project_type}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Account Stats */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4" style={{ color: primary.base }} />
                      Account Stats
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2 bg-white dark:bg-gray-900 rounded-lg">
                        <p className="text-2xl font-bold" style={{ color: primary.base }}>
                          {stats.totalPurchases}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Orders</p>
                      </div>
                      <div className="text-center p-2 bg-white dark:bg-gray-900 rounded-lg">
                        <p className="text-2xl font-bold" style={{ color: primary.base }}>
                          {stats.activePurchases}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
                      </div>
                      <div className="col-span-2 text-center p-2 bg-white dark:bg-gray-900 rounded-lg">
                        <p className="text-2xl font-bold" style={{ color: primary.base }}>
                          {stats.currency}{stats.totalSpent.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Spent</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Testimonial & Purchases */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Description */}
                  {customer.customer?.description && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" style={{ color: primary.base }} />
                        About
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {customer.customer.description}
                      </p>
                    </div>
                  )}

                  {/* Testimonial */}
                  {customer.customer?.testimonial_text && (
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/30 rounded-xl p-6 border-l-4" style={{ borderColor: primary.base }}>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" style={{ color: primary.base }} />
                        Testimonial
                      </h3>
                      <blockquote className="text-gray-700 dark:text-gray-300 italic mb-3">
                        "{customer.customer.testimonial_text}"
                      </blockquote>
                      {customer.customer?.testimonial_date && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(customer.customer.testimonial_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Purchase History */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" style={{ color: primary.base }} />
                      Purchase History
                    </h3>
                    
                    {isLoadingPurchases ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primary.base }} />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading purchases...</p>
                      </div>
                    ) : purchases.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No purchases yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {purchases.map((purchase) => (
                          <div
                            key={purchase.id}
                            className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                  {purchase.pricingplan?.product?.product_name || 'Unknown Product'}
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {purchase.pricingplan?.package || 'N/A'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-900 dark:text-white">
                                  {purchase.pricingplan?.currency_symbol || '$'}
                                  {((purchase.pricingplan?.price || 0) / 100).toFixed(2)}
                                </p>
                                <span
                                  className={`inline-block px-2 py-0.5 text-xs rounded-full ${(() => {
                                    const isActive = purchase.is_active && (!purchase.end_date || new Date(purchase.end_date) > new Date());
                                    return isActive
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
                                  })()}`}
                                >
                                  {(() => {
                                    const isActive = purchase.is_active && (!purchase.end_date || new Date(purchase.end_date) > new Date());
                                    return isActive ? 'Active' : 'Inactive';
                                  })()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(purchase.created_at).toLocaleDateString()}
                              </div>
                              {purchase.transaction_id && (
                                <div className="flex items-center gap-1">
                                  <span>ID:</span>
                                  <span className="font-mono">{purchase.transaction_id.slice(0, 8)}...</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Customer since {new Date(customer.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg font-medium text-white transition-colors"
                style={{ backgroundColor: primary.base }}
              >
                Close
              </button>
            </div>
          </div>
      </div>
    </>
  );
}
