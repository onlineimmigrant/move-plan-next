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
  LinkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Organization, organizationTypes } from './types';
import Button from '@/ui/Button';
import CloneModal from './CloneModal';

interface OrganizationCardProps {
  organization: Organization;
  onEdit: (org: Organization) => void;
  onDeploy?: (org: Organization) => void;
  onClone?: (org: Organization, customName: string) => void;
  onDelete?: (org: Organization) => void;
  isLoading?: boolean;
  isMostRecent?: boolean;
}

export default function OrganizationCard({ 
  organization, 
  onEdit, 
  onDeploy, 
  onClone, 
  onDelete,
  isLoading = false,
  isMostRecent = false
}: OrganizationCardProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationName, setDeleteConfirmationName] = useState('');
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletionLoading, setIsDeletionLoading] = useState(false);
  const [isCloningLoading, setIsCloningLoading] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);

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

  const handleCancelDelete = () => {
    if (isDeletionLoading) return; // Prevent canceling during deletion
    setShowDeleteModal(false);
    setDeleteConfirmationName('');
    setDeleteConfirmationText('');
    setIsDeletionLoading(false);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmationName === organization.name && deleteConfirmationText === 'confirm deletion') {
      setIsDeletionLoading(true);
      try {
        await onDelete?.(organization);
        handleCancelDelete();
      } catch (error) {
        console.error('Delete error:', error);
        setIsDeletionLoading(false);
        // Keep modal open on error so user can try again
      }
    }
  };

  const isDeleteConfirmationValid = deleteConfirmationName === organization.name && deleteConfirmationText === 'confirm deletion' && !isDeletionLoading;

  const handleClone = () => {
    console.log('Clone button clicked, onClone:', !!onClone, 'isCloningLoading:', isCloningLoading);
    if (!onClone || isCloningLoading) return;
    
    setShowDropdown(false);
    setShowCloneModal(true);
    console.log('Opening clone modal for:', organization.name);
  };

  const handleConfirmClone = async (customName: string) => {
    console.log('Confirm clone called with customName:', customName);
    if (!onClone) return;
    
    setIsCloningLoading(true);
    
    try {
      await onClone(organization, customName);
      setShowCloneModal(false);
    } catch (error) {
      console.error('Clone error:', error);
    } finally {
      setIsCloningLoading(false);
    }
  };

  const handleCloseCloneModal = () => {
    if (!isCloningLoading) {
      setShowCloneModal(false);
    }
  };

  const typeInfo = getTypeInfo(organization.type);
  const isPlatform = organization.type === 'platform';

  return (
    <div 
      className={`group relative rounded-xl border cursor-pointer transition-all duration-200 min-h-[280px] ${
        isMostRecent && !isPlatform
          ? 'bg-white border-green-400 hover:border-green-500 hover:shadow-lg hover:shadow-green-100/50 ring-2 ring-green-200/50'
          : isPlatform 
          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/60 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50' 
          : 'bg-white border-gray-200/80 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-100/50'
      }`}
    >
      {/* Cloning Overlay */}
      {isCloningLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-90 rounded-xl flex items-center justify-center z-30">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-gray-600">Cloning organization...</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-8 h-full flex flex-col justify-between">
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
              {isMostRecent && !isPlatform && (
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs font-medium animate-pulse">
                  Recent
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
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowDropdown(false)}
                />
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 top-8 z-50 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 max-h-96 overflow-y-auto">
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
                        handleClone();
                      }}
                      disabled={isCloningLoading}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors duration-200 ${
                        isCloningLoading
                          ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {isCloningLoading ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                      ) : (
                        <DocumentDuplicateIcon className="w-4 h-4" />
                      )}
                      {isCloningLoading ? 'Cloning...' : 'Clone Site'}
                    </button>
                  )}
                  
               
                  
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdown(false);
                        setShowDeleteModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Delete
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 bg-transparent flex items-center justify-center p-4 z-50"
          onClick={isDeletionLoading ? undefined : handleCancelDelete}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-md relative shadow-2xl border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Loading Overlay */}
            {isDeletionLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                  <p className="text-sm font-medium text-gray-600">Deleting organization...</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Delete Organization</h3>
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{organization.name}"?
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-red-600 mb-4 font-medium">
                ⚠️ This action cannot be undone. All data associated with this organization will be permanently deleted.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="deleteConfirmName" className="block text-sm font-medium text-gray-700 mb-1">
                    Type the organization name to confirm:
                  </label>
                  <input
                    id="deleteConfirmName"
                    type="text"
                    value={deleteConfirmationName}
                    onChange={(e) => setDeleteConfirmationName(e.target.value)}
                    placeholder={organization.name}
                    disabled={isDeletionLoading}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none transition-colors ${
                      isDeletionLoading
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                    }`}
                  />
                </div>
                
                <div>
                  <label htmlFor="deleteConfirmText" className="block text-sm font-medium text-gray-700 mb-1">
                    Type "confirm deletion" to proceed:
                  </label>
                  <input
                    id="deleteConfirmText"
                    type="text"
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    placeholder="confirm deletion"
                    disabled={isDeletionLoading}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none transition-colors ${
                      isDeletionLoading
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                    }`}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={isDeletionLoading}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isDeletionLoading 
                    ? 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={!isDeleteConfirmationValid || isDeletionLoading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors duration-200 flex items-center gap-2 ${
                  isDeleteConfirmationValid && !isDeletionLoading
                    ? 'bg-red-600 hover:bg-red-700 border border-transparent'
                    : 'bg-gray-300 cursor-not-allowed border border-transparent'
                }`}
              >
                {isDeletionLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {isDeletionLoading ? 'Deleting...' : 'Delete Organization'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clone Modal */}
      <CloneModal
        isOpen={showCloneModal}
        onClose={handleCloseCloneModal}
        onConfirm={handleConfirmClone}
        sourceOrganizationName={organization.name}
        isLoading={isCloningLoading}
      />
    </div>
  );
}
