'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => void;
  sourceOrganizationName: string;
  isLoading?: boolean;
}

export default function CloneModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  sourceOrganizationName, 
  isLoading = false 
}: CloneModalProps) {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newName.trim()) {
      setError('Organization name is required');
      return;
    }

    if (newName.length < 2) {
      setError('Organization name must be at least 2 characters');
      return;
    }

    if (newName.length > 50) {
      setError('Organization name must be less than 50 characters');
      return;
    }

    setError('');
    console.log('CloneModal submitting with name:', newName.trim());
    onConfirm(newName.trim());
  };

  const handleClose = () => {
    if (!isLoading) {
      setNewName('');
      setError('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Clone Organization</h2>
          {!isLoading && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              You are about to clone <strong>"{sourceOrganizationName}"</strong>. 
              Please enter a name for the new organization.
            </p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> The organization name cannot be changed after creation. 
                Choose carefully.
              </p>
            </div>

            <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-2">
              New Organization Name
            </label>
            <input
              id="organizationName"
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter organization name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              disabled={isLoading}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <h4 className="text-sm font-medium text-blue-900 mb-2">What will be cloned:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Organization settings and configuration</li>
              <li>• Website hero section</li>
              <li>• Menu items and navigation</li>
              <li>• Website navigation menu structure</li>
              <li>• Content sections and templates</li>
              <li>• Template section metrics</li>
              <li>• Page heading sections</li>
              <li>• Individual pages and content</li>
              <li>• Banners and promotional content</li>
              <li>• Blog posts and articles</li>
              <li>• Products and services</li>
              <li>• Pricing plans and features</li>
              <li>• Pricing comparison data</li>
              <li>• Features and testimonials</li>
              <li>• FAQ sections</li>
              <li>• Brand assets (if any)</li>
            </ul>
            <p className="text-sm text-blue-800 mt-2 font-medium">
              A new Vercel deployment will be automatically created.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !newName.trim()}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Cloning...
                </>
              ) : (
                'Clone & Deploy'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
