import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  canCreateMore: boolean;
  onCreateNew: () => void;
  onTestAuth: () => void;
}

export default function Header({ canCreateMore, onCreateNew, onTestAuth }: HeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Site Management</h1>
          <p className="text-gray-600 mt-2">Create and manage your organization sites</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onTestAuth}
            className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm"
          >
            Test Auth
          </button>
          {canCreateMore && (
            <button
              onClick={onCreateNew}
              className="inline-flex items-center px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors duration-200"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create New Site
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
