'use client';

import React, { useState } from 'react';
import { Switch } from '@headlessui/react';

interface CategoryProps {
  category: {
    id: number;
    name: string;
    description: string;
    services: { id: number; name: string; description: string; active: boolean }[];
  };
  consent: { services: number[] };
  setConsent: React.Dispatch<React.SetStateAction<{ services: number[] }>>;
  isEssentialCategory: (name: string) => boolean;
}

const Category: React.FC<CategoryProps> = ({
  category,
  consent,
  setConsent,
  isEssentialCategory,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isEssential = isEssentialCategory(category.name);
  const isChecked = category.services.every((service) => consent.services.includes(service.id));

  const handleToggle = () => {
    if (isEssential) return;

    const serviceIds = category.services.map((service) => service.id);
    if (isChecked) {
      setConsent((prev) => ({
        ...prev,
        services: prev.services.filter((id) => !serviceIds.includes(id)),
      }));
    } else {
      setConsent((prev) => ({
        ...prev,
        services: [...new Set([...prev.services, ...serviceIds])],
      }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="border-b border-gray-100 py-4">
      <div
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        className="flex items-center justify-between px-6 py-3 text-teal-600 hover:text-teal-700 hover:bg-gray-50 w-full rounded-md transition-colors duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
      >
        <div className="flex items-center space-x-4">
          <Switch
            checked={isChecked}
            onChange={handleToggle}
            disabled={isEssential}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
              isEssential
                ? 'bg-gray-300 cursor-not-allowed'
                : isChecked
                ? 'bg-teal-500'
                : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${
                isChecked ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </Switch>
          <h3 className="text-base font-bold text-gray-800">{category.name}</h3>
        </div>
        <span className="text-2xl font-semibold text-gray-800">{isOpen ? '−' : '+'}</span>
      </div>
      {isOpen && (
        <div className="mt-3 px-6 py-2 text-xs font-light tracking-wide text-gray-500">
          <p>
            <span className="font-medium text-gray-700">Description:</span>{' '}
            {category.description || 'No description available.'}
          </p>
          <p className="mt-2">
            <span className="font-medium text-gray-700">Services:</span>{' '}
            {category.services.map((service) => service.name).join(', ') || 'None'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Category;