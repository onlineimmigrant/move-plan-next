'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaPlus, FaSearch, FaTrash, FaTimes } from 'react-icons/fa';
import { debounce } from 'lodash';
import Toast from '@/components/Toast';
import Tooltip from '@/components/Tooltip';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string;
  product_name: string;
  is_displayed: boolean;
  links_to_image?: string;
  product_description?: string;
}

interface PricingPlan {
  id: string;
  product_id: string;
  price: number;
  currency: string;
  is_active: boolean;
  type: 'one_time' | 'recurring';
  recurring_interval?: 'day' | 'week' | 'month' | 'year';
  recurring_interval_count?: number;
  product?: Product;
}

interface FormData {
  product_id: string;
  price: string;
  currency: string;
  is_active: boolean;
  type: 'one_time' | 'recurring';
  recurring_interval?: 'day' | 'week' | 'month' | 'year';
  recurring_interval_count?: string;
}

// Reusable Tailwind-styled components
const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={`block w-full border border-gray-200 rounded-md py-3 px-4 text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out placeholder-gray-400 text-sm ${className}`}
    {...props}
  />
);

const Select = ({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    className={`block w-full border border-gray-200 rounded-md py-3 px-4 text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-sm ${className}`}
    {...props}
  />
);

const Button = ({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={`flex items-center px-4 py-2 rounded-md text-xs font-medium transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${className}`}
    {...props}
  />
);

export default function PricingPlansManagement() {
  const router = useRouter();
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [filteredPricingPlans, setFilteredPricingPlans] = useState<PricingPlan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<FormData>({
    product_id: '',
    price: '',
    currency: 'gbp',
    is_active: true,
    type: 'one_time',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const modalRef = useRef<HTMLDivElement>(null);

  const debouncedTableSearch = useMemo(() => debounce((value: string) => setSearchQuery(value), 300), []);
  const debouncedProductSearch = useMemo(() => debounce((value: string) => setProductSearchQuery(value), 300), []);

  // Admin check
  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        router.push('/');
        return;
      }

      if (profile.role !== 'admin') {
        router.push('/');
        return;
      }

      setIsAdmin(true);
      setAuthLoading(false);
    }

    checkAdmin();
  }, [router]);

  useEffect(() => {
    if (isAdmin) {
      fetchPricingPlans();
      fetchProducts();
    }
  }, [isAdmin]);

  useEffect(() => {
    let filtered = pricingPlans;
    if (activeTab === 'active') filtered = filtered.filter((plan) => plan.is_active);
    else if (activeTab === 'archived') filtered = filtered.filter((plan) => !plan.is_active);
    if (searchQuery) {
      filtered = filtered.filter(
        (plan) =>
          plan.product?.product_name &&
          plan.product.product_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredPricingPlans(filtered);
  }, [searchQuery, pricingPlans, activeTab]);

  useEffect(() => {
    if (isModalOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isModalOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    },
    [isModalOpen]
  );

  const fetchPricingPlans = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/pricingplans/list');
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to fetch pricing plans');
      const data: PricingPlan[] = await response.json();
      setPricingPlans(data);
      setFilteredPricingPlans(data);
    } catch (error) {
      setError(`Failed to fetch pricing plans: ${(error as Error).message}`);
      setToast({ message: `Error fetching pricing plans: ${(error as Error).message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/products/list');
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to fetch products');
      const data: Product[] = await response.json();
      setProducts(data);
    } catch (error) {
      setError(`Failed to fetch products: ${(error as Error).message}`);
      setToast({ message: `Error fetching products: ${(error as Error).message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (data: FormData) => {
    const errors: string[] = [];
    if (!data.product_id) errors.push('Product is required');
    const price = parseInt(data.price);
    if (!data.price || isNaN(price) || price <= 0) errors.push('Valid price is required');
    if (!data.currency) errors.push('Currency is required');
    if (data.type === 'recurring' && !data.recurring_interval) errors.push('Recurring interval is required for recurring plans');
    if (data.type === 'recurring' && data.recurring_interval_count && parseInt(data.recurring_interval_count) <= 0) {
      errors.push('Recurring interval count must be a positive number');
    }
    return errors;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type: inputType } = e.target;
    const checked = inputType === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: inputType === 'checkbox' ? checked : value,
      };
      if (name === 'type' && value === 'one_time') {
        return { ...newData, recurring_interval: undefined, recurring_interval_count: undefined };
      }
      return newData;
    });
  };

  const handleProductSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedProductSearch(e.target.value);
    setIsProductDropdownOpen(!!e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const errors = validateForm(formData);
      if (errors.length) throw new Error(errors.join('; '));

      const payload = {
        product_id: formData.product_id,
        price: parseInt(formData.price),
        currency: formData.currency,
        is_active: formData.is_active,
        type: formData.type,
        recurring_interval: formData.type === 'recurring' ? formData.recurring_interval : undefined,
        recurring_interval_count: formData.type === 'recurring' && formData.recurring_interval_count ? parseInt(formData.recurring_interval_count) : undefined,
      };

      const response = await fetch('/api/pricingplans', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { pricingPlanId: editingId, updates: payload } : payload),
      });

      if (!response.ok) throw new Error((await response.json()).error || 'Failed to save pricing plan');

      setToast({
        message: editingId ? 'Pricing plan updated successfully' : 'Pricing plan created successfully',
        type: 'success',
      });
      closeModal();
      fetchPricingPlans();
    } catch (error) {
      setError(`Error: ${(error as Error).message}`);
      setToast({ message: `Error: ${(error as Error).message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (pricingPlan: PricingPlan) => {
    setEditingId(pricingPlan.id);
    setFormData({
      product_id: pricingPlan.product_id,
      price: pricingPlan.price.toString(),
      currency: pricingPlan.currency,
      is_active: pricingPlan.is_active,
      type: pricingPlan.type,
      recurring_interval: pricingPlan.recurring_interval,
      recurring_interval_count: pricingPlan.recurring_interval_count?.toString(),
    });
    const productName = pricingPlan.product?.product_name || '';
    setProductSearchQuery(productName);
    setSearchQuery(productName);
    setIsModalOpen(true);
    setIsProductDropdownOpen(false);
  };

  const handleDelete = async (pricingPlanId: string) => {
    if (!confirm('Are you sure you want to delete this pricing plan?')) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/pricingplans', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricingPlanId }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to delete pricing plan');
      setToast({ message: 'Pricing plan deleted successfully', type: 'success' });
      closeModal();
      fetchPricingPlans();
    } catch (error) {
      setError(`Error: ${(error as Error).message}`);
      setToast({ message: `Error: ${(error as Error).message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ product_id: '', price: '', currency: 'gbp', is_active: true, type: 'one_time' });
    setProductSearchQuery('');
    setSearchQuery('');
    setIsProductDropdownOpen(false);
    setIsModalOpen(true);
    setError(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ product_id: '', price: '', currency: 'gbp', is_active: true, type: 'one_time' });
    setProductSearchQuery('');
    setSearchQuery('');
    setIsProductDropdownOpen(false);
    setError(null);
  };

  const handleSelectProduct = (product: Product) => {
    setFormData((prev) => ({ ...prev, product_id: product.id }));
    setProductSearchQuery(product.product_name);
    setSearchQuery(product.product_name);
    setIsProductDropdownOpen(false);
  };

  const pageTitle = editingId ? 'Update Pricing Plan' : 'Add Pricing Plan';

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg font-semibold text-gray-600 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // or some fallback UI while redirecting
  }

  return (
    <div className="p-6 pb-16 max-w-7xl sm:mx-auto bg-white min-h-screen font-sans border border-gray-200 my-4 mx-2 rounded-lg">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          aria-live="polite"
        />
      )}

      {/* Pricing Plans Table Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Pricing Plans</h2>
          <button
            onClick={openCreateModal}
            aria-label="Add new pricing plan"
            className="flex items-center justify-center bg-gray-300 text-white w-6 h-6 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
          >
            <FaPlus className="h-3 w-3" />
          </button>
        </div>
        <div className="flex space-x-4 mb-4 border-b border-gray-200">
          {['all', 'active', 'archived'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2 sm:px-4 py-2 text-xs font-medium ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
              aria-current={activeTab === tab ? 'page' : undefined}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} (
              {tab === 'all'
                ? pricingPlans.length
                : tab === 'active'
                ? pricingPlans.filter((p) => p.is_active).length
                : pricingPlans.filter((p) => !p.is_active).length}
              )
            </button>
          ))}
        </div>
        <div className="relative mb-4">
          <Input
            type="text"
            onChange={(e) => debouncedTableSearch(e.target.value)}
            placeholder="Search pricing plans by product name..."
            aria-label="Search pricing plans"
          />
        </div>
        {isLoading ? (
          <p className="text-gray-600 text-xs">Loading pricing plans...</p>
        ) : error ? (
          <div className="text-red-600 text-xs">
            {error}
            <Button
              onClick={fetchPricingPlans}
              className="ml-2 text-blue-600 hover:text-blue-700"
              aria-label="Retry fetching pricing plans"
            >
              Retry
            </Button>
          </div>
        ) : filteredPricingPlans.length === 0 ? (
          <p className="text-gray-600 text-xs">No pricing plans found.</p>
        ) : (
          <div className="relative overflow-hidden bg-white rounded-lg border border-gray-200">
            <div className="max-h-[400px] sm:max-h-[600px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Currency
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interval
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text- gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Active
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm text-gray-500">
                  {filteredPricingPlans.map((plan, index) => (
                    <tr
                      key={plan.id}
                      className={`transition duration-150 ease-in-out ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-gray-100`}
                    >
                      <td className="px-4 py-2 text-sm text-gray-900">
                        <div className="flex items-center">
                          {plan.product?.links_to_image ? (
                            <img
                              src={plan.product.links_to_image}
                              alt={`Image for ${plan.product?.product_name}`}
                              className="h-8 w-auto mr-4 rounded-sm sm:h-10 sm:mr-4"
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          ) : (
                            <div className="h-8 w-auto mr-4 bg-gray-200 rounded-sm sm:h-10 sm:w-10 sm:mr-4" />
                          )}
                          <span
                            onClick={() => handleEdit(plan)}
                            className="cursor-pointer text-gray-700 hover:text-blue-700 font-medium truncate overflow-hidden whitespace-nowrap max-w-[150px] sm:max-w-[200px]"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleEdit(plan)}
                          >
                            {plan.product?.product_name || 'Unknown Product'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Tooltip content={plan.product?.product_description || 'N/A'}>
                          <span className="truncate max-w-24 inline-block">
                            {plan.product?.product_description || 'N/A'}
                          </span>
                        </Tooltip>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {plan.price}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {plan.currency.toUpperCase()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {plan.type}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {plan.type === 'recurring'
                          ? `${plan.recurring_interval_count || 1} ${plan.recurring_interval}(s)`
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell text-sm text-gray-900">
                        {plan.is_active ? 'Yes' : 'No'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium hidden sm:table-cell">
                        <button
                          onClick={() => handleDelete(plan.id)}
                          className="text-red-600 hover:text-red-700 transition duration-150 ease-in-out"
                          aria-label={`Delete pricing plan for ${plan.product?.product_name || 'Unknown Product'}`}
                        >
                          <FaTrash className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 p-2 text-xs text-gray-600 text-left">
              {filteredPricingPlans.length} results
            </div>
          </div>
        )}
      </div>

      {/* Modal for Add/Update Pricing Plan */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50"
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-labelledby="modal-title"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-transparent"
            onClick={closeModal}
            aria-hidden="true"
          />
          <div
            ref={modalRef}
            tabIndex={-1}
            className={`fixed top-0 right-0 h-full w-full sm:w-1/2 max-w-md bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
              isModalOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="relative h-full flex flex-col">
              <div className="sticky top-0 z-10 bg-white p-4 border-b border-gray-200">
                <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
                  {pageTitle}
                </h2>
                <Button
                  onClick={closeModal}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                  aria-label="Close modal"
                >
                  <FaTimes className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {error && <p className="text-red-600 text-xs mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <label
                      htmlFor="product_id"
                      className=".justify-items-center block text-xs font-medium text-gray-700 mb-1"
                    >
                      Product
                    </label>
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="product_id"
                        type="text"
                        value={productSearchQuery}
                        onChange={handleProductSearchChange}
                        placeholder="Search for a product..."
                        className="pl-10"
                        aria-describedby="product_id_help"
                      />
                    </div>
                    {productSearchQuery && isProductDropdownOpen && (
                      <ul
                        className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
                        role="listbox"
                      >
                        {products
                          .filter((product) =>
                            product.product_name.toLowerCase().includes(productSearchQuery.toLowerCase())
                          )
                          .length > 0 ? (
                          products
                            .filter((product) =>
                              product.product_name.toLowerCase().includes(productSearchQuery.toLowerCase())
                            )
                            .map((product) => (
                              <li
                                key={product.id}
                                onClick={() => handleSelectProduct(product)}
                                className="px-4 py-2 text-gray-900 hover:bg-gray-100 cursor-pointer transition duration-150 ease-in-out text-xs"
                                role="option"
                                aria-selected={formData.product_id === product.id}
                              >
                                {product.product_name}
                              </li>
                            ))
                        ) : (
                          <li className="px-4 py-2 text-gray-500 text-xs">No products found</li>
                        )}
                      </ul>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="price"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Price (in cents)
                    </label>
                    <Input
                      id="price"
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="Enter price in cents..."
                      aria-describedby="price_help"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="currency"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Currency
                    </label>
                    <Select
                      id="currency"
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      aria-describedby="currency_help"
                    >
                      {['gbp', 'usd', 'eur', 'pln', 'chf', 'nok', 'czk', 'uah', 'byn', 'rub'].map((currency) => (
                        <option key={currency} value={currency}>
                          {currency.toUpperCase()}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label
                      htmlFor="type"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Type
                    </label>
                    <Select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      aria-describedby="type_help"
                    >
                      <option value="one_time">One-Time</option>
                      <option value="recurring">Recurring</option>
                    </Select>
                  </div>
                  {formData.type === 'recurring' && (
                    <>
                      <div>
                        <label
                          htmlFor="recurring_interval"
                          className="block text-xs font-medium text-gray-700 mb-1"
                        >
                          Recurring Interval
                        </label>
                        <Select
                          id="recurring_interval"
                          name="recurring_interval"
                          value={formData.recurring_interval || ''}
                          onChange={handleInputChange}
                          aria-describedby="recurring_interval_help"
                        >
                          <option value="" disabled>
                            Select interval
                          </option>
                          {['day', 'week', 'month', 'year'].map((interval) => (
                            <option key={interval} value={interval}>
                              {interval.charAt(0).toUpperCase() + interval.slice(1)}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label
                          htmlFor="recurring_interval_count"
                          className="block text-xs font-medium text-gray-700 mb-1"
                        >
                          Interval Count
                        </label>
                        <Input
                          id="recurring_interval_count"
                          type="number"
                          name="recurring_interval_count"
                          value={formData.recurring_interval_count || ''}
                          onChange={handleInputChange}
                          placeholder="e.g., 1 for monthly, 3 for quarterly"
                          aria-describedby="recurring_interval_count_help"
                        />
                      </div>
                    </>
                  )}
                  <div className="flex items-center">
                    <label className="flex items-center text-xs font-medium text-gray-700">
                      Active
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleInputChange}
                        className="mlOsman 2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition duration-150 ease-in-out"
                        aria-label="Toggle pricing plan active status"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <Button
                      type="submit"
                      className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                      disabled={isLoading}
                      aria-label={editingId ? 'Update pricing plan' : 'Create pricing plan'}
                    >
                      {isLoading ? 'Processing...' : editingId ? 'Update' : 'Create'}
                    </Button>
                    {editingId && (
                      <Button
                        type="button"
                        onClick={() => handleDelete(editingId)}
                        className="bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400"
                        disabled={isLoading}
                        aria-label="Delete pricing plan"
                      >
                        <FaTrash className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      onClick={closeModal}
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400"
                      aria-label="Cancel"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}