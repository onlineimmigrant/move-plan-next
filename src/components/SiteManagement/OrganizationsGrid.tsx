import React, { useMemo } from 'react';
import { GlobeAltIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Organization } from './types';
import OrganizationCard from './OrganizationCard';
import { useThemeColors } from '@/hooks/useThemeColors';

interface OrganizationsGridProps {
  organizations: Organization[];
  canCreateMore: boolean;
  onCreateNew: () => void;
  onEditOrganization: (org: Organization) => void;
  onPreviewOrganization?: (org: Organization) => void;
  onDeployOrganization?: (org: Organization) => void;
  onCloneOrganization?: (org: Organization, customName: string) => void;
  onDeleteOrganization?: (org: Organization) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  loadingOrganizationId?: string | null;
  mostRecentOrganizationId?: string | null;
}

export default function OrganizationsGrid({ 
  organizations, 
  canCreateMore, 
  onCreateNew, 
  onEditOrganization,
  onPreviewOrganization,
  onDeployOrganization,
  onCloneOrganization,
  onDeleteOrganization,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  loadingOrganizationId = null,
  mostRecentOrganizationId = null
}: OrganizationsGridProps) {
  const themeColors = useThemeColors();

  if (organizations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24 px-4 relative">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50/50 via-white to-indigo-50/50 rounded-3xl"></div>
        <div className="relative z-10">
          <div 
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-8 border-2 shadow-lg"
            style={{
              background: `linear-gradient(to bottom right, ${themeColors.cssVars.primary.lighter}, ${themeColors.cssVars.primary.light})`,
              borderColor: themeColors.cssVars.primary.light,
            }}
          >
            <GlobeAltIcon 
              className="w-10 h-10"
              style={{ color: themeColors.cssVars.primary.base }}
            />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">No Sites Yet</h3>
          <p className="text-gray-600 mb-10 max-w-md text-lg">Create your first organization site to get started with managing your digital presence.</p>
          {canCreateMore && (
            <button
              onClick={onCreateNew}
              className="inline-flex items-center px-8 py-4 text-white rounded-2xl font-semibold transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
              style={{
                background: `linear-gradient(to right, ${themeColors.cssVars.primary.base}, ${themeColors.cssVars.primary.active})`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `linear-gradient(to right, ${themeColors.cssVars.primary.hover}, ${themeColors.cssVars.primary.active})`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `linear-gradient(to right, ${themeColors.cssVars.primary.base}, ${themeColors.cssVars.primary.active})`;
              }}
            >
              <PlusIcon className="w-6 h-6 mr-3" />
              Create Your First Site
            </button>
          )}
        </div>
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
    <div className="w-full mb-4">
      {/* Enhanced Header with Glassmorphism Background */}
      <div className="bg-gradient-to-r from-gray-50/80 to-white/80 backdrop-blur-sm border border-gray-200/40 rounded-2xl p-6 shadow-lg shadow-gray-100/50 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">Active Sites</h3>
            <p className="text-sm text-gray-500 font-medium">Deployed sites you manage</p>
          </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => {
              const container = document.querySelector('.organizations-scroll-container');
              container?.scrollBy({ left: -200, behavior: 'smooth' });
            }}
            className="p-3 rounded-xl border-2 border-gray-200 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
            style={{
              ['--hover-border' as any]: themeColors.cssVars.primary.light,
              ['--hover-bg' as any]: themeColors.cssVars.primary.lighter,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = themeColors.cssVars.primary.light;
              e.currentTarget.style.backgroundColor = themeColors.cssVars.primary.lighter;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '';
              e.currentTarget.style.backgroundColor = '';
            }}
          >
            <ChevronLeftIcon 
              className="w-5 h-5 text-gray-600 transition-colors"
              onMouseEnter={(e) => {
                (e.currentTarget as SVGElement).style.color = themeColors.cssVars.primary.base;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as SVGElement).style.color = '';
              }}
            />
          </button>
          <button 
            onClick={() => {
              const container = document.querySelector('.organizations-scroll-container');
              container?.scrollBy({ left: 200, behavior: 'smooth' });
            }}
            className="p-3 rounded-xl border-2 border-gray-200 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = themeColors.cssVars.primary.light;
              e.currentTarget.style.backgroundColor = themeColors.cssVars.primary.lighter;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '';
              e.currentTarget.style.backgroundColor = '';
            }}
          >
            <ChevronRightIcon 
              className="w-5 h-5 text-gray-600 transition-colors"
              onMouseEnter={(e) => {
                (e.currentTarget as SVGElement).style.color = themeColors.cssVars.primary.base;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as SVGElement).style.color = '';
              }}
            />
          </button>
          </div>
        </div>
      </div>
      
      {/* Horizontal Scrolling Container */}
      <div className="relative">
        <div className="organizations-scroll-container overflow-x-auto scrollbar-thin scrollbar-thumb-sky-300 scrollbar-track-gray-100 hover:scrollbar-thumb-sky-400 py-4 scroll-smooth">
          <div className="flex gap-4 lg:gap-5 min-w-max px-1">
            {organizations.map((org) => (
              <div key={org.id} className="flex-shrink-0 w-48">
                <OrganizationCard
                  organization={org}
                  onEdit={onEditOrganization}
                  onPreview={onPreviewOrganization}
                  onDeploy={onDeployOrganization}
                  onClone={onCloneOrganization}
                  onDelete={onDeleteOrganization}
                  isLoading={loadingOrganizationId === org.id}
                  isMostRecent={mostRecentOrganizationId === org.id}
                />
              </div>
            ))}
            
            {/* Load More Button in scrolling line */}
            {hasMore && onLoadMore && (
              <div className="flex-shrink-0 w-48 flex items-center justify-center">
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
