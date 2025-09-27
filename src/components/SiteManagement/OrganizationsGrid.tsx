import React, { useMemo } from 'react';
import { GlobeAltIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Organization } from './types';
import OrganizationCard from './OrganizationCard';

interface OrganizationsGridProps {
  organizations: Organization[];
  canCreateMore: boolean;
  onCreateNew: () => void;
  onEditOrganization: (org: Organization) => void;
  onDeployOrganization?: (org: Organization) => void;
  onCloneOrganization?: (org: Organization) => void;
  onDeleteOrganization?: (org: Organization) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  loadingOrganizationId?: string | null;
}

export default function OrganizationsGrid({ 
  organizations, 
  canCreateMore, 
  onCreateNew, 
  onEditOrganization,
  onDeployOrganization,
  onCloneOrganization,
  onDeleteOrganization,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  loadingOrganizationId = null
}: OrganizationsGridProps) {
  if (organizations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-4">
        <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center mb-6 border border-gray-200">
          <GlobeAltIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">No Sites Yet</h3>
        <p className="text-gray-600 mb-8 max-w-md">Create your first organization site to get started with managing your digital presence.</p>
        {canCreateMore && (
          <button
            onClick={onCreateNew}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors duration-200 shadow-sm"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Your First Site
          </button>
        )}
      </div>
    );
  }

  // Debug log in development to see the organization order
  if (process.env.NODE_ENV === 'development') {
    console.log('OrganizationsGrid received organizations:', organizations.map(org => ({
      name: org.name,
      type: org.type,
      isPlatform: org.type === 'platform' || org.type === 'general',
      created_at: org.created_at
    })));
  }

  return (
    <div className="w-full mb-6">
      {/* Horizontal Scrolling Container */}
      <div className="relative">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-2">
          <div className="flex gap-4 lg:gap-5 min-w-max px-1">
            {organizations.map((org) => (
              <div key={org.id} className="flex-shrink-0 w-80">
                <OrganizationCard
                  organization={org}
                  onEdit={onEditOrganization}
                  onDeploy={onDeployOrganization}
                  onClone={onCloneOrganization}
                  onDelete={onDeleteOrganization}
                  isLoading={loadingOrganizationId === org.id}
                />
              </div>
            ))}
            
            {/* Load More Button in scrolling line */}
            {hasMore && onLoadMore && (
              <div className="flex-shrink-0 w-80 flex items-center justify-center">
                <button
                  onClick={onLoadMore}
                  disabled={isLoadingMore}
                  className="inline-flex items-center gap-x-2 px-6 py-3 text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed h-fit"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>Load more</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Scroll hint gradient */}
        {organizations.length > 3 && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
        )}
      </div>



    </div>
  );
}
