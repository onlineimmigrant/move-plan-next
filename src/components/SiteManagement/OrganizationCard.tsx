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
  ExclamationTriangleIcon,
  // Organization type icons
  UserGroupIcon,
  ScaleIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  SparklesIcon,
  BuildingOffice2Icon,
  WrenchScrewdriverIcon,
  HomeIcon,
  BuildingOfficeIcon,
  ComputerDesktopIcon,
  MegaphoneIcon,
  TruckIcon,
  BeakerIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';
import { Organization, organizationTypes } from './types';
import Button from '@/ui/Button';
import CloneModal from './CloneModal';

interface OrganizationCardProps {
  organization: Organization;
  onEdit: (org: Organization) => void;
  onPreview?: (org: Organization) => void;
  onDeploy?: (org: Organization) => void;
  onClone?: (org: Organization, customName: string) => void;
  onDelete?: (org: Organization) => void;
  isLoading?: boolean;
  isMostRecent?: boolean;
}

export default function OrganizationCard({ 
  organization, 
  onEdit, 
  onPreview,
  onDeploy, 
  onClone, 
  onDelete,
  isLoading = false,
  isMostRecent = false
}: OrganizationCardProps) {
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

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: any } = {
      immigration: UserGroupIcon,
      solicitor: ScaleIcon,
      finance: CurrencyDollarIcon,
      education: AcademicCapIcon,
      job: BriefcaseIcon,
      beauty: SparklesIcon,
      doctor: BuildingOffice2Icon,
      services: WrenchScrewdriverIcon,
      realestate: HomeIcon,
      construction: BuildingOfficeIcon,
      software: ComputerDesktopIcon,
      marketing: MegaphoneIcon,
      consulting: BriefcaseIcon,
      automotive: TruckIcon,
      hospitality: BuildingOffice2Icon,
      retail: ShoppingCartIcon,
      healthcare: BuildingOffice2Icon,
      transportation: TruckIcon,
      technology: BeakerIcon,
      general: BuildingOfficeIcon,
      platform: BuildingOfficeIcon
    };
    return icons[type] || BuildingOfficeIcon;
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
      className={`group relative rounded-2xl border-2 cursor-pointer transition-all duration-500 h-[180px] flex flex-col transform hover:scale-[1.02] hover:-translate-y-1 ${
        isMostRecent && !isPlatform
          ? 'bg-gradient-to-br from-white to-green-50/30 border-green-300 hover:border-green-400 hover:shadow-2xl hover:shadow-green-200/50 ring-2 ring-green-200/50'
          : isPlatform 
          ? 'bg-gradient-to-br from-blue-50 via-white to-indigo-50/50 border-blue-200 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-200/50' 
          : 'bg-gradient-to-br from-white via-gray-50/30 to-white border-gray-200 hover:border-sky-300 hover:shadow-2xl hover:shadow-sky-100/30'
      }`}
    >
      {/* Subtle shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl pointer-events-none"></div>
      {/* Enhanced Background Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-sky-50/70 backdrop-blur-md transition-all duration-300 rounded-2xl z-10 ${
        isButtonLoading || isLoading ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'
      }`}></div>
      
      {/* Cloning Overlay */}
      {isCloningLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-90 rounded-xl flex items-center justify-center z-30">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-gray-600">Cloning organization...</p>
          </div>
        </div>
      )}

      {/* Enhanced Header Section */}
      <div className={`p-4 relative border-b-2 rounded-t-2xl ${
        isPlatform 
          ? 'bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50/30 border-blue-200/60' 
          : 'bg-gradient-to-br from-gray-50 via-white to-sky-50/30 border-gray-200/80'
      }`}>
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
            {React.createElement(getTypeIcon(organization.type), { className: "w-4 h-4 text-gray-600" })}
          </div>
          
          <div className="flex items-center gap-1">
            {organization.base_url && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-xs font-medium rounded-full border border-green-200">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                Live
              </span>
            )}
            {organization.base_url_local && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 text-xs font-medium rounded-full border border-orange-200">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                Dev
              </span>
            )}
            {!organization.base_url && !organization.base_url_local && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                Draft
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Body Section */}
      <div className="p-4 flex-grow flex flex-col justify-center items-center text-center">
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-3 truncate">{typeInfo.label}</p>
          <p className="text-xs font-normal text-gray-600 truncate">{organization.name}</p>
        </div>

        {/* Bottom content */}
        <div>

          {/* Platform and Recent badges - Hidden */}
          <div className="flex items-center gap-1 justify-center flex-wrap">
            {/* Badges removed as requested */}
          </div>
        </div>
      </div>

      {/* Centered Hover Action Buttons */}
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 z-20 ${
        isButtonLoading || isLoading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        <div className="flex flex-col gap-3 px-6">
          {onPreview && (
            <Button
              variant="light-outline"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(organization);
              }}
              disabled={isButtonLoading || isLoading}
              className="min-w-[120px] !bg-sky-50 !border-sky-200 !text-sky-700 hover:!bg-sky-100 hover:!border-sky-300"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </Button>
          )}
          
          <Button
            variant="light-outline"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}
            disabled={isButtonLoading || isLoading}
            loading={isButtonLoading || isLoading}
            loadingText="Loading..."
            className="min-w-[120px]"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Update
          </Button>
          
          {onClone && (
            <Button
              variant="light-outline"
              onClick={(e) => {
                e.stopPropagation();
                handleClone();
              }}
              disabled={isCloningLoading}
              loading={isCloningLoading}
              loadingText="Cloning..."
              className="min-w-[120px]"
            >
              <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
              Clone
            </Button>
          )}
          
          {onDelete && (
            <Button
              variant="light-outline"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteModal(true);
              }}
              className="min-w-[120px] text-red-600 border-red-300 hover:border-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
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
