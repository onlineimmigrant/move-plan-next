import React from 'react';
import { ArrowTopRightOnSquareIcon, PencilIcon } from '@heroicons/react/24/outline';
import { Organization, organizationTypes } from './types';

interface OrganizationCardProps {
  organization: Organization;
  onEdit: (org: Organization) => void;
}

export default function OrganizationCard({ organization, onEdit }: OrganizationCardProps) {
  const getTypeInfo = (type: string) => {
    return organizationTypes.find(t => t.value === type) || { label: type, icon: '🏢' };
  };

  const typeInfo = getTypeInfo(organization.type);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <span className="text-2xl mr-3">{typeInfo.icon}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {organization.name}
            </h3>
            <p className="text-sm text-gray-500">{typeInfo.label}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(organization)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="Edit organization"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <span className={`px-2 py-1 text-xs rounded-full ${
            organization.user_role === 'admin' 
              ? 'bg-sky-100 text-sky-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {organization.user_role}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {organization.base_url_local && (
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium mr-2">Local:</span>
            <a 
              href={organization.base_url_local} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sky-600 hover:text-sky-800 flex items-center"
            >
              {organization.base_url_local}
              <ArrowTopRightOnSquareIcon className="w-3 h-3 ml-1" />
            </a>
          </div>
        )}
        {organization.base_url && (
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium mr-2">Live:</span>
            <a 
              href={organization.base_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sky-600 hover:text-sky-800 flex items-center"
            >
              {organization.base_url}
              <ArrowTopRightOnSquareIcon className="w-3 h-3 ml-1" />
            </a>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500">
        {organization.created_at ? 
          `Created ${new Date(organization.created_at).toLocaleDateString()}` :
          'Organization'
        }
        {process.env.NODE_ENV === 'development' && organization.created_by_email && (
          <div className="mt-1 text-xs text-blue-600">
            Created by: {organization.created_by_email}
          </div>
        )}
      </div>
    </div>
  );
}
