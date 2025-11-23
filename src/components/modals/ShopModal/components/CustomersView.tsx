/**
 * CustomersView Component
 * 
 * Displays and manages customer data from profiles table
 * Filters by customer.is_customer = true
 * Part of the Shop modal - Customers tab
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, Search, Mail, MapPin, Building2, Star, Loader2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useSettings } from '@/context/SettingsContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import CustomerDetailModal from '@/components/modals/CustomerDetailModal';

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

interface CustomersViewProps {
  organizationId?: string;
}

export default function CustomersView({ organizationId: propOrgId }: CustomersViewProps = {}) {
  const { settings } = useSettings();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const organizationId = propOrgId || settings.organization_id;
  
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [customerPurchases, setCustomerPurchases] = useState<Record<string, { totalSpent: number; hasActiveOrders: boolean; currency: string; hasPaidOrders: boolean }>>({});
  
  // Filters and Pagination
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'paid' | 'free'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch only actual customers (where customer.is_customer = true)
      // Filter by organization_id
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          email,
          city,
          postal_code,
          country,
          created_at,
          customer,
          organization_id
        `)
        .eq('organization_id', organizationId)
        .not('customer', 'is', null)
        .eq('customer->>is_customer', 'true')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setCustomers(data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  const fetchCustomerPurchases = useCallback(async () => {
    if (!organizationId) return;

    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          profiles_id,
          is_active,
          end_date,
          pricingplan:purchased_item_id (
            price,
            currency_symbol
          )
        `)
        .eq('organization_id', organizationId);

      if (error) throw error;

      // Calculate stats per customer
      const stats: Record<string, { totalSpent: number; hasActiveOrders: boolean; currency: string; hasPaidOrders: boolean }> = {};
      
      (data || []).forEach((purchase: any) => {
        const customerId = purchase.profiles_id;
        if (!stats[customerId]) {
          stats[customerId] = { totalSpent: 0, hasActiveOrders: false, currency: '$', hasPaidOrders: false };
        }

        const pricingplan = Array.isArray(purchase.pricingplan) ? purchase.pricingplan[0] : purchase.pricingplan;
        const price = pricingplan?.price || 0;
        const currency = pricingplan?.currency_symbol || '$';
        
        // Check if order is truly active (not expired)
        const isActive = purchase.is_active && (!purchase.end_date || new Date(purchase.end_date) > new Date());
        
        stats[customerId].totalSpent += price / 100;
        stats[customerId].currency = currency;
        if (isActive) {
          stats[customerId].hasActiveOrders = true;
        }
        if (price > 0) {
          stats[customerId].hasPaidOrders = true;
        }
      });

      setCustomerPurchases(stats);
    } catch (error) {
      console.error('Error fetching customer purchases:', error);
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
      fetchCustomers();
      fetchCustomerPurchases();
    }
  }, [organizationId, fetchCustomers, fetchCustomerPurchases]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        customer.full_name?.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.customer?.company?.toLowerCase().includes(query) ||
        customer.customer?.job_title?.toLowerCase().includes(query)
      );
      
      if (!matchesSearch) return false;
      
      // Status filter
      const stats = customerPurchases[customer.id] || { totalSpent: 0, hasActiveOrders: false, currency: '$', hasPaidOrders: false };
      if (statusFilter === 'active' && !stats.hasActiveOrders) return false;
      if (statusFilter === 'inactive' && stats.hasActiveOrders) return false;
      
      // Type filter
      if (typeFilter === 'paid' && !stats.hasPaidOrders) return false;
      if (typeFilter === 'free' && stats.hasPaidOrders) return false;
      
      return true;
    });
  }, [customers, searchQuery, statusFilter, typeFilter, customerPurchases]);
  
  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCustomers, currentPage]);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter, searchQuery]);

  const handleCustomerClick = useCallback((customer: CustomerProfile) => {
    setSelectedCustomer(customer);
    setIsDetailModalOpen(true);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedCustomer(null);
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading customers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <Users className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Customers
          </h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchCustomers}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Customers Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Customers will appear here once they make a purchase or sign up.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header with Search */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customers by name, email, or company..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'}
          </div>
        </div>
      </div>

      {/* Customers List */}
      <div className="flex-1 overflow-y-auto px-6 py-4" style={{ paddingBottom: '160px' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedCustomers.map((customer) => {
            const stats = customerPurchases[customer.id] || { totalSpent: 0, hasActiveOrders: false, currency: '$', hasPaidOrders: false };
            const hasNoActiveOrders = !stats.hasActiveOrders;
            
            return (
            <div
              key={customer.id}
              onClick={() => handleCustomerClick(customer)}
              className={`rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] ${
                hasNoActiveOrders 
                  ? 'bg-gray-100 dark:bg-gray-800/50' 
                  : 'bg-white dark:bg-gray-800'
              }`}
            >
              {/* Customer Header */}
              <div className="flex items-start gap-3 mb-3">
                {customer.customer?.image ? (
                  <img
                    src={customer.customer.image}
                    alt={customer.full_name || 'Customer'}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                    {customer.full_name || customer.username || 'Anonymous'}
                  </h4>
                  {customer.customer?.job_title && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {customer.customer.job_title}
                    </p>
                  )}
                  {customer.customer?.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {customer.customer.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
                {customer.customer?.is_featured && (
                  <div className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded-full">
                    Featured
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div className="space-y-2 text-sm">
                {customer.email && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                {customer.customer?.company && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Building2 className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{customer.customer.company}</span>
                  </div>
                )}
                {(customer.city || customer.country) && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">
                      {[customer.city, customer.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
                {customer.customer?.project_type && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Project: {customer.customer.project_type}
                    </span>
                  </div>
                )}
              </div>

              {/* Testimonial Preview */}
              {customer.customer?.testimonial_text && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 italic line-clamp-2">
                    "{customer.customer.testimonial_text}"
                  </p>
                </div>
              )}

              {/* Total Spent and Status */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Total Spent</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {stats.currency}{stats.totalSpent.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Status</span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      stats.hasActiveOrders
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {stats.hasActiveOrders ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      </div>

      {/* Bottom Toolbar - Fixed with Rounded Bottom */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-b-2xl z-10">
        {/* Main Controls Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between px-5 py-3 gap-3">
          {/* Left: Filters Button (Full width on mobile) */}
          <div className="flex flex-col sm:flex-row gap-2 md:flex-1">
            {/* Filters Button */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm border w-full sm:w-auto"
              style={{ 
                color: isFilterOpen ? 'white' : primary.base,
                background: isFilterOpen 
                  ? `linear-gradient(135deg, ${primary.base}, ${primary.hover})` 
                  : 'white',
                borderColor: isFilterOpen ? primary.base : '#e5e7eb',
              }}
            >
              <SlidersHorizontal className="h-5 w-5" />
              <span>Filters</span>
              <span 
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: isFilterOpen ? 'rgba(255,255,255,0.25)' : '#f3f4f6',
                  color: isFilterOpen ? 'white' : primary.base,
                }}
              >
                {filteredCustomers.length}/{customers.length}
              </span>
              {isFilterOpen ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Right: Pagination (Full width on mobile below buttons) */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 md:justify-end">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 dark:border-gray-600"
                style={{ 
                  color: currentPage === 1 ? '#9ca3af' : primary.base,
                  backgroundColor: 'white',
                }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[80px] text-center">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 dark:border-gray-600"
                style={{ 
                  color: currentPage === totalPages ? '#9ca3af' : primary.base,
                  backgroundColor: 'white',
                }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Filters Accordion */}
        {isFilterOpen && (
          <div className="fixed left-0 right-0 bottom-[160px] md:bottom-[72px] border-t border-gray-200 dark:border-gray-700 bg-white/98 dark:bg-gray-800/98 backdrop-blur-md rounded-t-2xl shadow-2xl z-20">
            <div className="p-6 space-y-4 min-h-[50vh] max-h-[50vh] md:min-h-[600px] md:max-h-[600px] overflow-y-auto">
              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Customer Status
                </label>
                <div className="flex gap-2 overflow-x-auto">
                  {[
                    { id: 'all' as const, label: 'All Customers', count: customers.length },
                    { id: 'active' as const, label: 'Active', count: customers.filter(c => customerPurchases[c.id]?.hasActiveOrders).length },
                    { id: 'inactive' as const, label: 'Inactive', count: customers.filter(c => !customerPurchases[c.id]?.hasActiveOrders).length },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setStatusFilter(filter.id)}
                      onMouseEnter={() => setHoveredFilter(filter.id)}
                      onMouseLeave={() => setHoveredFilter(null)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex-shrink-0"
                      style={
                        statusFilter === filter.id
                          ? {
                              background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                              color: 'white',
                              boxShadow: hoveredFilter === filter.id 
                                ? `0 4px 12px ${primary.base}40` 
                                : `0 2px 4px ${primary.base}30`,
                            }
                          : {
                              backgroundColor: 'transparent',
                              color: hoveredFilter === filter.id ? primary.hover : primary.base,
                              borderWidth: '1px',
                              borderStyle: 'solid',
                              borderColor: hoveredFilter === filter.id ? `${primary.base}80` : `${primary.base}40`,
                            }
                      }
                    >
                      <span>{filter.label}</span>
                      <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-semibold ${
                        statusFilter === filter.id
                          ? 'bg-white/25 text-white'
                          : filter.id === 'active'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : filter.id === 'inactive'
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                        {filter.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Customer Type
                </label>
                <div className="flex gap-2 overflow-x-auto">
                  {[
                    { id: 'all' as const, label: 'All Types', count: customers.length },
                    { id: 'paid' as const, label: 'Paid', count: customers.filter(c => customerPurchases[c.id]?.hasPaidOrders).length },
                    { id: 'free' as const, label: 'Free', count: customers.filter(c => !customerPurchases[c.id]?.hasPaidOrders).length },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setTypeFilter(filter.id)}
                      onMouseEnter={() => setHoveredFilter(`type-${filter.id}`)}
                      onMouseLeave={() => setHoveredFilter(null)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex-shrink-0"
                      style={
                        typeFilter === filter.id
                          ? {
                              background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                              color: 'white',
                              boxShadow: hoveredFilter === `type-${filter.id}` 
                                ? `0 4px 12px ${primary.base}40` 
                                : `0 2px 4px ${primary.base}30`,
                            }
                          : {
                              backgroundColor: 'transparent',
                              color: hoveredFilter === `type-${filter.id}` ? primary.hover : primary.base,
                              borderWidth: '1px',
                              borderStyle: 'solid',
                              borderColor: hoveredFilter === `type-${filter.id}` ? `${primary.base}80` : `${primary.base}40`,
                            }
                      }
                    >
                      <span>{filter.label}</span>
                      <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-semibold ${
                        typeFilter === filter.id
                          ? 'bg-white/25 text-white'
                          : filter.id === 'paid'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                        {filter.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset Button */}
              {(statusFilter !== 'all' || typeFilter !== 'all') && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setTypeFilter('all');
                    }}
                    className="w-full px-4 py-2.5 rounded-lg font-medium transition-all duration-200 border"
                    style={{
                      color: primary.base,
                      borderColor: `${primary.base}40`,
                      backgroundColor: 'transparent',
                    }}
                  >
                    Reset All Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        isOpen={isDetailModalOpen}
        customer={selectedCustomer}
        onClose={handleCloseDetailModal}
      />
    </div>
  );
}
