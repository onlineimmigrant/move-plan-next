import React from 'react';
import { Organization } from './types';
import SiteMapTree from './SiteMapTree';

interface SiteMapProps {
  organization: Organization;
  session: any;
  onPageSelect?: (url: string) => void;
}

export default function SiteMap({ organization, session, onPageSelect }: SiteMapProps) {
  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Site Map Tree */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <SiteMapTree 
          organization={organization}
          session={session}
          onPageSelect={onPageSelect}
          compact={false}
        />
      </div>
    </div>
  );
}
