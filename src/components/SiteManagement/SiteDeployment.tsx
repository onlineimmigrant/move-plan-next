import React, { useState, useEffect } from 'react';
import { CloudArrowUpIcon, CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import Button from '@/ui/Button';
import { Organization } from './types';

interface SiteDeploymentProps {
  organization: Organization;
  session: any; // Add session prop
  onDeploymentComplete?: (baseUrl: string) => void;
}

interface DeploymentStatus {
  status: 'not_deployed' | 'created' | 'building' | 'ready' | 'error' | 'canceled';
  baseUrl?: string;
  deployedUrl?: string;
  vercelProjectId?: string;
  vercelDeploymentId?: string;
  errorMessage?: string;
  estimatedReadyTime?: string;
}

export default function SiteDeployment({ organization, session, onDeploymentComplete }: SiteDeploymentProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Initialize deployment status with smarter detection
  const getInitialDeploymentStatus = (): DeploymentStatus => {
    // Strong indicators of deployment
    const hasVercelProject = organization.vercel_project_id;
    const hasBaseUrl = organization.base_url;
    const hasVercelUrl = organization.base_url && (
      organization.base_url.includes('.vercel.app') || 
      organization.base_url.includes('vercel.com')
    );
    
    // If we have strong deployment indicators, assume it's deployed
    if ((hasVercelProject && hasBaseUrl) || hasVercelUrl) {
      return {
        status: 'ready',
        baseUrl: organization.base_url || undefined,
        deployedUrl: organization.base_url || undefined,
        vercelProjectId: organization.vercel_project_id || undefined,
        vercelDeploymentId: organization.vercel_deployment_id || undefined,
      };
    }
    
    // Check if deployment status indicates it's ready but missing URLs
    if (organization.deployment_status === 'ready' && organization.vercel_project_id) {
      return {
        status: 'ready',
        baseUrl: organization.base_url || undefined,
        vercelProjectId: organization.vercel_project_id || undefined,
        vercelDeploymentId: organization.vercel_deployment_id || undefined,
      };
    }
    
    // Fall back to the stored deployment status
    return {
      status: organization.deployment_status || 'not_deployed',
      baseUrl: organization.base_url || undefined,
      vercelProjectId: organization.vercel_project_id || undefined,
      vercelDeploymentId: organization.vercel_deployment_id || undefined,
    };
  };
  
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>(getInitialDeploymentStatus());
  const [gitRepository, setGitRepository] = useState('https://github.com/onlineimmigrant/move-plan-next');
  const [gitBranch, setGitBranch] = useState('main');
  const [error, setError] = useState<string | null>(null);

  // Validate deployment status on component mount
  useEffect(() => {
    const validateDeploymentStatus = async () => {
      // If we have a Vercel project ID and deployment ID, verify the status
      if (organization.vercel_project_id && organization.vercel_deployment_id && session?.access_token) {
        try {
          const response = await fetch(
            `/api/organizations/deploy?organizationId=${organization.id}&deploymentId=${organization.vercel_deployment_id}`,
            {
              headers: {
                'Authorization': `Bearer ${session.access_token}`
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            
            if (data.data && data.data.deploymentStatus) {
              setDeploymentStatus(prev => ({
                ...prev,
                status: data.data.deploymentStatus,
                baseUrl: data.data.baseUrl || prev.baseUrl,
                deployedUrl: data.data.deployedUrl || prev.deployedUrl,
              }));
            }
          }
        } catch (err) {
          console.error('Failed to validate deployment status:', err);
          // Don't update status on error - keep the initial detection
        }
      }
      setIsInitializing(false);
    };

    validateDeploymentStatus();
  }, [organization.id, organization.vercel_project_id, organization.vercel_deployment_id, session?.access_token]);

  const handleDeploy = async () => {
    setIsDeploying(true);
    setError(null);

    try {
      if (!session?.access_token) {
        throw new Error('No access token available. Please log in again.');
      }

      console.log('Deploying with session:', { 
        hasAccessToken: !!session.access_token,
        tokenLength: session.access_token?.length,
        organizationId: organization.id 
      });

      const response = await fetch('/api/organizations/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          organizationId: organization.id,
          gitRepository,
          branch: gitBranch
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Deployment failed');
      }

      setDeploymentStatus({
        status: data.data.deploymentStatus,
        baseUrl: data.data.baseUrl,
        vercelProjectId: data.data.vercelProjectId,
        vercelDeploymentId: data.data.vercelDeploymentId,
        estimatedReadyTime: data.data.estimatedReadyTime
      });

      // Start polling for deployment status
      pollDeploymentStatus(data.data.vercelDeploymentId);

    } catch (err: any) {
      setError(err.message || 'Failed to deploy site');
    } finally {
      setIsDeploying(false);
    }
  };

  const pollDeploymentStatus = async (deploymentId?: string) => {
    if (!deploymentId) return;

    const poll = async () => {
      try {
        if (!session?.access_token) {
          console.error('No access token available for polling');
          return;
        }

        const response = await fetch(
          `/api/organizations/deploy?organizationId=${organization.id}&deploymentId=${deploymentId}`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          const newStatus = data.deployment.vercelStatus?.state?.toLowerCase() || data.deployment.status;
          
          setDeploymentStatus(prev => ({
            ...prev,
            status: newStatus,
            deployedUrl: data.deployment.deployed_url || data.deployment.vercelStatus?.url,
            errorMessage: data.deployment.error_message
          }));

          // If deployment is complete, notify parent and stop polling
          if (newStatus === 'ready') {
            const finalUrl = data.deployment.deployed_url || data.deployment.vercelStatus?.url;
            if (finalUrl && onDeploymentComplete) {
              onDeploymentComplete(finalUrl);
            }
            return; // Stop polling
          }

          // Continue polling if still building
          if (newStatus === 'building' || newStatus === 'created') {
            setTimeout(poll, 10000); // Poll every 10 seconds
          }
        }
      } catch (error) {
        console.error('Error polling deployment status:', error);
      }
    };

    // Start polling after a short delay
    setTimeout(poll, 5000);
  };

  const getStatusIcon = () => {
    if (isInitializing) {
      return <ClockIcon className="h-5 w-5 text-blue-500 animate-spin" />;
    }
    
    switch (deploymentStatus.status) {
      case 'ready':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'building':
      case 'created':
        return <ClockIcon className="h-5 w-5 text-yellow-500 animate-spin" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <CloudArrowUpIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (isInitializing) {
      return 'Checking Status...';
    }
    
    switch (deploymentStatus.status) {
      case 'ready':
        return 'Deployed Successfully';
      case 'building':
        return 'Building...';
      case 'created':
        return 'Deployment Created';
      case 'error':
        return 'Deployment Failed';
      case 'canceled':
        return 'Deployment Canceled';
      default:
        return 'Not Deployed';
    }
  };

  const getStatusColor = () => {
    if (isInitializing) {
      return 'text-blue-600 bg-blue-50 border-blue-200';
    }
    
    switch (deploymentStatus.status) {
      case 'ready':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'building':
      case 'created':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Site Deployment</h3>
          <p className="text-sm text-gray-500 mt-1">Deploy your site to Vercel</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor()}`}>
          {getStatusIcon()}
          {getStatusText()}
        </div>
      </div>

      {/* Current URLs */}
      {(deploymentStatus.baseUrl || deploymentStatus.deployedUrl) && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Site URLs</h4>
          <div className="space-y-2">
            {deploymentStatus.deployedUrl && (
              <div>
                <label className="text-xs text-gray-500">Live URL:</label>
                <a 
                  href={deploymentStatus.deployedUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  {deploymentStatus.deployedUrl}
                </a>
              </div>
            )}
            {deploymentStatus.baseUrl && deploymentStatus.baseUrl !== deploymentStatus.deployedUrl && (
              <div>
                <label className="text-xs text-gray-500">Expected URL:</label>
                <p className="text-sm text-gray-700">{deploymentStatus.baseUrl}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Deployment Form */}
      {deploymentStatus.status === 'not_deployed' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Git Repository
            </label>
            <input
              type="url"
              value={gitRepository}
              onChange={(e) => setGitRepository(e.target.value)}
              placeholder="https://github.com/username/repository"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              GitHub repository URL for your site
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch
            </label>
            <input
              type="text"
              value={gitBranch}
              onChange={(e) => setGitBranch(e.target.value)}
              placeholder="main"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <Button
            onClick={handleDeploy}
            disabled={isDeploying || !gitRepository.trim()}
            className="w-full"
          >
            {isDeploying ? 'Deploying...' : 'Deploy to Vercel'}
          </Button>
        </div>
      )}

      {/* Building Status */}
      {(deploymentStatus.status === 'building' || deploymentStatus.status === 'created') && (
        <div className="text-center py-4">
          <div className="animate-spin h-8 w-8 border-2 border-yellow-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">
            Your site is being deployed. This usually takes 2-5 minutes.
          </p>
          {deploymentStatus.estimatedReadyTime && (
            <p className="text-xs text-gray-500 mt-1">
              Estimated completion: {new Date(deploymentStatus.estimatedReadyTime).toLocaleTimeString()}
            </p>
          )}
        </div>
      )}

      {/* Success State */}
      {deploymentStatus.status === 'ready' && deploymentStatus.deployedUrl && (
        <div className="text-center py-4">
          <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-lg font-medium text-gray-900 mb-2">Site Deployed Successfully!</p>
          <div className="space-y-2">
            <a 
              href={deploymentStatus.deployedUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Visit Live Site →
            </a>
            <p className="text-xs text-gray-500">
              Your site is now live at: {deploymentStatus.deployedUrl}
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {deploymentStatus.status === 'error' && (
        <div className="text-center py-4">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-lg font-medium text-gray-900 mb-2">Deployment Failed</p>
          {deploymentStatus.errorMessage && (
            <p className="text-sm text-red-600 mb-4">{deploymentStatus.errorMessage}</p>
          )}
          <Button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="bg-red-600 hover:bg-red-700"
          >
            Retry Deployment
          </Button>
        </div>
      )}

      {/* Development Info */}
      <div className="mt-6 p-3 bg-gray-50 rounded-lg">
        <h5 className="text-sm font-medium text-gray-900 mb-2">Requirements</h5>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Your repository must contain a Next.js application</li>
          <li>• Vercel token must be configured by administrator</li>
          <li>• Repository must be accessible (public or with proper permissions)</li>
          <li>• Build scripts must be properly configured in package.json</li>
        </ul>
      </div>
    </div>
  );
}
