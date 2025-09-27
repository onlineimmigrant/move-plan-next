import React, { useState, useEffect } from 'react';
import { 
  ArrowTopRightOnSquareIcon, 
  GlobeAltIcon, 
  EllipsisVerticalIcon,
  DocumentDuplicateIcon,
  ChartBarIcon,
  ArrowPathIcon,
  TrashIcon,
  RocketLaunchIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { Organization, organizationTypes } from './types';
import Button from '@/ui/Button';

interface OrganizationCardProps {
  organization: Organization;
  onEdit: (org: Organization) => void;
  onDeploy?: (org: Organization) => void;
  onClone?: (org: Organization) => void;
  onDelete?: (org: Organization) => void;
  isLoading?: boolean;
}

export default function OrganizationCard({ 
  organization, 
  onEdit, 
  onDeploy, 
  onClone, 
  onDelete,
  isLoading = false
}: OrganizationCardProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  const handleEdit = async () => {
    setIsButtonLoading(true);
    await onEdit(organization);
    // Note: The loading will be cleared when the component receives isLoading=false
  };

  // Clear local loading state when external loading changes
  useEffect(() => {
    if (!isLoading) {
      setIsButtonLoading(false);
    }
  }, [isLoading]);

  const getTypeInfo = (type: string) => {
    return organizationTypes.find(t => t.value === type) || { label: type, icon: '🏢' };
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
      console.log(`${type} copied to clipboard`);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const typeInfo = getTypeInfo(organization.type);
  const isPlatform = organization.type === 'platform';

  return (
    <div 
      className={`group relative overflow-hidden rounded-xl border cursor-pointer transition-all duration-200 ${
        isPlatform 
          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/60 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50' 
          : 'bg-white border-gray-200/80 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-100/50'
      }`}
    >
      {/* Main Content */}
      <div className="p-6">
        {/* Header with org info and actions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{typeInfo.icon}</span>
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {organization.name}
              </h3>
              {isPlatform && (
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-medium">
                  Platform
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 capitalize mb-3">
              {typeInfo.label}
            </p>
          </div>
          
          {/* Quick Actions Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            
            {showDropdown && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowDropdown(false)}
                />
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 top-8 z-20 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                  {organization.base_url && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(organization.base_url!, 'Live URL');
                        setShowDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Copy Live URL
                    </button>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDropdown(false);
                      // Add analytics functionality
                      console.log('View Analytics for:', organization.name);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <ChartBarIcon className="w-4 h-4" />
                    View Analytics
                  </button>
                  

                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDropdown(false);
                      // Add sync functionality
                      console.log('Sync Changes for:', organization.name);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    Sync Changes
                  </button>
                  
                  {onClone && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdown(false);
                        onClone(organization);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4" />
                      Clone Site
                    </button>
                  )}
                  
                  <hr className="my-1" />
                  
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdown(false);
                        if (confirm(`Are you sure you want to delete "${organization.name}"?`)) {
                          onDelete(organization);
                        }
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Delete Site
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="mb-4 flex items-center gap-2">
          {organization.base_url && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-md">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              Live
            </span>
          )}
          {organization.base_url_local && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-md">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
              Development
            </span>
          )}
          {!organization.base_url && !organization.base_url_local && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              Draft
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex">
          <Button
            variant="manage"
            onClick={handleEdit}
            loading={isButtonLoading || isLoading}
            loadingText="Loading..."
          >
            Manage Site
          </Button>
        </div>
      </div>
    </div>
  );
}
