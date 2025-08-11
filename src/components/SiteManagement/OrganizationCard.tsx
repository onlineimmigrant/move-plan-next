import React from 'react';
import { ArrowTopRightOnSquareIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { Organization, organizationTypes } from './types';

interface OrganizationCardProps {
  organization: Organization;
  onEdit: (org: Organization) => void;
}

export default function OrganizationCard({ organization, onEdit }: OrganizationCardProps) {

  const getTypeInfo = (type: string) => {
    return organizationTypes.find(t => t.value === type) || { label: type, icon: '🏢' };
  };

  // Generate a consistent color for a given URL/domain
  const getWebsiteColor = (url: string) => {
    try {
      // Clean up URL - ensure it has protocol
      let cleanUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        cleanUrl = `https://${url}`;
      }
      
      const domain = new URL(cleanUrl).hostname;
      
      // Generate a hash from the domain name
      let hash = 0;
      for (let i = 0; i < domain.length; i++) {
        const char = domain.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      // Define a curated set of beautiful colors
      const colors = [
        { bg: 'bg-blue-500', text: 'text-white', ring: 'ring-blue-200' },
        { bg: 'bg-purple-500', text: 'text-white', ring: 'ring-purple-200' },
        { bg: 'bg-pink-500', text: 'text-white', ring: 'ring-pink-200' },
        { bg: 'bg-indigo-500', text: 'text-white', ring: 'ring-indigo-200' },
        { bg: 'bg-teal-500', text: 'text-white', ring: 'ring-teal-200' },
        { bg: 'bg-green-500', text: 'text-white', ring: 'ring-green-200' },
        { bg: 'bg-orange-500', text: 'text-white', ring: 'ring-orange-200' },
        { bg: 'bg-red-500', text: 'text-white', ring: 'ring-red-200' },
        { bg: 'bg-cyan-500', text: 'text-white', ring: 'ring-cyan-200' },
        { bg: 'bg-violet-500', text: 'text-white', ring: 'ring-violet-200' },
        { bg: 'bg-emerald-500', text: 'text-white', ring: 'ring-emerald-200' },
        { bg: 'bg-rose-500', text: 'text-white', ring: 'ring-rose-200' },
        { bg: 'bg-slate-500', text: 'text-white', ring: 'ring-slate-200' },
        { bg: 'bg-amber-500', text: 'text-white', ring: 'ring-amber-200' },
        { bg: 'bg-lime-500', text: 'text-white', ring: 'ring-lime-200' }
      ];
      
      // Use hash to select color consistently
      const colorIndex = Math.abs(hash) % colors.length;
      return colors[colorIndex];
    } catch (error) {
      console.error('Error generating website color:', error);
      return { bg: 'bg-gray-500', text: 'text-white', ring: 'ring-gray-200' };
    }
  };

  const typeInfo = getTypeInfo(organization.type);

  // Extract domain from URL for reference
  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  };

  const primaryUrl = organization.base_url || organization.base_url_local;
  const domain = primaryUrl ? getDomainFromUrl(primaryUrl) : null;

  return (
    <div 
      onClick={() => onEdit(organization)}
      className="group relative overflow-hidden bg-white/95 rounded-2xl border border-black/8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_50px_rgba(0,0,0,0.12)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] cursor-pointer"
      style={{
        backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
        WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
      }}
    >
      {/* Subtle gradient overlay for premium feel */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-gray-100/20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Main Content */}
      <div className="relative p-8">
        <div className="flex items-start justify-between gap-6">
          {/* Left Side - Organization Info */}
          <div className="flex-1 min-w-0">
            {/* Organization Info */}
            <div className="pt-2">
              <h3 className="text-[20px] font-semibold text-gray-900 tracking-[-0.02em] antialiased truncate leading-tight mb-2">
                {organization.name}
              </h3>
              <p className="text-[15px] text-gray-600 font-medium antialiased capitalize">
                {typeInfo.label}
              </p>
            </div>
          </div>

          {/* Right Side - Live Site Preview */}
          {organization.base_url && (
            <div className="flex-shrink-0 w-24 h-16">
              <div className="w-full h-full rounded-lg border border-black/6 overflow-hidden shadow-sm backdrop-blur-sm group/preview">
                {(() => {
                  const websiteColor = getWebsiteColor(organization.base_url);
                  return (
                    <div className={`w-full h-full ${websiteColor.bg} transition-all duration-300 group-hover/preview:scale-105 ring-1 ${websiteColor.ring}`}>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Apple-style URLs Footer - Fully optimized */}
      {(organization.base_url || organization.base_url_local) && (
        <div 
          className="relative border-t border-black/6 px-8 py-6 bg-gray-50/50"
          style={{
            backdropFilter: 'blur(16px) saturate(160%)',
            WebkitBackdropFilter: 'blur(16px) saturate(160%)',
          }}
        >
          <div className="flex items-center justify-between space-x-8">
            {organization.base_url && (
              <a 
                href={organization.base_url} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-x-2 text-gray-700 hover:text-gray-900 text-[13px] font-medium antialiased transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group/link hover:scale-[1.02] flex-1"
              >
                <div className="flex items-center gap-x-2 flex-1 min-w-0">
                  <span className="truncate">Live Site</span>
                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 text-gray-500" />
                </div>
              </a>
            )}
            
            {organization.base_url_local && (
              <a 
                href={organization.base_url_local} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-x-2 text-gray-600 hover:text-gray-800 text-[13px] font-medium antialiased transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group/dev hover:scale-[1.02] flex-1"
              >
                <div className="flex items-center gap-x-2 flex-1 min-w-0">
                  <span className="truncate">Development</span>
                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-300 group-hover/dev:translate-x-0.5 group-hover/dev:-translate-y-0.5 text-gray-500" />
                </div>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
