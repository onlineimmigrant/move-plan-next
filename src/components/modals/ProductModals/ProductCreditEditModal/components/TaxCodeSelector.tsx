/**
 * TaxCodeSelector Component
 * 
 * Autocomplete dropdown for selecting tax codes from ~18,000 Stripe tax codes
 * Features fuzzy search with performance optimization (limit 50 results)
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { useTaxCodeSearch } from '../hooks/useTaxCodeSearch';

interface TaxCodeSelectorProps {
  selectedTaxCode: string;
  onSelect: (taxCode: string | null) => void;
  error?: string;
}

export function TaxCodeSelector({
  selectedTaxCode,
  onSelect,
  error,
}: TaxCodeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use tax code search hook
  const { filteredTaxCodes, isLoading } = useTaxCodeSearch(searchTerm);

  // Find selected tax code details
  const selectedCode = filteredTaxCodes.find(
    (tc) => tc.product_tax_code === selectedTaxCode
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle selection
  const handleSelect = (taxCode: string) => {
    onSelect(taxCode);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Handle clear
  const handleClear = () => {
    onSelect(null);
    setSearchTerm('');
    inputRef.current?.focus();
  };

  // Handle open dropdown
  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Selected Tax Code Display or Trigger Button */}
      {selectedTaxCode && !isOpen ? (
        <div
          className={`
            flex items-center justify-between px-4 py-2.5 rounded-lg border
            ${error 
              ? 'border-red-500' 
              : 'border-slate-300 dark:border-gray-600'
            }
            bg-white dark:bg-gray-800
            cursor-pointer
            hover:border-slate-400 dark:hover:border-gray-500
          `}
          onClick={handleOpen}
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {selectedCode?.product_tax_code || selectedTaxCode}
            </div>
            {selectedCode && (
              <div className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
                {selectedCode.description}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="ml-2 p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label="Clear tax code"
          >
            <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
      ) : (
        /* Search Input */
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className={`
              w-full pl-10 pr-10 py-2.5 rounded-lg border
              ${error 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-slate-300 dark:border-gray-600 focus:ring-blue-500'
              }
              bg-white dark:bg-gray-800 
              text-slate-900 dark:text-white
              focus:ring-2 focus:outline-none
              placeholder:text-slate-400 dark:placeholder:text-slate-500
            `}
            placeholder="Search tax codes..."
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDown className={`h-4 w-4 text-slate-400 dark:text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-lg shadow-lg max-h-80 overflow-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
              Loading tax codes...
            </div>
          ) : filteredTaxCodes.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
              {searchTerm 
                ? `No tax codes found for "${searchTerm}"` 
                : 'No tax codes available'
              }
            </div>
          ) : (
            <>
              {searchTerm && filteredTaxCodes.length >= 50 && (
                <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-slate-200 dark:border-gray-700">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    Showing first 50 results. Refine your search for more specific results.
                  </p>
                </div>
              )}
              <ul role="listbox" className="py-1">
                {filteredTaxCodes.map((taxCode) => (
                  <li
                    key={taxCode.product_tax_code}
                    role="option"
                    aria-selected={taxCode.product_tax_code === selectedTaxCode}
                    onClick={() => handleSelect(taxCode.product_tax_code)}
                    className={`
                      px-4 py-3 cursor-pointer transition-colors
                      hover:bg-slate-50 dark:hover:bg-gray-700
                      ${taxCode.product_tax_code === selectedTaxCode 
                        ? 'bg-blue-50 dark:bg-blue-900/20' 
                        : ''
                      }
                    `}
                  >
                    <div className="font-medium text-sm text-slate-900 dark:text-white">
                      {taxCode.product_tax_code}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {taxCode.description}
                    </div>
                    {taxCode.tax_category && (
                      <div className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                        Category: {taxCode.tax_category}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Helper Text */}
      {!error && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {selectedTaxCode 
            ? 'Click to change tax code' 
            : 'Search and select a Stripe tax code (optional)'
          }
        </p>
      )}
    </div>
  );
}
