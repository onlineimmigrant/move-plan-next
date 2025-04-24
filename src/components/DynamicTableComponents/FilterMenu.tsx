'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FilterCriteria } from './types';

interface FilterMenuProps {
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  filterCriteria: FilterCriteria | null;
  setFilterCriteria: (criteria: FilterCriteria | null) => void;
  fields: string[];
  applyFilter: (field: string, value: string) => void;
  clearFilter: () => void;
  primaryButtonClass: string;
  grayButtonClass: string;
}

const FilterMenu: React.FC<FilterMenuProps> = ({
  isFilterOpen,
  setIsFilterOpen,
  filterCriteria,
  setFilterCriteria,
  fields,
  applyFilter,
  clearFilter,
  primaryButtonClass,
  grayButtonClass,
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset position to center when the modal opens
  useEffect(() => {
    if (isFilterOpen) {
      // Center the modal on the viewport
      setPosition({ x: 0, y: 0 }); // Will be adjusted by CSS transform
    }
  }, [isFilterOpen]);

  // Handle dragging
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleDrag = (e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, dragStart]);

  if (!isFilterOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed z-10 bg-white border border-gray-200 rounded-md shadow-lg p-6 w-96"
      style={{
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <div
        className="flex justify-between items-center mb-4 cursor-grab"
        onMouseDown={handleDragStart}
      >
        <h3 className="text-lg font-semibold text-gray-900">Filter By</h3>
        <button
          onClick={() => setIsFilterOpen(false)}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <select
        className="border border-gray-300 p-2 text-xs rounded-md w-full mb-2"
        value={filterCriteria?.field || ''}
        onChange={(e) =>
          setFilterCriteria({
            field: e.target.value,
            value: filterCriteria?.value || '',
          })
        }
      >
        <option value="">Select Field</option>
        {fields.map((field) => (
          <option key={field} value={field}>
            {field}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Value"
        value={filterCriteria?.value || ''}
        onChange={(e) =>
          setFilterCriteria({
            field: filterCriteria?.field || fields[0] || '',
            value: e.target.value,
          })
        }
        className="border border-gray-300 p-2 text-xs rounded-md w-full mb-4"
      />
      <div className="flex gap-3 justify-end">
        <button
          onClick={() =>
            applyFilter(
              filterCriteria?.field || fields[0] || '',
              filterCriteria?.value || ''
            )
          }
          className={primaryButtonClass}
        >
          Apply
        </button>
        <button onClick={clearFilter} className={grayButtonClass}>
          Clear
        </button>
      </div>
    </div>
  );
};

export default FilterMenu;