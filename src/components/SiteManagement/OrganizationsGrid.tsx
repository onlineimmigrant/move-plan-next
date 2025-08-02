import React from 'react';
import { GlobeAltIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Organization } from './types';
import OrganizationCard from './OrganizationCard';

interface OrganizationsGridProps {
  organizations: Organization[];
  canCreateMore: boolean;
  onCreateNew: () => void;
  onEditOrganization: (org: Organization) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export default function OrganizationsGrid({ 
  organizations, 
  canCreateMore, 
  onCreateNew, 
  onEditOrganization,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false
}: OrganizationsGridProps) {
  if (organizations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-4">
        <GlobeAltIcon className="w-16 h-16 text-gray-300 mx-auto mb-6" />
        <h3 className="text-2xl font-light text-gray-900 mb-3 tracking-tight">No Sites Yet</h3>
        <p className="text-gray-500 mb-8 max-w-md font-light leading-relaxed">Create your first organization site to get started with managing your digital presence.</p>
        {canCreateMore && (
          <button
            onClick={onCreateNew}
            className="inline-flex items-center px-8 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-all duration-200 font-light shadow-sm hover:shadow-md"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Your First Site
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Grid Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
        {organizations.map((org) => (
          <OrganizationCard
            key={org.id}
            organization={org}
            onEdit={onEditOrganization}
          />
        ))}
      </div>
      
      {/* Load More Button - styled as link and positioned above Add New Site */}
      {hasMore && onLoadMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-x-2 text-sky-600 hover:text-sky-500 text-lg font-light transition-colors duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingMore ? (
              <>
                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading more...
              </>
            ) : (
              <>
                Load more organizations
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}

      {/* Add New Site Card - if can create more */}
      {canCreateMore && (
        <div className="mt-8">
          <button
            onClick={onCreateNew}
            className="w-full min-h-[140px] sm:min-h-[160px] border-2 border-dashed border-gray-200/60 rounded-xl hover:border-sky-300 hover:bg-sky-50/30 transition-all duration-300 flex flex-col items-center justify-center text-gray-400 hover:text-sky-600 group backdrop-blur-sm"
          >
            <PlusIcon className="w-10 h-10 mb-3 group-hover:scale-110 transition-transform duration-300" />
            <span className="font-light text-lg">Add New Site</span>
            <span className="font-light text-sm text-gray-400 mt-1">Expand your digital presence</span>
          </button>
        </div>
      )}
    </div>
  );
}
