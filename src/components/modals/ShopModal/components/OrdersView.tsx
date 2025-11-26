/**
 * OrdersView Component
 * 
 * Displays and manages purchase/order data
 * Filters by organization_id from settings
 * Part of the Shop modal - Orders tab
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ShoppingCart, Search, User, Calendar, CheckCircle, XCircle, Clock, Loader2, Package, ChevronDown, ChevronUp, SlidersHorizontal, ChevronLeft, ChevronRight, BarChart3, BarChart, TrendingUp, Table as TableIcon, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useSettings } from '@/context/SettingsContext';
import { useThemeColors } from '@/hooks/useThemeColors';

interface Purchase {
  id: string;
  purchased_item_id: string;
  profiles_id: string;
  transaction_id: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  organization_id: string;
  // Joined data
  profile: {
    full_name: string | null;
    email: string | null;
    username: string | null;
  } | null;
  pricingplan: {
    id: number;
    package: string | null;
    price: number | null;
    description: string | null;
    measure: string | null;
    currency_symbol: string | null;
    product: {
      id: number;
      product_name: string;
    } | null;
  } | null;
}

interface OrdersViewProps {
  organizationId?: string;
}

export default function OrdersView({ organizationId: propOrgId }: OrdersViewProps = {}) {
  const { settings } = useSettings();
  const organizationId = propOrgId || settings.organization_id;
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [showFiltersAccordion, setShowFiltersAccordion] = useState(false);
  const [showRevenueAccordion, setShowRevenueAccordion] = useState(false);
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'product' | 'customer' | 'revenue'>('date');
  
  // Revenue period selection
  const [selectedPeriod, setSelectedPeriod] = useState<'date' | 'week' | 'month' | 'year' | 'all' | 'custom'>('all');
  const [selectedDate, setSelectedDate] = useState<string>(''); // For 'date' mode
  const [selectedWeek, setSelectedWeek] = useState<string>(''); // For 'week' mode (start of week)
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // For 'month' mode (YYYY-MM)
  const [selectedYear, setSelectedYear] = useState<string>(''); // For 'year' mode (YYYY)
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  
  // Load more state for revenue lists
  const [visibleProductsCount, setVisibleProductsCount] = useState(5);
  const [visibleCustomersCount, setVisibleCustomersCount] = useState(5);
  
  // Visualization type
  const [visualizationType, setVisualizationType] = useState<'bar' | 'column' | 'line' | 'area' | 'table'>('bar');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchPurchases = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Single optimized query with joins - much faster than multiple queries
      const { data, error: fetchError } = await supabase
        .from('purchases')
        .select(`
          id,
          purchased_item_id,
          profiles_id,
          transaction_id,
          start_date,
          end_date,
          is_active,
          created_at,
          organization_id,
          profiles:profiles_id (
            full_name,
            email,
            username
          ),
          pricingplan:purchased_item_id (
            id,
            package,
            price,
            description,
            measure,
            currency_symbol,
            product:product_id (
              id,
              product_name
            )
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Supabase error:', fetchError);
        throw fetchError;
      }

      // Transform data - Supabase returns joined objects directly
      const transformedData = (data || []).map(item => {
        const profiles = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
        const pricingplan = Array.isArray(item.pricingplan) ? item.pricingplan[0] : item.pricingplan;
        
        return {
          id: item.id,
          purchased_item_id: item.purchased_item_id,
          profiles_id: item.profiles_id,
          transaction_id: item.transaction_id,
          start_date: item.start_date,
          end_date: item.end_date,
          is_active: item.is_active,
          created_at: item.created_at,
          organization_id: item.organization_id,
          profile: profiles || null,
          pricingplan: pricingplan ? {
            ...pricingplan,
            product: Array.isArray(pricingplan.product) ? pricingplan.product[0] : pricingplan.product
          } : null
        };
      });

      setPurchases(transformedData);
    } catch (err) {
      console.error('Error fetching purchases:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
      fetchPurchases();
    }
  }, [organizationId, fetchPurchases]);

  const filteredPurchases = useMemo(() => {
    const filtered = purchases.filter(purchase => {
      // Status filter
      if (filterStatus === 'active' && !purchase.is_active) return false;
      if (filterStatus === 'expired' && purchase.is_active) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          purchase.profile?.full_name?.toLowerCase().includes(query) ||
          purchase.profile?.email?.toLowerCase().includes(query) ||
          purchase.pricingplan?.package?.toLowerCase().includes(query) ||
          purchase.pricingplan?.product?.product_name?.toLowerCase().includes(query) ||
          purchase.transaction_id?.toLowerCase().includes(query)
        );
      }

      return true;
    });

    // Sort based on sortBy
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'product':
          const productA = a.pricingplan?.product?.product_name || '';
          const productB = b.pricingplan?.product?.product_name || '';
          return productA.localeCompare(productB);
        case 'customer':
          const customerA = a.profile?.full_name || a.profile?.username || '';
          const customerB = b.profile?.full_name || b.profile?.username || '';
          return customerA.localeCompare(customerB);
        case 'revenue':
          const priceA = (a.pricingplan?.price || 0) / 100;
          const priceB = (b.pricingplan?.price || 0) / 100;
          return priceB - priceA; // Highest first
        default:
          return 0;
      }
    });

    return filtered;
  }, [purchases, searchQuery, filterStatus, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);
  const paginatedPurchases = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPurchases.slice(startIndex, endIndex);
  }, [filteredPurchases, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const stats = useMemo(() => {
    return {
      total: purchases.length,
      active: purchases.filter(p => p.is_active).length,
      expired: purchases.filter(p => !p.is_active).length,
      revenue: purchases
        .filter(p => p.is_active)
        .reduce((sum, p) => sum + ((p.pricingplan?.price || 0) / 100), 0),
      currency: purchases.find(p => p.pricingplan?.currency_symbol)?.pricingplan?.currency_symbol || '$'
    };
  }, [purchases]);

  // Helper function to filter purchases by selected period - must be defined before use
  const filterByPeriod = useMemo(() => {
    return (purchasesList: Purchase[]) => {
      const now = new Date();
      
      return purchasesList.filter(purchase => {
        if (!purchase.is_active) return false;
        
        const createdAt = new Date(purchase.created_at);
        
        switch (selectedPeriod) {
          case 'date':
            if (!selectedDate) return true;
            const targetDate = new Date(selectedDate);
            return createdAt.toDateString() === targetDate.toDateString();
            
          case 'week':
            if (!selectedWeek) return true;
            const weekStart = new Date(selectedWeek);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            return createdAt >= weekStart && createdAt <= weekEnd;
            
          case 'month':
            if (!selectedMonth) return true;
            const [year, month] = selectedMonth.split('-').map(Number);
            return createdAt.getMonth() === (month - 1) && createdAt.getFullYear() === year;
            
          case 'year':
            if (!selectedYear) return true;
            return createdAt.getFullYear() === parseInt(selectedYear);
            
          case 'custom':
            if (!customStartDate || !customEndDate) return true;
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999); // Include full end date
            return createdAt >= start && createdAt <= end;
            
          case 'all':
          default:
            return true;
        }
      });
    };
  }, [selectedPeriod, selectedDate, selectedWeek, selectedMonth, selectedYear, customStartDate, customEndDate]);

  // Revenue analytics by product (filtered by selected period)
  const revenueByProduct = useMemo(() => {
    const productRevenue: Record<string, { revenue: number; count: number; currency: string }> = {};
    
    const filtered = filterByPeriod(purchases);
    
    filtered.forEach(purchase => {
      const productName = purchase.pricingplan?.product?.product_name || 'Unknown';
      const revenue = (purchase.pricingplan?.price || 0) / 100;
      const currency = purchase.pricingplan?.currency_symbol || '$';
      
      if (!productRevenue[productName]) {
        productRevenue[productName] = { revenue: 0, count: 0, currency };
      }
      productRevenue[productName].revenue += revenue;
      productRevenue[productName].count += 1;
    });
    
    return Object.entries(productRevenue)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 10); // Top 10 products
  }, [purchases, selectedPeriod, selectedDate, selectedWeek, selectedMonth, selectedYear, customStartDate, customEndDate, filterByPeriod]);

  // Revenue analytics by customer (filtered by selected period)
  const revenueByCustomer = useMemo(() => {
    const customerRevenue: Record<string, { revenue: number; count: number; currency: string }> = {};
    
    const filtered = filterByPeriod(purchases);
    
    filtered.forEach(purchase => {
      const customerName = purchase.profile?.full_name || purchase.profile?.username || 'Unknown';
      const revenue = (purchase.pricingplan?.price || 0) / 100;
      const currency = purchase.pricingplan?.currency_symbol || '$';
      
      if (!customerRevenue[customerName]) {
        customerRevenue[customerName] = { revenue: 0, count: 0, currency };
      }
      customerRevenue[customerName].revenue += revenue;
      customerRevenue[customerName].count += 1;
    });
    
    return Object.entries(customerRevenue)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 10); // Top 10 customers
  }, [purchases, selectedPeriod, selectedDate, selectedWeek, selectedMonth, selectedYear, customStartDate, customEndDate, filterByPeriod]);

  // Revenue analytics by period
  const revenueByPeriod = useMemo(() => {
    const now = new Date();
    const periods = {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      thisYear: 0,
      allTime: 0,
    };
    
    purchases.filter(p => p.is_active).forEach(purchase => {
      const revenue = (purchase.pricingplan?.price || 0) / 100;
      const createdAt = new Date(purchase.created_at);
      
      periods.allTime += revenue;
      
      // Today
      if (createdAt.toDateString() === now.toDateString()) {
        periods.today += revenue;
      }
      
      // This week
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      if (createdAt >= weekAgo) {
        periods.thisWeek += revenue;
      }
      
      // This month
      if (createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()) {
        periods.thisMonth += revenue;
      }
      
      // This year
      if (createdAt.getFullYear() === now.getFullYear()) {
        periods.thisYear += revenue;
      }
    });
    
    return periods;
  }, [purchases]);

  // Get current period revenue based on selection
  const currentPeriodRevenue = useMemo(() => {
    const filtered = filterByPeriod(purchases);
    return filtered.reduce((sum, p) => sum + ((p.pricingplan?.price || 0) / 100), 0);
  }, [purchases, selectedPeriod, selectedDate, selectedWeek, selectedMonth, selectedYear, customStartDate, customEndDate, filterByPeriod]);

  // Revenue trend data for visualization
  const revenueTrendData = useMemo(() => {
    const filtered = filterByPeriod(purchases);
    const trendMap: Record<string, number> = {};
    
    filtered.forEach(purchase => {
      const date = new Date(purchase.created_at);
      let key: string;
      
      // Group by appropriate time unit based on selected period
      switch (selectedPeriod) {
        case 'date':
          key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          break;
        case 'week':
          key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          break;
        case 'month':
          key = date.toLocaleDateString('en-US', { day: 'numeric' });
          break;
        case 'year':
          key = date.toLocaleDateString('en-US', { month: 'short' });
          break;
        case 'custom':
          const daysDiff = customStartDate && customEndDate 
            ? Math.ceil((new Date(customEndDate).getTime() - new Date(customStartDate).getTime()) / (1000 * 60 * 60 * 24))
            : 0;
          if (daysDiff <= 31) {
            key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          } else if (daysDiff <= 365) {
            key = date.toLocaleDateString('en-US', { month: 'short' });
          } else {
            key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          }
          break;
        case 'all':
        default:
          key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          break;
      }
      
      if (!trendMap[key]) {
        trendMap[key] = 0;
      }
      trendMap[key] += (purchase.pricingplan?.price || 0) / 100;
    });
    
    const entries = Object.entries(trendMap).sort((a, b) => {
      // Sort chronologically
      return 0; // Will be sorted by creation order
    });
    
    const maxRevenue = Math.max(...entries.map(([, revenue]) => revenue), 1);
    
    return {
      entries,
      maxRevenue,
      isEmpty: entries.length === 0
    };
  }, [purchases, selectedPeriod, selectedDate, selectedWeek, selectedMonth, selectedYear, customStartDate, customEndDate, filterByPeriod]);

  // Helper to format date for grouping
  const formatDateGroup = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = date.toDateString();
    const todayOnly = today.toDateString();
    const yesterdayOnly = yesterday.toDateString();

    if (dateOnly === todayOnly) return 'Today';
    if (dateOnly === yesterdayOnly) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <ShoppingCart className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Orders
          </h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchPurchases}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <ShoppingCart className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Orders Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Orders will appear here once customers make purchases.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden pb-28">
      {/* Search Bar */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, product, plan, or transaction ID..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Orders List with Date Grouping */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {paginatedPurchases.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || filterStatus !== 'all' 
                ? 'No orders found matching your filters' 
                : 'No orders yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedPurchases.map((purchase, index) => {
              const isExpanded = expandedOrderId === purchase.id;
              
              // Check if this is a new date group
              const currentDateGroup = formatDateGroup(purchase.created_at);
              const previousDateGroup = index > 0 ? formatDateGroup(paginatedPurchases[index - 1].created_at) : null;
              const isNewDateGroup = currentDateGroup !== previousDateGroup;

              return (
                <React.Fragment key={purchase.id}>
                  {/* Date Divider */}
                  {(index === 0 || isNewDateGroup) && (
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
                      <div 
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{ 
                          backgroundColor: `${primary.base}15`,
                          color: primary.base,
                        }}
                      >
                        {currentDateGroup}
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
                    </div>
                  )}

                  {/* Order Accordion Card */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 transition-all overflow-hidden">
                    {/* Accordion Header - Always Visible */}
                    <div
                      className="flex items-center gap-3 p-4 cursor-pointer transition-colors"
                      style={{ 
                        backgroundColor: isExpanded ? `${primary.base}15` : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!isExpanded) {
                          e.currentTarget.style.backgroundColor = `${primary.base}10`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isExpanded) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                      onClick={() => setExpandedOrderId(isExpanded ? null : purchase.id)}
                    >
                      {/* Left: Product & Customer Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="w-4 h-4 flex-shrink-0" style={{ color: primary.base }} />
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                            {purchase.pricingplan?.product?.product_name || 'Unknown Product'}
                          </h4>
                          {purchase.is_active ? (
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <User className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            {purchase.profile?.full_name || purchase.profile?.username || 'Unknown'}
                          </span>
                        </div>
                      </div>

                      {/* Right: Price & Expand Icon */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-bold text-gray-900 dark:text-white">
                            {purchase.pricingplan?.currency_symbol || '$'}
                            {((purchase.pricingplan?.price || 0) / 100).toFixed(2)}
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                          style={{ color: isExpanded ? primary.base : '#9ca3af' }}
                        />
                      </div>
                    </div>

                    {/* Accordion Content - Expandable */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="pt-4 space-y-3">
                          {/* Plan Details */}
                          {purchase.pricingplan?.package && (
                            <div className="text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Plan:</span>
                              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                {purchase.pricingplan.package}
                                {purchase.pricingplan.measure && ` - ${purchase.pricingplan.measure}`}
                              </span>
                            </div>
                          )}

                          {/* Customer Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Customer:</span>
                              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                {purchase.profile?.full_name || purchase.profile?.username || 'Unknown'}
                              </span>
                            </div>
                            {purchase.profile?.email && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Email:</span>
                                <span className="ml-2 font-medium text-gray-900 dark:text-white truncate">
                                  {purchase.profile.email}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Dates */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Start Date:</span>
                              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                {new Date(purchase.start_date).toLocaleDateString()}
                              </span>
                            </div>
                            {purchase.end_date && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">End Date:</span>
                                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                  {new Date(purchase.end_date).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Transaction ID */}
                          {purchase.transaction_id && (
                            <div className="text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Transaction ID:</span>
                              <span className="ml-2 font-mono text-xs text-gray-900 dark:text-white">
                                {purchase.transaction_id}
                              </span>
                            </div>
                          )}

                          {/* Description */}
                          {purchase.pricingplan?.description && (
                            <div className="text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                              <span className="text-gray-500 dark:text-gray-400">Description:</span>
                              <p className="mt-1 text-gray-900 dark:text-white text-xs">
                                {purchase.pricingplan.description}
                              </p>
                            </div>
                          )}

                          {/* Status Badge */}
                          <div className="pt-2">
                            {purchase.is_active ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full font-medium">
                                <CheckCircle className="w-3 h-3" />
                                Active Subscription
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full font-medium">
                                <XCircle className="w-3 h-3" />
                                Expired
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Toolbar - Fixed with Rounded Bottom */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-b-2xl z-10">
        {/* Main Controls Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between px-5 py-3 gap-3">
          {/* Left: Filters & Revenue Buttons (Full width on mobile) */}
          <div className="flex flex-col sm:flex-row gap-2 md:flex-1">
            {/* Filters Button */}
            <button
              onClick={() => {
                setShowFiltersAccordion(!showFiltersAccordion);
                if (showRevenueAccordion) setShowRevenueAccordion(false);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm border w-full sm:w-auto"
              style={{ 
                color: showFiltersAccordion ? 'white' : primary.base,
                background: showFiltersAccordion 
                  ? `linear-gradient(135deg, ${primary.base}, ${primary.hover})` 
                  : 'white',
                borderColor: showFiltersAccordion ? primary.base : '#e5e7eb',
              }}
            >
              <SlidersHorizontal className="h-5 w-5" />
              <span>Filters</span>
              <span 
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: showFiltersAccordion ? 'rgba(255,255,255,0.25)' : '#f3f4f6',
                  color: showFiltersAccordion ? 'white' : primary.base,
                }}
              >
                {filteredPurchases.length}/{purchases.length}
              </span>
              {showFiltersAccordion ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>

            {/* Revenue/Sort Button */}
            <button
              onClick={() => {
                setShowRevenueAccordion(!showRevenueAccordion);
                if (showFiltersAccordion) setShowFiltersAccordion(false);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm border w-full sm:w-auto"
              style={{ 
                color: showRevenueAccordion ? 'white' : primary.base,
                background: showRevenueAccordion 
                  ? `linear-gradient(135deg, ${primary.base}, ${primary.hover})` 
                  : 'white',
                borderColor: showRevenueAccordion ? primary.base : '#e5e7eb',
              }}
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Revenue</span>
              <span 
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: showRevenueAccordion ? 'rgba(255,255,255,0.25)' : '#f3f4f6',
                  color: showRevenueAccordion ? 'white' : primary.base,
                }}
              >
                {stats.currency}{stats.revenue.toFixed(2)}
              </span>
              {showRevenueAccordion ? (
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
        {showFiltersAccordion && (
          <div className="fixed left-0 right-0 bottom-[160px] md:bottom-[72px] border-t border-gray-200 dark:border-gray-700 bg-white/98 dark:bg-gray-800/98 backdrop-blur-md rounded-t-2xl shadow-2xl z-20">
            <div className="p-6 space-y-4 min-h-[50vh] max-h-[50vh] md:min-h-[600px] md:max-h-[600px] overflow-y-auto">
            {/* Filter by Status */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Order Status
              </label>
              <div className="flex gap-2 overflow-x-auto">
                {[
                  { id: 'all' as const, label: 'All Orders', count: stats.total },
                  { id: 'active' as const, label: 'Active', count: stats.active },
                  { id: 'expired' as const, label: 'Expired', count: stats.expired },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setFilterStatus(filter.id)}
                    onMouseEnter={() => setHoveredFilter(filter.id)}
                    onMouseLeave={() => setHoveredFilter(null)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex-shrink-0"
                    style={
                      filterStatus === filter.id
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
                      filterStatus === filter.id
                        ? 'bg-white/25 text-white'
                        : filter.id === 'active'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        : filter.id === 'expired'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                      {filter.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Sort Orders By
              </label>
              <div className="flex gap-2 overflow-x-auto">
                {[
                  { id: 'date' as const, label: 'Date (Newest)', icon: Calendar },
                  { id: 'product' as const, label: 'Product', icon: Package },
                  { id: 'customer' as const, label: 'Customer', icon: User },
                  { id: 'revenue' as const, label: 'Amount (High-Low)', icon: ShoppingCart },
                ].map((sort) => {
                  const Icon = sort.icon;
                  return (
                    <button
                      key={sort.id}
                      onClick={() => setSortBy(sort.id)}
                      onMouseEnter={() => setHoveredFilter(`sort-${sort.id}`)}
                      onMouseLeave={() => setHoveredFilter(null)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex-shrink-0"
                      style={
                        sortBy === sort.id
                          ? {
                              background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                              color: 'white',
                              boxShadow: hoveredFilter === `sort-${sort.id}` 
                                ? `0 4px 12px ${primary.base}40` 
                                : `0 2px 4px ${primary.base}30`,
                            }
                          : {
                              backgroundColor: 'transparent',
                              color: hoveredFilter === `sort-${sort.id}` ? primary.hover : primary.base,
                              borderWidth: '1px',
                              borderStyle: 'solid',
                              borderColor: hoveredFilter === `sort-${sort.id}` ? `${primary.base}80` : `${primary.base}40`,
                            }
                      }
                    >
                      <Icon className="w-4 h-4" />
                      <span>{sort.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            </div>
          </div>
        )}

        {/* Revenue Accordion */}
        {showRevenueAccordion && (
          <div className="fixed left-0 right-0 bottom-[160px] md:bottom-[72px] border-t border-gray-200 dark:border-gray-700 bg-white/98 dark:bg-gray-800/98 backdrop-blur-md rounded-t-2xl shadow-2xl z-20">
            <div className="p-6 space-y-4 min-h-[50vh] max-h-[50vh] md:min-h-[600px] md:max-h-[600px] overflow-y-auto">
            {/* Revenue by Period */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" style={{ color: primary.base }} />
                Select Period
              </h4>
              
              {/* Period Type Selection */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                {[
                  { id: 'date' as const, label: 'Date', icon: Calendar },
                  { id: 'week' as const, label: 'Week', icon: Calendar },
                  { id: 'month' as const, label: 'Month', icon: Calendar },
                  { id: 'year' as const, label: 'Year', icon: Calendar },
                  { id: 'all' as const, label: 'All Time', icon: Clock },
                  { id: 'custom' as const, label: 'Custom', icon: Calendar },
                ].map((period) => (
                  <button
                    key={period.id}
                    onClick={() => setSelectedPeriod(period.id)}
                    className="group relative p-4 rounded-xl border-2 text-center transition-all duration-300 flex flex-col items-center gap-2 hover:scale-105"
                    style={
                      selectedPeriod === period.id
                        ? {
                            background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                            borderColor: primary.base,
                            color: 'white',
                            boxShadow: `0 8px 16px ${primary.base}40`,
                          }
                        : {
                            borderColor: 'rgb(229, 231, 235)',
                            backgroundColor: 'white',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                          }
                    }
                  >
                    <period.icon 
                      className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" 
                      style={{ opacity: selectedPeriod === period.id ? 1 : 0.6 }}
                    />
                    <div className="text-xs font-semibold">{period.label}</div>
                    {selectedPeriod === period.id && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full" style={{ backgroundColor: 'white', border: `2px solid ${primary.base}` }} />
                    )}
                  </button>
                ))}
              </div>
              
              {/* Date Picker for Specific Date */}
              {selectedPeriod === 'date' && (
                <div className="relative overflow-hidden rounded-2xl border-2 shadow-lg transition-all duration-300" style={{ borderColor: primary.base, background: `linear-gradient(to bottom right, white, ${primary.base}08)` }}>
                  <div className="p-6 space-y-4">
                  <div>
                    <label className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: primary.base }}>
                      <Calendar className="w-4 h-4" />
                      Select Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 text-base font-medium transition-all duration-300 focus:outline-none focus:ring-4 focus:scale-[1.02]"
                      style={{ 
                        borderColor: selectedDate ? primary.base : '#d1d5db',
                        color: '#111827',
                        backgroundColor: 'white',
                        boxShadow: selectedDate ? `0 4px 12px ${primary.base}33` : '0 2px 4px rgba(0,0,0,0.05)'
                      } as React.CSSProperties}
                    />
                  </div>
                  {selectedDate && (
                    <div className="text-center pt-4 border-t-2" style={{ borderColor: primary.base }}>
                      <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: primary.base }}>
                        Revenue on {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      <div className="text-3xl font-bold" style={{ color: primary.base }}>
                        {stats.currency}{currentPeriodRevenue.toFixed(2)}
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              )}
              
              {/* Week Picker */}
              {selectedPeriod === 'week' && (
                <div className="relative overflow-hidden rounded-2xl border-2 shadow-lg transition-all duration-300" style={{ borderColor: primary.base, background: `linear-gradient(to bottom right, white, ${primary.base}08)` }}>
                  <div className="p-6 space-y-4">
                  <div>
                    <label className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: primary.base }}>
                      <Calendar className="w-4 h-4" />
                      Select Week Start Date (Monday)
                    </label>
                    <input
                      type="date"
                      value={selectedWeek}
                      onChange={(e) => setSelectedWeek(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 text-base font-medium transition-all duration-300 focus:outline-none focus:ring-4 focus:scale-[1.02]"
                      style={{ 
                        borderColor: selectedWeek ? primary.base : '#d1d5db',
                        color: '#111827',
                        backgroundColor: 'white',
                        boxShadow: selectedWeek ? `0 4px 12px ${primary.base}33` : '0 2px 4px rgba(0,0,0,0.05)'
                      } as React.CSSProperties}
                    />
                  </div>
                  {selectedWeek && (() => {
                    const weekStart = new Date(selectedWeek);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 6);
                    return (
                      <div className="text-center pt-4 border-t-2" style={{ borderColor: primary.base }}>
                        <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: primary.base }}>
                          Week: {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-3xl font-bold" style={{ color: primary.base }}>
                          {stats.currency}{currentPeriodRevenue.toFixed(2)}
                        </div>
                      </div>
                    );
                  })()}
                  </div>
                </div>
              )}
              
              {/* Month Picker */}
              {selectedPeriod === 'month' && (
                <div className="relative overflow-hidden rounded-2xl border-2 shadow-lg transition-all duration-300" style={{ borderColor: primary.base, background: `linear-gradient(to bottom right, white, ${primary.base}08)` }}>
                  <div className="p-6 space-y-4">
                  <div>
                    <label className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: primary.base }}>
                      <Calendar className="w-4 h-4" />
                      Select Month
                    </label>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 text-base font-medium transition-all duration-300 focus:outline-none focus:ring-4 focus:scale-[1.02]"
                      style={{ 
                        borderColor: selectedMonth ? primary.base : '#d1d5db',
                        color: '#111827',
                        backgroundColor: 'white',
                        boxShadow: selectedMonth ? `0 4px 12px ${primary.base}33` : '0 2px 4px rgba(0,0,0,0.05)'
                      } as React.CSSProperties}
                    />
                  </div>
                  {selectedMonth && (() => {
                    const [year, month] = selectedMonth.split('-');
                    const monthDate = new Date(parseInt(year), parseInt(month) - 1);
                    return (
                      <div className="text-center pt-4 border-t-2" style={{ borderColor: primary.base }}>
                        <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: primary.base }}>
                          Revenue for {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>
                        <div className="text-3xl font-bold" style={{ color: primary.base }}>
                          {stats.currency}{currentPeriodRevenue.toFixed(2)}
                        </div>
                      </div>
                    );
                  })()}
                  </div>
                </div>
              )}
              
              {/* Year Picker */}
              {selectedPeriod === 'year' && (
                <div className="relative overflow-hidden rounded-2xl border-2 shadow-lg transition-all duration-300" style={{ borderColor: primary.base, background: `linear-gradient(to bottom right, white, ${primary.base}08)` }}>
                  <div className="p-6 space-y-4">
                  <div>
                    <label className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: primary.base }}>
                      <Calendar className="w-4 h-4" />
                      Select Year
                    </label>
                    <input
                      type="number"
                      min="2000"
                      max="2100"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      placeholder="YYYY"
                      className="w-full px-4 py-3 rounded-xl border-2 text-base font-medium transition-all duration-300 focus:outline-none focus:ring-4 focus:scale-[1.02]"
                      style={{ 
                        borderColor: selectedYear ? primary.base : '#d1d5db',
                        color: '#111827',
                        backgroundColor: 'white',
                        boxShadow: selectedYear ? `0 4px 12px ${primary.base}33` : '0 2px 4px rgba(0,0,0,0.05)'
                      } as React.CSSProperties}
                    />
                  </div>
                  {selectedYear && (
                    <div className="text-center pt-4 border-t-2" style={{ borderColor: primary.base }}>
                      <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: primary.base }}>
                        Revenue for {selectedYear}
                      </div>
                      <div className="text-3xl font-bold" style={{ color: primary.base }}>
                        {stats.currency}{currentPeriodRevenue.toFixed(2)}
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              )}
              
              {/* Custom Date Range Picker */}
              {selectedPeriod === 'custom' && (
                <div className="relative overflow-hidden rounded-2xl border-2 shadow-lg transition-all duration-300" style={{ borderColor: primary.base, background: `linear-gradient(to bottom right, white, ${primary.base}08)` }}>
                  <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: primary.base }}>
                        <Calendar className="w-4 h-4" />
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 text-base font-medium transition-all duration-300 focus:outline-none focus:ring-4 focus:scale-[1.02]"
                        style={{ 
                          borderColor: customStartDate ? primary.base : '#d1d5db',
                          color: '#111827',
                          backgroundColor: 'white',
                          boxShadow: customStartDate ? `0 4px 12px ${primary.base}33` : '0 2px 4px rgba(0,0,0,0.05)'
                        } as React.CSSProperties}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: primary.base }}>
                        <Calendar className="w-4 h-4" />
                        End Date
                      </label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 text-base font-medium transition-all duration-300 focus:outline-none focus:ring-4 focus:scale-[1.02]"
                        style={{ 
                          borderColor: customEndDate ? primary.base : '#d1d5db',
                          color: '#111827',
                          backgroundColor: 'white',
                          boxShadow: customEndDate ? `0 4px 12px ${primary.base}33` : '0 2px 4px rgba(0,0,0,0.05)'
                        } as React.CSSProperties}
                      />
                    </div>
                  </div>
                  {customStartDate && customEndDate && (
                    <div className="text-center pt-4 border-t-2" style={{ borderColor: primary.base }}>
                      <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: primary.base }}>
                        {new Date(customStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(customEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="text-3xl font-bold" style={{ color: primary.base }}>
                        {stats.currency}{currentPeriodRevenue.toFixed(2)}
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              )}
              
              {/* All Time Summary */}
              {selectedPeriod === 'all' && (
                <div className="relative overflow-hidden rounded-2xl border-2 shadow-lg p-8 text-center transition-all duration-300" style={{ borderColor: primary.base, background: `linear-gradient(to bottom right, white, ${primary.base}08)` }}>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`, boxShadow: `0 8px 16px ${primary.base}40` }}>
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: primary.base }}>Total Revenue (All Time)</div>
                  <div className="text-4xl font-bold" style={{ color: primary.base }}>
                    {stats.currency}{currentPeriodRevenue.toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            {/* Revenue by Product */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" style={{ color: primary.base }} />
                Top Products by Revenue
                {selectedPeriod !== 'all' && (
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full" style={{ backgroundColor: `${primary.base}20`, color: primary.base }}>
                    {selectedPeriod === 'custom' ? 'Custom' : 
                     selectedPeriod === 'date' ? 'Selected Date' :
                     selectedPeriod === 'week' ? 'Selected Week' :
                     selectedPeriod === 'month' ? 'Selected Month' :
                     'Selected Year'}
                  </span>
                )}
              </h4>
              <div className="space-y-2">
                {revenueByProduct.length > 0 ? (
                  <>
                  {revenueByProduct.slice(0, visibleProductsCount).map(([productName, data]) => {
                    const percentage = currentPeriodRevenue > 0 ? (data.revenue / currentPeriodRevenue) * 100 : 0;
                    return (
                      <div key={productName} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-900 dark:text-white truncate flex-1">
                            {productName}
                          </span>
                          <span className="font-bold text-gray-900 dark:text-white ml-2">
                            {data.currency}{data.revenue.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 min-w-[60px] text-right">
                            ({data.count} order{data.count !== 1 ? 's' : ''})
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${percentage}%`,
                              background: `linear-gradient(90deg, ${primary.base}, ${primary.hover})`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {visibleProductsCount < revenueByProduct.length && (
                    <button
                      onClick={() => setVisibleProductsCount(prev => Math.min(prev + 10, revenueByProduct.length))}
                      className="w-full mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02]"
                      style={{
                        background: `linear-gradient(135deg, ${primary.base}15, ${primary.hover}15)`,
                        color: primary.base,
                        border: `1px solid ${primary.base}40`
                      }}
                    >
                      Load 10 More ({revenueByProduct.length - visibleProductsCount} remaining)
                    </button>
                  )}
                  {visibleProductsCount > 5 && visibleProductsCount >= revenueByProduct.length && (
                    <button
                      onClick={() => setVisibleProductsCount(5)}
                      className="w-full mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02]"
                      style={{
                        background: `linear-gradient(135deg, ${primary.base}15, ${primary.hover}15)`,
                        color: primary.base,
                        border: `1px solid ${primary.base}40`
                      }}
                    >
                      Show Less
                    </button>
                  )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No product revenue data available
                  </p>
                )}
              </div>
            </div>

            {/* Revenue by Customer */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <User className="w-4 h-4" style={{ color: primary.base }} />
                Top Customers by Revenue
                {selectedPeriod !== 'all' && (
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full" style={{ backgroundColor: `${primary.base}20`, color: primary.base }}>
                    {selectedPeriod === 'custom' ? 'Custom' : 
                     selectedPeriod === 'date' ? 'Selected Date' :
                     selectedPeriod === 'week' ? 'Selected Week' :
                     selectedPeriod === 'month' ? 'Selected Month' :
                     'Selected Year'}
                  </span>
                )}
              </h4>
              <div className="space-y-2">
                {revenueByCustomer.length > 0 ? (
                  <>
                  {revenueByCustomer.slice(0, visibleCustomersCount).map(([customerName, data]) => {
                    const percentage = currentPeriodRevenue > 0 ? (data.revenue / currentPeriodRevenue) * 100 : 0;
                    return (
                      <div key={customerName} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-900 dark:text-white truncate flex-1">
                            {customerName}
                          </span>
                          <span className="font-bold text-gray-900 dark:text-white ml-2">
                            {data.currency}{data.revenue.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 min-w-[60px] text-right">
                            ({data.count} order{data.count !== 1 ? 's' : ''})
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${percentage}%`,
                              background: `linear-gradient(90deg, ${primary.base}, ${primary.hover})`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {visibleCustomersCount < revenueByCustomer.length && (
                    <button
                      onClick={() => setVisibleCustomersCount(prev => Math.min(prev + 10, revenueByCustomer.length))}
                      className="w-full mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02]"
                      style={{
                        background: `linear-gradient(135deg, ${primary.base}15, ${primary.hover}15)`,
                        color: primary.base,
                        border: `1px solid ${primary.base}40`
                      }}
                    >
                      Load 10 More ({revenueByCustomer.length - visibleCustomersCount} remaining)
                    </button>
                  )}
                  {visibleCustomersCount > 5 && visibleCustomersCount >= revenueByCustomer.length && (
                    <button
                      onClick={() => setVisibleCustomersCount(5)}
                      className="w-full mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02]"
                      style={{
                        background: `linear-gradient(135deg, ${primary.base}15, ${primary.hover}15)`,
                        color: primary.base,
                        border: `1px solid ${primary.base}40`
                      }}
                    >
                      Show Less
                    </button>
                  )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No customer revenue data available
                  </p>
                )}
              </div>
            </div>

            {/* Visual Chart */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4" style={{ color: primary.base }} />
                  Revenue Trend
                  {selectedPeriod !== 'all' && (
                    <span className="text-xs font-normal px-2 py-0.5 rounded-full" style={{ backgroundColor: `${primary.base}20`, color: primary.base }}>
                      {selectedPeriod === 'custom' ? 'Custom' : 
                       selectedPeriod === 'date' ? 'Selected Date' :
                       selectedPeriod === 'week' ? 'Selected Week' :
                       selectedPeriod === 'month' ? 'Selected Month' :
                       'Selected Year'}
                    </span>
                  )}
                </h4>
                
                {/* Visualization Type Selector */}
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  {[
                    { id: 'bar' as const, icon: BarChart3, label: 'Bar' },
                    { id: 'column' as const, icon: BarChart, label: 'Column' },
                    { id: 'line' as const, icon: TrendingUp, label: 'Line' },
                    { id: 'area' as const, icon: Activity, label: 'Area' },
                    { id: 'table' as const, icon: TableIcon, label: 'Table' },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setVisualizationType(type.id)}
                      className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1.5"
                      style={{
                        background: visualizationType === type.id ? primary.base : 'transparent',
                        color: visualizationType === type.id ? 'white' : '#6b7280'
                      }}
                      title={type.label}
                    >
                      <type.icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {revenueTrendData.isEmpty ? (
                <div className="p-8 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3" style={{ backgroundColor: `${primary.base}20` }}>
                    <ShoppingCart className="w-6 h-6" style={{ color: primary.base }} />
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    No Revenue Data
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    No purchases found for the selected period
                  </p>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-2xl border-2 shadow-lg" style={{ borderColor: primary.base, background: `linear-gradient(to bottom right, white, ${primary.base}08)` }}>
                  <div className="p-6">
                  
                  {/* Horizontal Bar Chart */}
                  {visualizationType === 'bar' && (
                    <div className="space-y-3">
                      {revenueTrendData.entries.map(([label, revenue]) => {
                        const percentage = (revenue / revenueTrendData.maxRevenue) * 100;
                        const isHighest = revenue === revenueTrendData.maxRevenue;
                        
                        return (
                          <div key={label} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium" style={{ color: primary.base }}>
                                {label}
                              </span>
                              <span className="font-bold text-gray-900 dark:text-white">
                                {stats.currency}{revenue.toFixed(2)}
                              </span>
                            </div>
                            <div className="relative h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden group">
                              <div
                                className="h-full rounded-lg transition-all duration-500 ease-out flex items-center justify-end pr-2"
                                style={{
                                  width: `${percentage}%`,
                                  background: isHighest 
                                    ? `linear-gradient(90deg, ${primary.base}, ${primary.hover})`
                                    : `linear-gradient(90deg, ${primary.base}80, ${primary.hover}80)`,
                                  boxShadow: isHighest ? `0 0 12px ${primary.base}40` : 'none'
                                }}
                              >
                                {percentage > 20 && (
                                  <span className="text-xs font-bold text-white opacity-90">
                                    {percentage.toFixed(0)}%
                                  </span>
                                )}
                              </div>
                              {percentage <= 20 && percentage > 0 && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: primary.base }}>
                                  {percentage.toFixed(0)}%
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Vertical Column Chart */}
                  {visualizationType === 'column' && (
                    <div className="flex items-end justify-around gap-2 h-64">
                      {revenueTrendData.entries.map(([label, revenue]) => {
                        const percentage = (revenue / revenueTrendData.maxRevenue) * 100;
                        const isHighest = revenue === revenueTrendData.maxRevenue;
                        
                        return (
                          <div key={label} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                            <div className="relative w-full flex flex-col items-center">
                              <div className="text-xs font-bold text-gray-900 dark:text-white mb-1">
                                {stats.currency}{revenue.toFixed(0)}
                              </div>
                              <div
                                className="w-full rounded-t-lg transition-all duration-500 ease-out relative group"
                                style={{
                                  height: `${(percentage / 100) * 220}px`,
                                  background: isHighest 
                                    ? `linear-gradient(180deg, ${primary.hover}, ${primary.base})`
                                    : `linear-gradient(180deg, ${primary.hover}80, ${primary.base}80)`,
                                  boxShadow: isHighest ? `0 -4px 12px ${primary.base}40` : 'none',
                                  minHeight: '20px'
                                }}
                              >
                                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity rounded-t-lg" />
                              </div>
                            </div>
                            <div className="text-xs font-medium text-center break-words w-full" style={{ color: primary.base }}>
                              {label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Line Graph */}
                  {visualizationType === 'line' && (
                    <div className="relative h-64">
                      <svg className="w-full h-full" viewBox="0 0 800 240" preserveAspectRatio="none">
                        {/* Grid lines */}
                        {[0, 25, 50, 75, 100].map((y) => (
                          <line
                            key={y}
                            x1="0"
                            y1={240 - (y * 2.4)}
                            x2="800"
                            y2={240 - (y * 2.4)}
                            stroke="#e5e7eb"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                        ))}
                        
                        {/* Line path */}
                        <polyline
                          points={revenueTrendData.entries.map(([, revenue], index) => {
                            const x = (index / Math.max(revenueTrendData.entries.length - 1, 1)) * 800;
                            const y = 240 - ((revenue / revenueTrendData.maxRevenue) * 220);
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke={primary.base}
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        
                        {/* Data points */}
                        {revenueTrendData.entries.map(([label, revenue], index) => {
                          const x = (index / Math.max(revenueTrendData.entries.length - 1, 1)) * 800;
                          const y = 240 - ((revenue / revenueTrendData.maxRevenue) * 220);
                          const isHighest = revenue === revenueTrendData.maxRevenue;
                          
                          return (
                            <g key={label}>
                              <circle
                                cx={x}
                                cy={y}
                                r={isHighest ? "8" : "5"}
                                fill="white"
                                stroke={primary.base}
                                strokeWidth="2"
                              />
                              {isHighest && (
                                <circle
                                  cx={x}
                                  cy={y}
                                  r="12"
                                  fill="none"
                                  stroke={primary.base}
                                  strokeWidth="1"
                                  opacity="0.3"
                                />
                              )}
                            </g>
                          );
                        })}
                      </svg>
                      
                      {/* Labels */}
                      <div className="flex justify-between mt-2">
                        {revenueTrendData.entries.map(([label]) => (
                          <div key={label} className="text-xs font-medium text-center" style={{ color: primary.base, width: `${100 / revenueTrendData.entries.length}%` }}>
                            {label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Area Chart */}
                  {visualizationType === 'area' && (
                    <div className="relative h-64">
                      <svg className="w-full h-full" viewBox="0 0 800 240" preserveAspectRatio="none">
                        {/* Grid lines */}
                        {[0, 25, 50, 75, 100].map((y) => (
                          <line
                            key={y}
                            x1="0"
                            y1={240 - (y * 2.4)}
                            x2="800"
                            y2={240 - (y * 2.4)}
                            stroke="#e5e7eb"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                        ))}
                        
                        {/* Area fill */}
                        <defs>
                          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={primary.base} stopOpacity="0.5" />
                            <stop offset="100%" stopColor={primary.base} stopOpacity="0.05" />
                          </linearGradient>
                        </defs>
                        
                        <polygon
                          points={
                            revenueTrendData.entries.map(([, revenue], index) => {
                              const x = (index / Math.max(revenueTrendData.entries.length - 1, 1)) * 800;
                              const y = 240 - ((revenue / revenueTrendData.maxRevenue) * 220);
                              return `${x},${y}`;
                            }).join(' ') + ' 800,240 0,240'
                          }
                          fill="url(#areaGradient)"
                        />
                        
                        {/* Line */}
                        <polyline
                          points={revenueTrendData.entries.map(([, revenue], index) => {
                            const x = (index / Math.max(revenueTrendData.entries.length - 1, 1)) * 800;
                            const y = 240 - ((revenue / revenueTrendData.maxRevenue) * 220);
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke={primary.base}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        
                        {/* Data points */}
                        {revenueTrendData.entries.map(([label, revenue], index) => {
                          const x = (index / Math.max(revenueTrendData.entries.length - 1, 1)) * 800;
                          const y = 240 - ((revenue / revenueTrendData.maxRevenue) * 220);
                          const isHighest = revenue === revenueTrendData.maxRevenue;
                          
                          return (
                            <circle
                              key={label}
                              cx={x}
                              cy={y}
                              r={isHighest ? "6" : "4"}
                              fill={primary.base}
                            />
                          );
                        })}
                      </svg>
                      
                      {/* Labels */}
                      <div className="flex justify-between mt-2">
                        {revenueTrendData.entries.map(([label]) => (
                          <div key={label} className="text-xs font-medium text-center" style={{ color: primary.base, width: `${100 / revenueTrendData.entries.length}%` }}>
                            {label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Table View */}
                  {visualizationType === 'table' && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2" style={{ borderColor: primary.base }}>
                            <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide" style={{ color: primary.base }}>
                              Period
                            </th>
                            <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wide" style={{ color: primary.base }}>
                              Revenue
                            </th>
                            <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wide" style={{ color: primary.base }}>
                              % of Max
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {revenueTrendData.entries.map(([label, revenue]) => {
                            const percentage = (revenue / revenueTrendData.maxRevenue) * 100;
                            const isHighest = revenue === revenueTrendData.maxRevenue;
                            
                            return (
                              <tr
                                key={label}
                                className="border-b border-gray-200 dark:border-gray-700 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                style={isHighest ? { backgroundColor: `${primary.base}10` } : {}}
                              >
                                <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                                  {label}
                                  {isHighest && (
                                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${primary.base}20`, color: primary.base }}>
                                      Peak
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-sm font-bold text-right text-gray-900 dark:text-white">
                                  {stats.currency}{revenue.toFixed(2)}
                                </td>
                                <td className="py-3 px-4 text-sm text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full"
                                        style={{
                                          width: `${percentage}%`,
                                          background: `linear-gradient(90deg, ${primary.base}, ${primary.hover})`
                                        }}
                                      />
                                    </div>
                                    <span className="font-medium text-gray-600 dark:text-gray-400 w-12 text-right">
                                      {percentage.toFixed(0)}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  </div>
                  
                  {/* Summary Stats */}
                  <div className="px-6 pb-6">
                    <div className="pt-4 border-t-2" style={{ borderColor: primary.base }}>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</div>
                          <div className="text-lg font-bold" style={{ color: primary.base }}>
                            {stats.currency}{currentPeriodRevenue.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Average</div>
                          <div className="text-lg font-bold" style={{ color: primary.base }}>
                            {stats.currency}{(currentPeriodRevenue / Math.max(revenueTrendData.entries.length, 1)).toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Peak</div>
                          <div className="text-lg font-bold" style={{ color: primary.base }}>
                            {stats.currency}{revenueTrendData.maxRevenue.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

