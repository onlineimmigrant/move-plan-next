'use client';

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { 
  BuildingOfficeIcon, 
  GlobeAltIcon, 
  AcademicCapIcon, 
  DocumentTextIcon,
  BeakerIcon,
  CogIcon 
} from '@heroicons/react/24/solid';

interface SampleOrganization {
  id: string;
  name: string;
  type: string;
  display_name: string;
  description?: string;
  settings?: any;
  created_at?: string;
}

interface SampleExplorationModalProps {
  isOpen: boolean;
  organization: SampleOrganization | null;
  onClose: () => void;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'immigration':
      return GlobeAltIcon;
    case 'education':
      return AcademicCapIcon;
    case 'legal':
      return DocumentTextIcon;
    case 'consulting':
      return BuildingOfficeIcon;
    case 'technology':
      return BeakerIcon;
    default:
      return CogIcon;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'immigration':
      return 'bg-gradient-to-br from-blue-500 to-indigo-600';
    case 'education':
      return 'bg-gradient-to-br from-emerald-500 to-teal-600';
    case 'legal':
      return 'bg-gradient-to-br from-amber-500 to-orange-600';
    case 'consulting':
      return 'bg-gradient-to-br from-purple-500 to-violet-600';
    case 'technology':
      return 'bg-gradient-to-br from-pink-500 to-rose-600';
    default:
      return 'bg-gradient-to-br from-gray-500 to-gray-600';
  }
};

export default function SampleExplorationModal({ isOpen, organization, onClose }: SampleExplorationModalProps) {
  if (!isOpen || !organization) return null;

  const TypeIcon = getTypeIcon(organization.type);
  const typeColor = getTypeColor(organization.type);

  const mockFeatures = [
    'Custom branding and themes',
    'Multi-language support',
    'Document management',
    'Client portal access',
    'Automated workflows',
    'Analytics dashboard',
    'Payment processing',
    'Appointment scheduling'
  ];

  const mockStats = {
    pages: Math.floor(Math.random() * 20) + 8,
    users: Math.floor(Math.random() * 500) + 50,
    documents: Math.floor(Math.random() * 1000) + 100,
    features: Math.floor(Math.random() * 15) + 10
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          {/* Header with gradient */}
          <div className={`${typeColor} px-6 py-8 text-white relative overflow-hidden`}>
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <TypeIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {organization.display_name}
                  </h3>
                  <p className="text-white/80 text-sm capitalize">
                    {organization.type} Organization Sample
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {/* Read-only notice */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-sm text-blue-800 font-medium">
                  Sample Organization - Read-Only Preview
                </p>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                This is a demonstration organization showcasing {organization.type} industry features and configurations.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{mockStats.pages}</div>
                <div className="text-xs text-gray-600">Pages</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{mockStats.users}</div>
                <div className="text-xs text-gray-600">Users</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{mockStats.documents}</div>
                <div className="text-xs text-gray-600">Documents</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{mockStats.features}</div>
                <div className="text-xs text-gray-600">Features</div>
              </div>
            </div>

            {/* Features List */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                Included Features
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {mockFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Organization Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name
                </label>
                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
                  {organization.name}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Type
                </label>
                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 capitalize">
                  {organization.type}
                </div>
              </div>

              {organization.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
                    {organization.description}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Want to create a similar organization? Use the clone feature.
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
