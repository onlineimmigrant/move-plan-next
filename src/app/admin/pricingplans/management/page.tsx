'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaSearch, FaTrash, FaTimes } from 'react-icons/fa';
import { debounce } from 'lodash';

interface Product {
  id: string;
  product_name: string;
  is_displayed: boolean;
  links_to_image?: string;
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

export default function PricingPlansManagement() {
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

  useEffect(() => {
    fetchPricingPlans();
    fetchProducts();
  }, []);

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

  const fetchPricingPlans = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/pricingplans/list');
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to fetch pricing plans');
      const data: PricingPlan[] = await response.json();
      setPricingPlans(data);
      setFilteredPricingPlans(data);
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      alert(`Error fetching pricing plans: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products/list');
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to fetch products');
      const data: Product[] = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert(`Error fetching products: ${(error as Error).message}`);
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
      // Clear recurring fields if type is one_time
      if (name === 'type' && value === 'one_time') {
        return { ...newData, recurring_interval: undefined, recurring_interval_count: undefined };
      }
      return newData;
    });
  };

  const debouncedTableSearch = useCallback(
    debounce((value: string) => setSearchQuery(value), 300),
    []
  );

  const debouncedProductSearch = useCallback(
    debounce((value: string) => setProductSearchQuery(value), 300),
    []
  );

  const handleTableSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedTableSearch(e.target.value);
  };

  const handleProductSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedProductSearch(e.target.value);
    setIsProductDropdownOpen(!!e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validateForm(formData);
    if (errors.length) return alert(errors.join('; '));

    try {
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

      alert(editingId ? 'Pricing plan updated successfully' : 'Pricing plan created successfully');
      closeModal();
      fetchPricingPlans();
    } catch (error) {
      alert(`Error: ${(error as Error).message}`);
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
  };

  const handleDelete = async (pricingPlanId: string) => {
    if (!confirm('Are you sure you want to delete this pricing plan?')) return;
    try {
      const response = await fetch('/api/pricingplans', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricingPlanId }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to delete pricing plan');
      alert('Pricing plan deleted successfully');
      closeModal();
      fetchPricingPlans();
    } catch (error) {
      alert(`Error: ${(error as Error).message}`);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ product_id: '', price: '', currency: 'gbp', is_active: true, type: 'one_time' });
    setProductSearchQuery('');
    setSearchQuery('');
    setIsProductDropdownOpen(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ product_id: '', price: '', currency: 'gbp', is_active: true, type: 'one_time' });
    setProductSearchQuery('');
    setSearchQuery('');
    setIsProductDropdownOpen(false);
  };

  const handleSelectProduct = (product: Product) => {
    setFormData((prev) => ({ ...prev, product_id: product.id }));
    setProductSearchQuery(product.product_name);
    setSearchQuery(product.product_name);
    setIsProductDropdownOpen(false);
  };

  return (
    <div className="p-6 pb-16 max-w-7xl sm:mx-auto bg-white min-h-screen font-sans border border-gray-200 my-4 mx-2 rounded-lg">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Pricing Plans</h2>
          <button
            onClick={openCreateModal}
            title="Add New Pricing Plan"
            className="flex items-center justify-center bg-gray-600 text-white w-6 h-6 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
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
                activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'
              }`}
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
          <input
            type="text"
            value={searchQuery}
            onChange={handleTableSearchChange}
            placeholder="Search pricing plans by product name..."
            className="block w-full border border-gray-200 rounded-md py-2 px-4 text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out placeholder-gray-400 text-sm"
          />
        </div>
        {isLoading ? (
          <p className="text-gray-600 text-xs">Loading...</p>
        ) : filteredPricingPlans.length === 0 ? (
          <p className="text-gray-600 text-xs">No pricing plans found.</p>
        ) : (
          <div className="relative overflow-hidden bg-white rounded-lg border border-gray-200">
            <div className="max-h-[600px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interval</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPricingPlans.map((plan, index) => (
                    <tr
                      key={plan.id}
                      className={`transition duration-150 ease-in-out ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 flex items-center">
                        {plan.product?.links_to_image ? (
                          <img
                            src={plan.product.links_to_image}
                            alt="Product"
                            className="h-10 mr-4 rounded-sm"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        ) : (
                          <div className="h-10 w-10 mr-2 bg-gray-200 rounded-sm" />
                        )}
                        <span onClick={() => handleEdit(plan)} className="cursor-pointer text-gray-600 text-sm hover:underline font-medium">
                          {plan.product?.product_name || 'Unknown Product'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900 ">{plan.price}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">{plan.currency.toUpperCase()}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">{plan.type}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                        {plan.type === 'recurring' ? `${plan.recurring_interval_count || 1} ${plan.recurring_interval}(s)` : 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">{plan.is_active ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(plan.id);
                          }}
                          className="text-red-600 hover:text-red-700 transition duration-150 ease-in-out"
                        >
                          <FaTrash className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 p-2 text-xs text-gray-600 text-left">{filteredPricingPlans.length} results</div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-transparent" />
          <div
            className={`fixed top-0 right-0 h-full w-full sm:w-1/2 max-w-md bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
              isModalOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="relative h-full flex flex-col">
              <div className="sticky top-0 z-10 bg-white p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Update Pricing Plan' : 'Add Pricing Plan'}</h2>
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Product</label>
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        value={productSearchQuery}
                        onChange={handleProductSearchChange}
                        placeholder="Search for a product..."
                        className="pl-10 w-full border border-gray-200 rounded-md py-2 px-4 text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out placeholder-gray-400 text-xs"
                      />
                    </div>
                    {productSearchQuery && isProductDropdownOpen && (
                      <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {products.filter((product) => product.product_name.toLowerCase().includes(productSearchQuery.toLowerCase())).length > 0 ? (
                          products
                            .filter((product) => product.product_name.toLowerCase().includes(productSearchQuery.toLowerCase()))
                            .map((product) => (
                              <li
                                key={product.id}
                                onClick={() => handleSelectProduct(product)}
                                className="px-4 py-2 text-gray-900 hover:bg-gray-100 cursor-pointer transition duration-150 ease-in-out text-xs"
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
                    <label className="block text-xs font-medium text-gray-700 mb-1">Price (in cents)</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="Enter price in cents..."
                      className="w-full border border-gray-200 rounded-md py-2 px-4 text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out placeholder-gray-400 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 rounded-md py-2 px-4 text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-xs"
                    >
                      {['gbp', 'usd', 'eur', 'pln', 'chf', 'nok', 'czk', 'uah', 'byn', 'rub'].map((currency) => (
                        <option key={currency} value={currency}>
                          {currency.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 rounded-md py-2 px-4 text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-xs"
                    >
                      <option value="one_time">One-Time</option>
                      <option value="recurring">Recurring</option>
                    </select>
                  </div>
                  {formData.type === 'recurring' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Recurring Interval</label>
                        <select
                          name="recurring_interval"
                          value={formData.recurring_interval || ''}
                          onChange={handleInputChange}
                          className="w-full border border-gray-200 rounded-md py-2 px-4 text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-xs"
                        >
                          <option value="" disabled>Select interval</option>
                          {['day', 'week', 'month', 'year'].map((interval) => (
                            <option key={interval} value={interval}>
                              {interval.charAt(0).toUpperCase() + interval.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Interval Count</label>
                        <input
                          type="number"
                          name="recurring_interval_count"
                          value={formData.recurring_interval_count || ''}
                          onChange={handleInputChange}
                          placeholder="e.g., 1 for monthly, 3 for quarterly"
                          className="w-full border border-gray-200 rounded-md py-2 px-4 text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out placeholder-gray-400 text-xs"
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
                        className="ml-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition duration-150 ease-in-out"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <button
                      type="submit"
                      className="flex items-center px-4 py-2 rounded-md text-xs font-medium transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                    >
                      {editingId ? 'Update' : 'Create'}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={() => handleDelete(editingId)}
                        className="flex items-center bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-150 ease-in-out text-xs font-medium"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex items-center bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-150 ease-in-out text-xs font-medium"
                    >
                      Cancel
                    </button>
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