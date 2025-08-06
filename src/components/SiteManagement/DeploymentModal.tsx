import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Organization } from './types';
import SiteDeployment from './SiteDeployment';

interface DeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization;
  session: any;
  onDeploymentComplete?: () => void;
}

export default function DeploymentModal({ isOpen, onClose, organization, session, onDeploymentComplete }: DeploymentModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white/95 backdrop-blur-sm w-full h-full flex flex-col font-light" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-3 sm:px-4 py-2.5 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            {/* Left Side - Title and Description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                {/* Deployment Icon */}
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-light text-lg shadow-sm">
                  🚀
                </div>
                
                {/* Title Section */}
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg font-light tracking-tight text-gray-900 truncate">
                    Deploy {organization.name}
                  </h1>
                  <p className="text-sm font-light text-gray-600/80 mt-0.5 truncate">
                    Deploy your site to Vercel with custom domain
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side - Close Button */}
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-xl transition-all duration-300 backdrop-blur-sm"
                title="Close"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <SiteDeployment
            organization={organization}
            session={session}
            onDeploymentComplete={(baseUrl) => {
              console.log('DeploymentModal: Deployment completed with baseUrl:', baseUrl);
              // Call the parent callback if provided
              if (onDeploymentComplete) {
                onDeploymentComplete();
              }
              // Close modal after successful deployment
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
