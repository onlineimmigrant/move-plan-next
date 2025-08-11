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
      <div className="flex flex-col items-center justify-center text-center py-24 px-4">
        <div 
          className="w-20 h-20 rounded-2xl bg-gray-100/60 flex items-center justify-center mb-8 shadow-sm border border-black/5"
          style={{
            backdropFilter: 'blur(16px) saturate(150%)',
            WebkitBackdropFilter: 'blur(16px) saturate(150%)',
          }}
        >
          <GlobeAltIcon className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-[28px] font-semibold text-gray-900 mb-4 tracking-[-0.02em] antialiased">No Sites Yet</h3>
        <p className="text-[16px] text-gray-600 mb-12 max-w-sm font-medium antialiased leading-relaxed">Create your first organization site to get started with managing your digital presence.</p>
        {canCreateMore && (
          <button
            onClick={onCreateNew}
            className="inline-flex items-center px-8 py-4 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] font-semibold antialiased shadow-[0_8px_30px_rgba(59,130,246,0.15)] hover:shadow-[0_16px_50px_rgba(59,130,246,0.25)] hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backdropFilter: 'blur(24px) saturate(200%)',
              WebkitBackdropFilter: 'blur(24px) saturate(200%)',
            }}
          >
            <PlusIcon className="w-5 h-5 mr-3" />
            Create Your First Site
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Grid Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 sm:gap-8">
        {organizations.map((org) => (
          <OrganizationCard
            key={org.id}
            organization={org}
            onEdit={onEditOrganization}
          />
        ))}
      </div>
      
      {/* Load More Button - Apple-styled */}
      {hasMore && onLoadMore && (
        <div className="mt-12 flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-x-3 text-blue-600 hover:text-blue-500 text-[16px] font-semibold antialiased transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoadingMore ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-blue-300 border-t-blue-600 animate-spin"></div>
                <span>Loading more...</span>
              </>
            ) : (
              <>
                <span>Load more organizations</span>
                <svg className="w-5 h-5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}

      {/* Add New Site Card - Clean & Simple */}
      {canCreateMore && (
        <div className="mt-12">
          <button
            onClick={onCreateNew}
            className="group relative w-full min-h-[160px] bg-white/90 border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-2xl transition-all duration-300 hover:bg-blue-50/30 flex flex-col items-center justify-center"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <PlusIcon className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Add New Site</h3>
            <p className="text-sm text-gray-600">Create a new organization site</p>
          </button>
        </div>
      )}
    </div>
  );
}
