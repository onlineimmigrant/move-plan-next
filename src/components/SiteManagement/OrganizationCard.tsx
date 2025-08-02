import React, { useState } from 'react';
import { ArrowTopRightOnSquareIcon, PencilIcon, GlobeAltIcon, AcademicCapIcon, BuildingOfficeIcon, UserGroupIcon, CogIcon, HeartIcon, HomeIcon, BanknotesIcon, ShieldCheckIcon, BeakerIcon, ChartBarIcon, ScaleIcon, CurrencyDollarIcon, BriefcaseIcon, SparklesIcon, UserIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { Organization, organizationTypes } from './types';
import Button from '@/ui/Button';

interface OrganizationCardProps {
  organization: Organization;
  onEdit: (org: Organization) => void;
}

export default function OrganizationCard({ organization, onEdit }: OrganizationCardProps) {
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [faviconLoadFailed, setFaviconLoadFailed] = useState(false);

  const getTypeInfo = (type: string) => {
    return organizationTypes.find(t => t.value === type) || { label: type, icon: '🏢' };
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      'immigration': UserIcon,
      'solicitor': ScaleIcon,
      'finance': CurrencyDollarIcon,
      'education': AcademicCapIcon,
      'job': BriefcaseIcon,
      'beauty': SparklesIcon,
      'doctor': HeartIcon,
      'services': WrenchScrewdriverIcon,
      'general': BuildingOfficeIcon,
    };
    return icons[type as keyof typeof icons] || BuildingOfficeIcon;
  };

  const typeInfo = getTypeInfo(organization.type);
  const TypeIcon = getTypeIcon(organization.type);

  // Extract domain from URL for logo/favicon
  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  };

  const primaryUrl = organization.base_url || organization.base_url_local;
  const domain = primaryUrl ? getDomainFromUrl(primaryUrl) : null;

  // Determine which icon to show based on availability and load states
  const renderIcon = () => {
    // Priority 1: Custom settings image (if available and not failed)
    if (organization.settings?.image && !imageLoadFailed) {
      return (
        <img
          src={organization.settings.image}
          alt=""
          className="w-7 h-7 rounded-lg"
          onError={() => setImageLoadFailed(true)}
        />
      );
    }
    
    // Priority 2: Domain favicon (if available and not failed)
    if (domain && !faviconLoadFailed) {
      return (
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
          alt=""
          className="w-7 h-7"
          onError={() => setFaviconLoadFailed(true)}
        />
      );
    }
    
    // Priority 3: Type-based icon (fallback)
    return <TypeIcon className="w-7 h-7 text-gray-500" />;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200/60 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 backdrop-blur-sm">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center space-x-4">
          {/* Icon/Logo */}
          <div className="w-12 h-12 rounded-xl bg-gray-50/50 border border-gray-200/60 flex items-center justify-center backdrop-blur-sm">
            {renderIcon()}
          </div>
          
          {/* Name and Type */}
          <div className="flex-1">
            <h3 className="text-lg font-light text-gray-900 tracking-tight">{organization.name}</h3>
            <p className="text-sm text-gray-500 font-light capitalize mt-1">{typeInfo.label}</p>
          </div>
          
          {/* Edit Button */}
          <Button
            onClick={() => onEdit(organization)}
            variant="outline"
            className="text-sm font-light border-gray-200/60 text-gray-600 hover:text-sky-600 hover:border-sky-200 transition-colors duration-200"
          >
            Edit
          </Button>
        </div>
      </div>

      {/* URLs */}
      {(organization.base_url || organization.base_url_local) && (
        <div className="flex justify-between items-center border-t border-gray-200/60 px-6 py-4 space-y-3 bg-gray-50/30">
          {organization.base_url && (
            <a 
              href={organization.base_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-x-2 text-sky-600 hover:text-sky-500 text-sm font-light transition-colors duration-200 group"
            >
              <GlobeAltIcon className="w-4 h-4" />
              Live Site
              <ArrowTopRightOnSquareIcon className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </a>
          )}
          
          {organization.base_url_local && (
            <a 
              href={organization.base_url_local} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-x-2 text-gray-600 hover:text-gray-700 text-sm font-light transition-colors duration-200 group"
            >
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              Development
              <ArrowTopRightOnSquareIcon className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
