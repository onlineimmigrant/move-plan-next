/**
 * DataList Component
 * 
 * Sortable, paginated list with selection
 */

'use client';

import React, { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export interface DataListColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

export interface DataListProps<T> {
  /** List data */
  data: T[];
  
  /** Column definitions */
  columns: DataListColumn<T>[];
  
  /** Unique key field */
  keyField: keyof T;
  
  /** Sort state */
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  
  /** Selection */
  selectable?: boolean;
  selectedKeys?: string[];
  onSelect?: (keys: string[]) => void;
  
  /** Row click handler */
  onRowClick?: (item: T) => void;
  
  /** Empty state */
  emptyText?: string;
  
  /** Custom className */
  className?: string;
}

/**
 * Data List Component
 * 
 * Table-style list with sorting and selection
 */
export function DataList<T extends Record<string, any>>({
  data,
  columns,
  keyField,
  sortBy,
  sortDirection = 'asc',
  onSort,
  selectable = false,
  selectedKeys = [],
  onSelect,
  onRowClick,
  emptyText = 'No data available',
  className = '',
}: DataListProps<T>) {
  const [localSort, setLocalSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    sortBy ? { key: sortBy, direction: sortDirection } : null
  );

  const handleSort = (columnKey: string) => {
    const newDirection =
      localSort?.key === columnKey && localSort.direction === 'asc' ? 'desc' : 'asc';
    
    setLocalSort({ key: columnKey, direction: newDirection });
    onSort?.(columnKey, newDirection);
  };

  const handleSelectAll = () => {
    if (!onSelect) return;
    
    if (selectedKeys.length === data.length) {
      onSelect([]);
    } else {
      onSelect(data.map((item) => String(item[keyField])));
    }
  };

  const handleSelectRow = (key: string) => {
    if (!onSelect) return;
    
    if (selectedKeys.includes(key)) {
      onSelect(selectedKeys.filter((k) => k !== key));
    } else {
      onSelect([...selectedKeys, key]);
    }
  };

  const isAllSelected = data.length > 0 && selectedKeys.length === data.length;
  const isSomeSelected = selectedKeys.length > 0 && selectedKeys.length < data.length;

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
          {emptyText}
        </p>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <tr>
            {selectable && (
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isSomeSelected;
                  }}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
            )}
            
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                style={{
                  width: column.width,
                  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                }}
              >
                {column.sortable ? (
                  <button
                    onClick={() => handleSort(String(column.key))}
                    className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <span>{column.label}</span>
                    {localSort?.key === String(column.key) && (
                      localSort.direction === 'asc' ? (
                        <ChevronUpIcon className="w-4 h-4" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4" />
                      )
                    )}
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((item) => {
            const itemKey = String(item[keyField]);
            const isSelected = selectedKeys.includes(itemKey);

            return (
              <tr
                key={itemKey}
                onClick={() => onRowClick?.(item)}
                className={`
                  ${onRowClick ? 'cursor-pointer' : ''}
                  ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}
                  transition-colors
                `.trim()}
              >
                {selectable && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectRow(itemKey)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                )}
                
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className="px-4 py-3 text-sm text-gray-900 dark:text-white"
                    style={{
                      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                    }}
                  >
                    {column.render ? column.render(item) : item[column.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
