'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FaSearch, FaTrash, FaTimes } from 'react-icons/fa';
import { MdAddCircle } from 'react-icons/md'; // New elegant icon for creating a product
import taxCodesData from '@/components/tax_codes.json';
import { debounce } from 'lodash';
import Toast from '@/components/Toast';
import Tooltip from '@/components/Tooltip';

// Centralized API endpoints
const API_ENDPOINTS = {
  LIST_PRODUCTS: '/api/products/list',
  MANAGE_PRODUCTS: '/api/products',
} as const;

// Interfaces
interface Product {
  id: string;
  product_name: string;
  is_displayed: boolean;
  product_description?: string;
  links_to_image?: string;
  attributes?: Record<string, any>;
  product_tax_code?: string;
}

interface FormData {
  product_name: string;
  is_displayed: boolean;
  product_description: string;
  links_to_image: string;
  attributes: string;
  product_tax_code: string;
}

interface TaxCode {
  product_tax_code: string;
  description: string;
  tax_category: string;
}

// Reusable Tailwind-styled components
const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={`block w-full border border-gray-200 rounded-md py-3 px-4 text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out placeholder-gray-400 text-sm ${className}`}
    {...props}
  />
);

const Button = ({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={`flex items-center px-4 py-2 rounded-md text-xs font-medium transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${className}`}
    {...props}
  />
);

export default function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<FormData>({
    product_name: '',
    is_displayed: true,
    product_description: '',
    links_to_image: '',
    attributes: '',
    product_tax_code: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [taxCodes] = useState<TaxCode[]>(taxCodesData);
  const [taxCodeSearch, setTaxCodeSearch] = useState<string>('');
  const [selectedTaxCodeDescription, setSelectedTaxCodeDescription] = useState<string>('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isTaxCodeDropdownOpen, setIsTaxCodeDropdownOpen] = useState<boolean>(false); // New state for tax code dropdown

  const debouncedSearch = useMemo(() => debounce((value: string) => setSearchQuery(value), 300), []);

  const filteredProductsMemo = useMemo(() => {
    let filtered = products;
    if (activeTab === 'active') {
      filtered = filtered.filter((product) => product.is_displayed);
    } else if (activeTab === 'archived') {
      filtered = filtered.filter((product) => !product.is_displayed);
    }
    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product.product_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [products, activeTab, searchQuery]);

  useEffect(() => {
    setFilteredProducts(filteredProductsMemo);
  }, [filteredProductsMemo]);

  useEffect(() => {
    fetchProducts();
  }, []);

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

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_ENDPOINTS.LIST_PRODUCTS);
      if (!response.ok) throw new Error((await response.json()).error);
      const data: Product[] = await response.json();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      setError(`Failed to fetch products: ${(error as Error).message}`);
      setToast({ message: `Error fetching products: ${(error as Error).message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const validateURL = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateJSON = (json: string): boolean => {
    try {
      JSON.parse(json);
      return true;
    } catch {
      return false;
    }
  };

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => {
        const newFormData = { ...prev, [name]: value };
        if (name === 'product_tax_code') {
          const selectedTaxCode = taxCodes.find((tc) => tc.product_tax_code === value);
          setSelectedTaxCodeDescription(selectedTaxCode ? selectedTaxCode.description : '');
          setTaxCodeSearch(value);
          setIsTaxCodeDropdownOpen(true); // Open dropdown on typing
        }
        return newFormData;
      });
      if (name === 'product_name' && value.length > 2) {
        setIsProductDropdownOpen(true);
      } else if (name === 'product_name') {
        setIsProductDropdownOpen(false);
      }
    },
    [taxCodes]
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const sanitizedFormData = {
        product_name: formData.product_name.trim(),
        product_description: formData.product_description.trim(),
        links_to_image: formData.links_to_image.trim(),
        attributes: formData.attributes.trim(),
        product_tax_code: formData.product_tax_code.trim(),
        is_displayed: formData.is_displayed,
      };

      if (sanitizedFormData.links_to_image && !validateURL(sanitizedFormData.links_to_image)) {
        throw new Error('Invalid image URL');
      }

      let attributes: Record<string, any> = {};
      if (sanitizedFormData.attributes) {
        if (!validateJSON(sanitizedFormData.attributes)) {
          throw new Error('Invalid JSON in attributes field');
        }
        attributes = JSON.parse(sanitizedFormData.attributes);
      }

      if (
        sanitizedFormData.product_tax_code &&
        !taxCodes.some((tc) => tc.product_tax_code === sanitizedFormData.product_tax_code)
      ) {
        throw new Error('Invalid tax code');
      }

      const payload = {
        product_name: sanitizedFormData.product_name,
        is_displayed: sanitizedFormData.is_displayed,
        product_description: sanitizedFormData.product_description || undefined,
        links_to_image: sanitizedFormData.links_to_image || undefined,
        attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
        product_tax_code: sanitizedFormData.product_tax_code || undefined,
      };

      const response = await fetch(API_ENDPOINTS.MANAGE_PRODUCTS, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { productId: editingId, updates: payload } : payload),
      });

      if (!response.ok) throw new Error((await response.json()).error);

      setToast({
        message: editingId ? 'Product updated successfully' : 'Product created successfully',
        type: 'success',
      });
      closeModal();
      fetchProducts();
    } catch (error) {
      setError(`Error: ${(error as Error).message}`);
      setToast({ message: `Error: ${(error as Error).message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    const selectedTaxCode = taxCodes.find((tc) => tc.product_tax_code === product.product_tax_code);
    setFormData({
      product_name: product.product_name,
      is_displayed: product.is_displayed,
      product_description: product.product_description || '',
      links_to_image: product.links_to_image || '',
      attributes: product.attributes ? JSON.stringify(product.attributes) : '',
      product_tax_code: product.product_tax_code || '',
    });
    setTaxCodeSearch(product.product_tax_code || '');
    setSelectedTaxCodeDescription(selectedTaxCode ? selectedTaxCode.description : '');
    setIsModalOpen(true);
    setIsTaxCodeDropdownOpen(false); // Ensure tax code dropdown is closed when editing
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.MANAGE_PRODUCTS, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) throw new Error((await response.json()).error);

      setToast({ message: 'Product deleted successfully', type: 'success' });
      closeModal();
      fetchProducts();
    } catch (error) {
      setError(`Error: ${(error as Error).message}`);
      setToast({ message: `Error: ${(error as Error).message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      product_name: '',
      is_displayed: true,
      product_description: '',
      links_to_image: '',
      attributes: '',
      product_tax_code: '',
    });
    setTaxCodeSearch('');
    setSelectedTaxCodeDescription('');
    setIsProductDropdownOpen(false);
    setIsTaxCodeDropdownOpen(false); // Ensure tax code dropdown is closed
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      product_name: '',
      is_displayed: true,
      product_description: '',
      links_to_image: '',
      attributes: '',
      product_tax_code: '',
    });
    setTaxCodeSearch('');
    setSelectedTaxCodeDescription('');
    setIsProductDropdownOpen(false);
    setIsTaxCodeDropdownOpen(false); // Close tax code dropdown
    setError(null);
  };

  const filteredTaxCodes = taxCodes.filter(
    (tc) =>
      taxCodeSearch
        ? tc.description.toLowerCase().includes(taxCodeSearch.toLowerCase()) ||
          tc.product_tax_code.toLowerCase().includes(taxCodeSearch.toLowerCase())
        : true
  );

  const pageTitle = editingId ? 'Update Product' : 'Add Product';

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

      {/* Products Table Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Products</h2>
          <Button
            onClick={openCreateModal}
            title="Add New Product"
            className="bg-gray-600 text-white w-8 h-8 rounded-full hover:bg-gray-700 focus:ring-blue-500 flex items-center justify-center"
            aria-label="Add new product"
          >
            <MdAddCircle className="h-5 w-5" /> {/* Updated icon */}
          </Button>
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
                ? products.length
                : tab === 'active'
                ? products.filter((p) => p.is_displayed).length
                : products.filter((p) => !p.is_displayed).length}
              )
            </button>
          ))}
        </div>
        <div className="relative mb-4">
          <Input
            type="text"
            onChange={(e) => debouncedSearch(e.target.value)}
            placeholder="Search products by name..."
            aria-label="Search products"
          />
        </div>
        {isLoading ? (
          <p className="text-gray-600 text-xs">Loading products...</p>
        ) : error ? (
          <div className="text-red-600 text-xs">
            {error}
            <Button
              onClick={fetchProducts}
              className="ml-2 text-blue-600 hover:text-blue-700"
              aria-label="Retry fetching products"
            >
              Retry
            </Button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <p className="text-gray-600 text-xs">No products found.</p>
        ) : (
          <div className="relative overflow-hidden bg-white rounded-lg border border-gray-200">
            <div className="max-h-[600px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Displayed
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tax Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm text-gray-500">
                  {filteredProducts.map((product, index) => (
                    <tr
                      key={product.id}
                      className={`transition duration-150 ease-in-out ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-gray-100`}
                    >
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 flex items-center">
                        {product.links_to_image ? (
                          <img
                            src={product.links_to_image}
                            alt={`Image for ${product.product_name}`}
                            className="h-10 mr-4 rounded-sm"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        ) : (
                          <div className="h-10 w-10 mr-2 bg-gray-200 rounded-sm" />
                        )}
                        <span
                          onClick={() => handleEdit(product)}
                          className="cursor-pointer text-gray-700 hover:text-blue-700 font-medium"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && handleEdit(product)}
                        >
                          {product.product_name}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {product.is_displayed ? 'Yes' : 'No'}
                      </td>
                      <td className="px-4 py-3">
                        <Tooltip content={product.product_description || 'N/A'}>
                          <span className="truncate max-w-24 inline-block">
                            {product.product_description || 'N/A'}
                          </span>
                        </Tooltip>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {product.product_tax_code || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium">
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-700 transition duration-150 ease-in-out"
                          aria-label={`Delete ${product.product_name}`}
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
              {filteredProducts.length} results
            </div>
          </div>
        )}
      </div>

      {/* Modal for Add/Update Product */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50"
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-labelledby="modal-title"
          aria-modal="true"
        >
          {/* Transparent Backdrop */}
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
                      htmlFor="product_name"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Product Name
                    </label>
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="product_name"
                        type="text"
                        name="product_name"
                        value={formData.product_name}
                        onChange={handleInputChange}
                        placeholder="Search or enter product name..."
                        aria-describedby="product_name_help"
                        className="pl-10"
                      />
                    </div>
                    {isProductDropdownOpen && formData.product_name && (
                      <ul
                        className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
                        role="listbox"
                      >
                        {products
                          .filter((product) =>
                            product.product_name
                              .toLowerCase()
                              .includes(formData.product_name.toLowerCase())
                          )
                          .length > 0 ? (
                          products
                            .filter((product) =>
                              product.product_name
                                .toLowerCase()
                                .includes(formData.product_name.toLowerCase())
                            )
                            .map((product) => (
                              <li
                                key={product.id}
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    product_name: product.product_name,
                                  }));
                                  setIsProductDropdownOpen(false);
                                }}
                                className="px-4 py-2 text-gray-900 hover:bg-gray-100 cursor-pointer transition duration-150 ease-in-out text-xs"
                                role="option"
                                aria-selected={formData.product_name === product.product_name}
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

                  <div className="flex items-center">
                    <label className="flex items-center text-xs font-medium text-gray-700">
                      Displayed
                      <input
                        type="checkbox"
                        name="is_displayed"
                        checked={formData.is_displayed}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, is_displayed: e.target.checked }))
                        }
                        className="ml-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition duration-150 ease-in-out"
                        aria-label="Toggle product display"
                      />
                    </label>
                  </div>

                  <div>
                    <label
                      htmlFor="product_description"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Description
                    </label>
                    <textarea
                      id="product_description"
                      name="product_description"
                      value={formData.product_description}
                      onChange={handleInputChange}
                      placeholder="Enter product description..."
                      className="w-full border border-gray-200 rounded-md py-2 px-4 text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out placeholder-gray-400 text-xs"
                      aria-describedby="product_description_help"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="links_to_image"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Image URL
                    </label>
                    <Input
                      id="links_to_image"
                      type="text"
                      name="links_to_image"
                      value={formData.links_to_image}
                      onChange={handleInputChange}
                      placeholder="e.g., https://example.com/image1.jpg"
                      aria-describedby="links_to_image_help"
                    />
                    {formData.links_to_image && (
                      <div className="mt-4">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Image Preview
                        </label>
                        <img
                          src={formData.links_to_image}
                          alt="Product Preview"
                          className="h-16 rounded-md border border-gray-200"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="attributes"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Attributes (JSON)
                    </label>
                    <textarea
                      id="attributes"
                      name="attributes"
                      value={formData.attributes}
                      onChange={handleInputChange}
                      placeholder='e.g., {"key": "value"}'
                      className="w-full border border-gray-200 rounded-md py-2 px-4 text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out placeholder-gray-400 text-xs"
                      aria-describedby="attributes_help"
                    />
                  </div>

                  <div className="relative">
                    <label
                      htmlFor="product_tax_code"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Tax Code{selectedTaxCodeDescription ? `: ${selectedTaxCodeDescription}` : ''}
                    </label>
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="product_tax_code"
                        type="text"
                        name="product_tax_code"
                        value={formData.product_tax_code}
                        onChange={handleInputChange}
                        placeholder="Enter or search tax code (e.g., txcd_10000000)..."
                        className="pl-10"
                        aria-describedby="product_tax_code_help"
                      />
                    </div>
                    {isTaxCodeDropdownOpen && taxCodeSearch && (
                      <ul
                        className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
                        role="listbox"
                      >
                        {filteredTaxCodes.length > 0 ? (
                          filteredTaxCodes.map((tc) => (
                            <li
                              key={tc.product_tax_code}
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  product_tax_code: tc.product_tax_code,
                                }));
                                setTaxCodeSearch('');
                                setSelectedTaxCodeDescription(tc.description);
                                setIsTaxCodeDropdownOpen(false); // Close dropdown after selection
                              }}
                              className="px-4 py-2 text-gray-900 hover:bg-gray-100 cursor-pointer transition duration-150 ease-in-out text-xs"
                              role="option"
                              aria-selected={formData.product_tax_code === tc.product_tax_code}
                            >
                              {tc.description} ({tc.product_tax_code})
                            </li>
                          ))
                        ) : (
                          <li className="px-4 py-2 text-gray-500 text-xs">No tax codes found</li>
                        )}
                      </ul>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <Button
                      type="submit"
                      className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                      disabled={isLoading}
                      aria-label={editingId ? 'Update product' : 'Create product'}
                    >
                      {isLoading ? 'Processing...' : editingId ? 'Update' : 'Create'}
                    </Button>
                    {editingId && (
                      <Button
                        type="button"
                        onClick={() => handleDelete(editingId)}
                        className="bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400"
                        disabled={isLoading}
                        aria-label="Delete product"
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