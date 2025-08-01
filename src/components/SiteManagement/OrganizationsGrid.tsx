import React from 'react';
import { GlobeAltIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Organization } from './types';
import OrganizationCard from './OrganizationCard';

interface OrganizationsGridProps {
  organizations: Organization[];
  canCreateMore: boolean;
  onCreateNew: () => void;
  onEditOrganization: (org: Organization) => void;
}

export default function OrganizationsGrid({ 
  organizations, 
  canCreateMore, 
  onCreateNew, 
  onEditOrganization 
}: OrganizationsGridProps) {
  if (organizations.length === 0) {
    return (
      <div className="text-center py-12">
        <GlobeAltIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sites Yet</h3>
        <p className="text-gray-600 mb-6">Create your first organization site to get started.</p>
        {canCreateMore && (
          <button
            onClick={onCreateNew}
            className="inline-flex items-center px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors duration-200"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Your First Site
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {organizations.map((org) => (
        <OrganizationCard
          key={org.id}
          organization={org}
          onEdit={onEditOrganization}
        />
      ))}
    </div>
  );
}
