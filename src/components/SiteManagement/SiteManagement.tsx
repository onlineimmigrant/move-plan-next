'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import LoadingStates from './LoadingStates';
import Header from './Header';
import ErrorDisplay from './ErrorDisplay';
import OrganizationsGrid from './OrganizationsGrid';
import CreateModal from './CreateModal';
import DeploymentModal from './DeploymentModal';
import EditModal from './EditModal';
import AccessRestricted from './AccessRestricted';
import PlatformStatsWidget from './PlatformStatsWidget';
// import SampleOrganizationsShowcase from '../SampleOrganizationsShowcase';
import { Organization, Settings, UserProfile, HeroData } from './types';
import { GlobeAltIcon, AcademicCapIcon, DocumentTextIcon, BuildingOfficeIcon, BeakerIcon, CogIcon, EyeIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// Inline Sample Organizations Component
interface SampleOrganizationsInlineProps {
  onExplore: (sampleOrg: any) => void;
  onClone: (sampleOrg: any) => void;
}

const SampleOrganizationsInline: React.FC<SampleOrganizationsInlineProps> = ({ onExplore, onClone }) => {
  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/organizations/samples')
      .then(res => res.json())
      .then(data => {
        const allOrgs = (data.sampleTypes || []).flatMap((type: any) => type.organizations || []);
        setSamples(allOrgs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: any } = {
      immigration: GlobeAltIcon, education: AcademicCapIcon, legal: DocumentTextIcon,
      consulting: BuildingOfficeIcon, technology: BeakerIcon, miner: BeakerIcon, realestate: BuildingOfficeIcon
    };
    return icons[type] || CogIcon;
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      immigration: 'from-blue-500 to-indigo-600', education: 'from-emerald-500 to-teal-600',
      legal: 'from-amber-500 to-orange-600', consulting: 'from-purple-500 to-violet-600',
      technology: 'from-pink-500 to-rose-600', miner: 'from-gray-600 to-gray-700',
      realestate: 'from-green-500 to-emerald-600'
    };
    return colors[type] || 'from-gray-500 to-gray-600';
  };

  const getTypeName = (type: string) => {
    const names: { [key: string]: string } = {
      immigration: 'Immigration', education: 'Education', legal: 'Legal',
      consulting: 'Consulting', technology: 'Technology', miner: 'Mining',
      realestate: 'Real Estate'
    };
    return names[type] || 'Other';
  };

  if (loading) return <div className="mb-8 py-4 text-center text-gray-500">Loading samples...</div>;
  if (samples.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Sample Organizations</h3>
          <p className="text-sm text-gray-600">Explore different organization types</p>
        </div>
        <div className="flex space-x-1">
          <button onClick={() => scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' })} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
            <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
          </button>
          <button onClick={() => scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
            <ChevronRightIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex space-x-4 overflow-x-auto pb-2 scrollbar-none">
        {samples.map((org: any) => {
          const TypeIcon = getTypeIcon(org.type);
          const typeColor = getTypeColor(org.type);
          return (
            <div key={org.id} className="flex-shrink-0 w-48 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 overflow-hidden">
              <div className={`bg-gradient-to-br ${typeColor} p-4 relative`}>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <TypeIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{getTypeName(org.type)}</p>
                  </div>
                </div>
                {org.base_url && <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full"></div>}
              </div>
              <div className="p-4">
                <p className="text-sm font-medium text-gray-900 mb-1 truncate">{org.name}</p>
                <p className="text-xs text-gray-500 mb-3">Sample organization</p>
                <div className="space-y-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onExplore(org); }}
                    className="w-full flex items-center justify-center space-x-1 text-xs text-gray-600 hover:text-gray-800 py-1.5 px-2 rounded border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <EyeIcon className="w-3 h-3" />
                    <span>Explore</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onClone(org); }}
                    className="w-full flex items-center justify-center text-xs text-white bg-sky-600 hover:bg-sky-700 py-1.5 px-2 rounded transition-colors"
                  >
                    <span>Clone Site</span>
                  </button>
                  {org.base_url && (
                    <div className="text-center">
                      <div className="inline-flex items-center space-x-1 text-xs text-green-600 font-medium">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Live</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function SiteManagement() {
  const { session, isLoading } = useAuth();
  const headerRef = useRef<{ focusSearch: () => void }>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [canCreateMore, setCanCreateMore] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeploymentModalOpen, setIsDeploymentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [createdOrganization, setCreatedOrganization] = useState<Organization | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSort, setActiveSort] = useState('name');
  const [displayLimit, setDisplayLimit] = useState(6);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadingOrganizationId, setLoadingOrganizationId] = useState<string | null>(null);
  const [mostRecentOrganizationId, setMostRecentOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    console.log('Session state:', session);
    if (session?.access_token) {
      fetchOrganizations();
    }
  }, [session?.access_token]);

  // Update filtered organizations when organizations, search, filter, or sort changes
  useEffect(() => {
    let filtered = [...organizations];
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((org: Organization) =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply type filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter((org: Organization) => org.type === activeFilter);
    }
    
    // Find the most recently created/updated organization (excluding platform orgs)
    const nonPlatformOrgs = filtered.filter(org => org.type !== 'platform' && org.type !== 'general');
    const mostRecentOrg = nonPlatformOrgs.length > 0 
      ? nonPlatformOrgs.reduce((latest, current) => {
          const latestTime = new Date(latest.created_at || '').getTime() || 0;
          const currentTime = new Date(current.created_at || '').getTime() || 0;
          return currentTime > latestTime ? current : latest;
        })
      : null;

    // Update the most recent organization ID for highlighting
    setMostRecentOrganizationId(mostRecentOrg?.id || null);

    // Apply sorting to non-platform organizations
    const platformOrgs = filtered.filter(org => org.type === 'platform' || org.type === 'general');
    const otherOrgs = filtered.filter(org => org.type !== 'platform' && org.type !== 'general');
    
    otherOrgs.sort((a, b) => {
      switch (activeSort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'created':
          return (new Date(b.created_at || '').getTime() || 0) - (new Date(a.created_at || '').getTime() || 0);
        case 'updated':
          return (new Date(b.created_at || '').getTime() || 0) - (new Date(a.created_at || '').getTime() || 0);
        default:
          return 0;
      }
    });

    // Custom sorting: Platform first, then most recent org, then the rest
    const sortedOrgs = [];
    
    // Add platform organizations first
    sortedOrgs.push(...platformOrgs);
    
    // Add the most recent organization right after platform orgs (if it exists and isn't already added)
    if (mostRecentOrg && !platformOrgs.includes(mostRecentOrg)) {
      sortedOrgs.push(mostRecentOrg);
    }
    
    // Add remaining organizations (excluding the most recent one if it was already added)
    const remainingOrgs = otherOrgs.filter(org => org !== mostRecentOrg);
    sortedOrgs.push(...remainingOrgs);
    
    filtered = sortedOrgs;
    
    // Apply display limit only if no search query
    if (!searchQuery.trim()) {
      filtered = filtered.slice(0, displayLimit);
    }
    
    setFilteredOrganizations(filtered);
  }, [organizations, searchQuery, activeFilter, activeSort, displayLimit]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
  };

  const handleSortChange = (sort: string) => {
    setActiveSort(sort);
  };

  const handleDeployOrganization = (organization: Organization) => {
    // Open deployment modal or trigger deployment
    setSelectedOrganization(organization);
    setCreatedOrganization(organization);
    setIsDeploymentModalOpen(true);
  };

  const handleCloneOrganization = async (organization: Organization, customName: string) => {
    console.log('SiteManagement handleCloneOrganization called with:', {
      orgName: organization.name,
      customName: customName,
      customNameLength: customName?.length || 0
    });
    
    // Validation to catch empty customName
    if (!customName || !customName.trim()) {
      console.error('Empty customName received in handleCloneOrganization');
      setError('Clone modal did not provide organization name. Please try again.');
      return;
    }
    
    try {
      setError(null);
      
      if (!session?.access_token) {
        throw new Error('No access token available');
      }

      console.log('Cloning organization:', organization.name, 'with new name:', customName);

      const response = await fetch(`/api/organizations/${organization.id}/clone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customName: customName
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to clone organization');
      }

      const result = await response.json();
      console.log('Organization cloned successfully:', result);

      // Log the cloning activity
      await logActivity(result.organization.id, 'created', `Organization "${result.organization.name}" was cloned from "${organization.name}"`);

      // Refresh the organizations list to show the new cloned organization
      fetchOrganizations();
      
    } catch (err: any) {
      setError(err.message || 'Failed to clone organization');
      throw err; // Re-throw so OrganizationCard can handle loading states
    }
  };

  const logActivity = async (organizationId: string, action: 'created' | 'updated' | 'deployed' | 'deleted', details?: string) => {
    try {
      if (!session?.access_token) return;
      
      await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id: organizationId,
          action,
          details,
          user_email: session.user?.email
        })
      });
    } catch (err) {
      console.error('Failed to log activity:', err);
      // Don't throw - activity logging shouldn't break the main flow
    }
  };

  const handleDeleteOrganization = async (organization: Organization) => {
    try {
      setError(null);
      
      if (!session?.access_token) {
        throw new Error('No access token available');
      }

      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete organization');
      }

      // Log the deletion activity
      await logActivity(organization.id, 'deleted', `Organization "${organization.name}" was deleted`);

      // Remove from local state
      setOrganizations(prev => prev.filter(org => org.id !== organization.id));
      setFilteredOrganizations(prev => prev.filter(org => org.id !== organization.id));
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete organization';
      setError(errorMessage);
      // Re-throw the error so the OrganizationCard can handle loading states
      throw new Error(errorMessage);
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onCreateNew: () => {
      if (canCreateMore) {
        handleCreateNew();
      }
    },
    onFocusSearch: () => {
      headerRef.current?.focusSearch();
    },
    onEscape: () => {
      // Close any open modals
      if (isCreateModalOpen) setIsCreateModalOpen(false);
      if (isEditModalOpen) setIsEditModalOpen(false);
      if (isDeploymentModalOpen) setIsDeploymentModalOpen(false);
    }
  });

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    // Simulate loading delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newLimit = displayLimit + 6;
    setDisplayLimit(newLimit);
    
    if (!searchQuery.trim()) {
      setFilteredOrganizations(organizations.slice(0, newLimit));
    }
    
    setIsLoadingMore(false);
  };

  const hasMoreOrganizations = !searchQuery.trim() && organizations.length > displayLimit;

  const testAuth = async () => {
    try {
      console.log('Testing auth with session:', session);
      
      if (!session?.access_token) {
        console.error('No access token available');
        return;
      }

      const response = await fetch('/api/auth-test', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Auth test result:', data);
    } catch (err) {
      console.error('Auth test error:', err);
    }
  };

  const fetchOrganizations = async () => {
    try {
      setFetchLoading(true);
      
      if (!session?.access_token) {
        throw new Error('No access token available');
      }

      console.log('Fetching organizations...'); // Debug log

      const response = await fetch('/api/organizations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('API response status:', response.status); // Debug log
      console.log('API response headers:', Object.fromEntries(response.headers.entries())); // Debug log

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Organizations response:', data); // Debug log
      console.log('User profile:', data.profile); // Debug log
      console.log('Organizations count:', data.organizations?.length); // Debug log
      
      // Limit to first 6 organizations for initial display
      const limitedOrganizations = data.organizations?.slice(0, 6) || [];
      
      setOrganizations(data.organizations || []);
      setFilteredOrganizations(limitedOrganizations);
      setProfile(data.profile);
      setCanCreateMore(data.canCreateMore);
      
      // Debug: Log organization types and user role info
      if (data.organizations) {
        console.log('Organization details:');
        data.organizations.forEach((org: Organization, index: number) => {
          console.log(`${index + 1}. ${org.name} - Type: ${org.type} - Role: ${org.user_role} - Status: ${org.user_status} - Created by: ${org.created_by_email}`);
        });
      }
      
      // Debug: Check if user is admin of general org
      if (data.profile) {
        console.log('User profile details:', data.profile);
        console.log(`Email: ${data.profile.email}`);
        console.log(`Role: ${data.profile.role}`);
        
        // Handle both old and new field names
        const orgId = data.profile.organization_id || data.profile.current_organization_id;
        console.log(`Organization ID: ${orgId}`);
        
        // Find user's organization to check its type
        if (data.organizations && orgId) {
          const userOrganization = data.organizations.find((org: Organization) => org.id === orgId);
          if (userOrganization) {
            console.log(`User's organization type: ${userOrganization.type}`);
            console.log(`Is admin of platform org: ${data.profile.role === 'admin' && userOrganization.type === 'platform'}`);
          } else {
            console.log('User organization not found in organizations list');
          }
        } else {
          console.log('No organizations data or organization ID');
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load organizations';
      setError(errorMessage);
      console.error('Error fetching organizations:', err);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleCreateNew = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateOrganization = async (orgData: Partial<Organization>) => {
    try {
      setIsCreating(true);
      setError(null);

      if (!session?.access_token) {
        throw new Error('No access token available');
      }

      const response = await fetch('/api/organizations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(orgData)
      });

      console.log('Create organization response status:', response.status); // Debug log
      console.log('Create organization request data:', orgData); // Debug log

      const data = await response.json();
      console.log('Create organization response data:', data); // Debug log

      if (!response.ok) {
        console.error('Create organization error:', data); // Debug log
        throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Check if automatic deployment was successful
      if (data.deployment) {
        console.log('✅ Organization created with automatic Vercel project:', data.deployment);
        
        // Show success message about Vercel project creation
        const deploymentMessage = data.deployment.message || 'Vercel project created successfully';
        
        // Store deployment info for user feedback
        if (data.deployment.dashboardUrl) {
          console.log('🚀 Vercel Dashboard URL:', data.deployment.dashboardUrl);
        }
      } else if (data.deploymentError) {
        console.warn('⚠️ Organization created but automatic deployment failed:', data.deploymentError);
      }

      // Return the created organization data
      return data.organization;

    } catch (err: any) {
      setError(err.message || 'Failed to create organization');
      throw err; // Re-throw to let the modal handle the error
    } finally {
      setIsCreating(false);
    }
  };

  // Handle successful organization creation (called from CreateModal)
  const handleOrganizationCreated = async (organization: Organization) => {
    console.log('SiteManagement: handleOrganizationCreated called with:', organization);
    
    // Check if organization already has Vercel project (from automatic deployment)
    if (organization.vercel_project_id) {
      console.log('✅ Organization created with Vercel project, skipping deployment modal');
      
      // Show success message with deployment info
      const message = organization.deployment_status === 'created' 
        ? `Organization "${organization.name}" created successfully with Vercel project! You can deploy it manually from the site management interface.`
        : `Organization "${organization.name}" created successfully!`;
      
      // You can add a toast/notification here if you have one
      console.log(message);
      
    } else {
      console.log('⚠️ Organization created without Vercel project, opening deployment modal');
      
      // Store the created organization for the deployment modal
      setCreatedOrganization(organization);
      
      // Open the deployment modal for manual deployment
      setIsDeploymentModalOpen(true);
    }
    
    // Refresh the organizations list to include the new one
    await fetchOrganizations();
    // Reset search and display limit to show the new organization
    setDisplayLimit(6);
    handleSearch('');
    console.log('SiteManagement: Finished handling organization creation');
  };

  const handleExploreSample = async (sampleOrg: any) => {
    // Convert sample to Organization format and open in EditModal in read-only mode
    const orgForEdit: Organization = {
      id: sampleOrg.id,
      name: sampleOrg.name,
      type: sampleOrg.type,
      base_url: sampleOrg.base_url,
      base_url_local: sampleOrg.base_url_local || '',
      created_at: sampleOrg.created_at,
      created_by_email: sampleOrg.created_by_email || '',
      // Add other required Organization fields with defaults
      settings: sampleOrg.settings || {}
    };
    setIsReadOnlyMode(true); // Set read-only mode
    await handleEditOrganization(orgForEdit);
  };

  const handleCloneSample = async (sampleOrg: any) => {
    // Show clone modal with custom name input
    const customName = prompt(`Enter a name for your cloned ${sampleOrg.type} organization:`, `My ${sampleOrg.name}`);
    if (customName && customName.trim()) {
      const orgForClone: Organization = {
        id: sampleOrg.id,
        name: sampleOrg.name,
        type: sampleOrg.type,
        base_url: sampleOrg.base_url,
        base_url_local: sampleOrg.base_url_local || '',
        created_at: sampleOrg.created_at,
        created_by_email: sampleOrg.created_by_email || '',
        settings: sampleOrg.settings || {}
      };
      await handleCloneOrganization(orgForClone, customName.trim());
    }
  };

  const handleEditOrganization = async (organization: Organization) => {
    try {
      setError(null);
      setLoadingOrganizationId(organization.id);
      setIsEditing(true);
      // Ensure read-only mode is reset for regular organizations (unless explicitly set)
      if (!isReadOnlyMode) {
        setIsReadOnlyMode(false);
      }
      
      if (!session?.access_token) {
        throw new Error('No access token available');
      }

      // Fetch organization details with settings
      const response = await fetch(`/api/organizations/${organization.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Organization data from API:', data); // Debug log
      
      // Create comprehensive organization object with all fields
      const orgWithSettings = {
        ...data.organization,
        // Map website URLs for LivePreview
        website_url: data.organization.base_url,
        app_url: data.organization.base_url_local,
        // Ensure settings exist with comprehensive field mapping
        settings: {
          // Map existing settings or provide defaults (settings table only)
          ...data.settings,
          // Organization info (for form convenience)
          name: data.organization.name,
          base_url: data.organization.base_url || '',
          base_url_local: data.organization.base_url_local || '',
          type: data.organization.type,
          
          // Basic Information (settings table)
          site: data.settings?.site || data.organization.name || '',
          primary_color: data.settings?.primary_color || 'sky',
          secondary_color: data.settings?.secondary_color || 'gray',
          
          // Layout & Design (settings table)
          header_style: data.settings?.header_style || 'default',
          footer_color: data.settings?.footer_color || 'gray',
          menu_width: data.settings?.menu_width || '280px',
          font_family: data.settings?.font_family || 'Inter',
          
          // Images (settings table)
          image: data.settings?.image || data.settings?.logo_url || null,
          favicon: data.settings?.favicon || data.settings?.favicon_url || null,
          
          // Hero Section Fields (combined for form convenience, but will be separated on save)
          hero_image: data.website_hero?.image || null,
          hero_name: data.website_hero?.name || data.settings?.site || '',
          hero_font_family: data.website_hero?.font_family || '',
          h1_title: data.website_hero?.h1_title || '',
          h1_title_translation: data.website_hero?.h1_title_translation || {},
          is_seo_title: data.website_hero?.is_seo_title || false,
          p_description: data.website_hero?.p_description || '',
          p_description_translation: data.website_hero?.p_description_translation || {},
          h1_text_color: data.website_hero?.h1_text_color || 'gray-800',
          h1_text_color_gradient_from: data.website_hero?.h1_text_color_gradient_from || 'gray-800',
          h1_text_color_gradient_to: data.website_hero?.h1_text_color_gradient_to || 'blue-500',
          h1_text_color_gradient_via: data.website_hero?.h1_text_color_gradient_via || '',
          is_h1_gradient_text: data.website_hero?.is_h1_gradient_text || false,
          h1_text_size: data.website_hero?.h1_text_size || 'text-xl',
          h1_text_size_mobile: data.website_hero?.h1_text_size_mobile || 'text-lg',
          title_alighnement: data.website_hero?.title_alighnement || 'center',
          title_block_width: data.website_hero?.title_block_width || 'full',
          is_bg_gradient: data.website_hero?.is_bg_gradient || false,
          is_image_full_page: data.website_hero?.is_image_full_page || false,
          title_block_columns: data.website_hero?.title_block_columns || 1,
          image_first: data.website_hero?.image_first || false,
          background_color: data.website_hero?.background_color || 'white',
          background_color_gradient_from: data.website_hero?.background_color_gradient_from || 'white',
          background_color_gradient_to: data.website_hero?.background_color_gradient_to || 'gray-100',
          background_color_gradient_via: data.website_hero?.background_color_gradient_via || '',
          button_main_get_started: data.website_hero?.button_main_get_started || 'Get Started',
          button_explore: data.website_hero?.button_explore || 'Explore',
          animation_element: data.website_hero?.animation_element || '',
          p_description_color: data.website_hero?.p_description_color || 'gray-500',
          p_description_size: data.website_hero?.p_description_size || 'text-base',
          p_description_size_mobile: data.website_hero?.p_description_size_mobile || 'text-sm',
          p_description_weight: data.website_hero?.p_description_weight || 'normal',
          
          // SEO & Analytics
          google_analytics_id: data.settings?.google_analytics_id || '',
          google_tag: data.settings?.google_tag || data.settings?.google_tag_manager_id || '',
          seo_keywords: data.settings?.seo_keywords || data.settings?.meta_keywords || '',
          seo_title: data.settings?.seo_title || data.settings?.site || '',
          seo_description: data.settings?.seo_description || data.settings?.site_description || '',
          
          // Language & Localization
          language: data.settings?.language || data.settings?.default_language || 'en',
          supported_locales: data.settings?.supported_locales || [],
          with_language_switch: data.settings?.with_language_switch || data.settings?.language_switcher_enabled || false,
          
          // Contact Information
          contact_email: data.settings?.contact_email || '',
          contact_phone: data.settings?.contact_phone || '',
          
          // Legacy fields for compatibility
          domain: data.settings?.domain || '',
          billing_panel_stripe: data.settings?.billing_panel_stripe || '',
          menu_items_are_text: data.settings?.menu_items_are_text || false,
          seo_og_image: data.settings?.seo_og_image || '',
          seo_twitter_card: data.settings?.seo_twitter_card || 'summary',
          
          // Menu Items from database
          menu_items: data.menu_items || [],
          submenu_items: data.submenu_items || [],
          
          // Blog Posts from database
          blog_posts: data.blog_posts || [],
          
          // Products from database
          products: data.products || [],
          
          // Features from database
          features: data.features || [],
          
          // FAQs from database
          faqs: data.faqs || [],
          
          // Banners from database
          banners: data.banners || []
        }
      };      console.log('Processed organization with settings:', orgWithSettings); // Debug log
      setSelectedOrganization(orgWithSettings);
      setIsEditModalOpen(true);

    } catch (err: any) {
      setError(err.message || 'Failed to load organization details');
    } finally {
      setLoadingOrganizationId(null);
      setIsEditing(false);
    }
  };

  const handleSaveSettings = async (settings: Settings) => {
    if (!selectedOrganization) return;

    try {
      setIsEditing(true);
      setError(null);

      if (!session?.access_token) {
        throw new Error('No access token available');
      }

      console.log('Saving settings:', settings); // Debug log
      console.log('Selected organization:', selectedOrganization); // Debug log

      // Separate organization fields, hero fields, menu items, and other settings
      const { 
        hero_image,
        hero_name,
        hero_font_family,
        h1_title,
        h1_title_translation,
        is_seo_title,
        p_description,
        p_description_translation,
        h1_text_color,
        h1_text_color_gradient_from,
        h1_text_color_gradient_to,
        h1_text_color_gradient_via,
        is_h1_gradient_text,
        h1_text_size,
        h1_text_size_mobile,
        title_alighnement,
        title_block_width,
        is_bg_gradient,
        is_image_full_page,
        title_block_columns,
        image_first,
        background_color,
        background_color_gradient_from,
        background_color_gradient_to,
        background_color_gradient_via,
        button_main_get_started,
        button_explore,
        animation_element,
        p_description_color,
        p_description_size,
        p_description_size_mobile,
        p_description_weight,
        name, 
        base_url, 
        base_url_local, 
        type,
        site,
        menu_items,
        submenu_items,
        blog_posts,
        products,
        features,
        faqs,
        ...pureSettings 
      } = settings;

      // Prepare hero data for website_hero table
      const heroData = {
        image: hero_image,
        name: hero_name || site || '', // Use site value if hero_name is empty
        font_family: hero_font_family,
        h1_title,
        h1_title_translation,
        is_seo_title,
        p_description,
        p_description_translation,
        h1_text_color,
        h1_text_color_gradient_from,
        h1_text_color_gradient_to,
        h1_text_color_gradient_via,
        is_h1_gradient_text,
        h1_text_size,
        h1_text_size_mobile,
        title_alighnement,
        title_block_width,
        is_bg_gradient,
        is_image_full_page,
        title_block_columns,
        image_first,
        background_color,
        background_color_gradient_from,
        background_color_gradient_to,
        background_color_gradient_via,
        button_main_get_started,
        button_explore,
        animation_element,
        p_description_color,
        p_description_size,
        p_description_size_mobile,
        p_description_weight
      };

      // Use the correct API structure that expects organization and settings
      const requestBody = {
        organization: {
          name: name || selectedOrganization.name,
          type: type || selectedOrganization.type,
          base_url: base_url || selectedOrganization.base_url,
          base_url_local: base_url_local || selectedOrganization.base_url_local
        },
        settings: pureSettings,
        // Send hero data separately so the API can handle it for website_hero table
        website_hero: heroData,
        // Send menu items separately so the API can handle it for website_menuitem table
        menu_items: menu_items || [],
        // Send submenu items separately so the API can handle it for website_submenuitem table
        submenu_items: submenu_items || [],
        // Send blog posts separately so the API can handle it for blog_post table
        blog_posts: blog_posts || [],
        // Send products separately so the API can handle it for product table
        products: products || [],
        // Send features separately so the API can handle it for feature table
        features: features || [],
        // Send FAQs separately so the API can handle it for faq table
        faqs: faqs || []
      };

      console.log('Request body:', requestBody); // Debug log

      const response = await fetch(`/api/organizations/${selectedOrganization.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('API response status:', response.status); // Debug log

      let data;
      try {
        data = await response.json();
        console.log('API response data:', data); // Debug log
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        throw new Error(`HTTP ${response.status}: Failed to parse server response`);
      }

      if (!response.ok) {
        console.error('API Error Response:', data);
        console.error('Response status:', response.status);
        console.error('Response status text:', response.statusText);
        console.error('Full error details:', {
          status: response.status,
          statusText: response.statusText,
          data,
          url: response.url,
          organizationId: selectedOrganization.id
        });
        throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('Settings saved successfully:', data); // Debug log

      // After successful save, refresh the selected organization data from API to get the latest state
      console.log('[SiteManagement] Refreshing selected organization data after save...');
      
      // Fetch fresh data for this specific organization
      const refreshResponse = await fetch(`/api/organizations/${selectedOrganization.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        console.log('[SiteManagement] Fresh organization data:', refreshData);
        
        // Create updated organization object with fresh data
        const updatedOrgWithSettings = {
          ...refreshData.organization,
          website_url: refreshData.organization.base_url,
          app_url: refreshData.organization.base_url_local,
          settings: {
            ...refreshData.settings,
            // Organization info (for form convenience)
            name: refreshData.organization.name,
            base_url: refreshData.organization.base_url || '',
            base_url_local: refreshData.organization.base_url_local || '',
            type: refreshData.organization.type,
            
            // Basic Information (settings table)
            site: refreshData.settings?.site || refreshData.organization.name || '',
            primary_color: refreshData.settings?.primary_color || 'sky',
            secondary_color: refreshData.settings?.secondary_color || 'gray',
            header_style: refreshData.settings?.header_style || 'default',
            footer_color: refreshData.settings?.footer_color || 'gray',
            menu_width: refreshData.settings?.menu_width || '280px',
            font_family: refreshData.settings?.font_family || 'Inter',
            image: refreshData.settings?.image || refreshData.settings?.logo_url || null,
            favicon: refreshData.settings?.favicon || refreshData.settings?.favicon_url || null,
            
            // Hero Section Fields (combined for form convenience)
            hero_image: refreshData.website_hero?.image || null,
            hero_name: refreshData.website_hero?.name || refreshData.settings?.site || '',
            hero_font_family: refreshData.website_hero?.font_family || '',
            h1_title: refreshData.website_hero?.h1_title || '',
            h1_title_translation: refreshData.website_hero?.h1_title_translation || {},
            is_seo_title: refreshData.website_hero?.is_seo_title || false,
            p_description: refreshData.website_hero?.p_description || '',
            p_description_translation: refreshData.website_hero?.p_description_translation || {},
            h1_text_color: refreshData.website_hero?.h1_text_color || 'gray-800',
            h1_text_color_gradient_from: refreshData.website_hero?.h1_text_color_gradient_from || 'gray-800',
            h1_text_color_gradient_to: refreshData.website_hero?.h1_text_color_gradient_to || 'blue-500',
            h1_text_color_gradient_via: refreshData.website_hero?.h1_text_color_gradient_via || '',
            is_h1_gradient_text: refreshData.website_hero?.is_h1_gradient_text || false,
            h1_text_size: refreshData.website_hero?.h1_text_size || 'text-xl',
            h1_text_size_mobile: refreshData.website_hero?.h1_text_size_mobile || 'text-lg',
            title_alighnement: refreshData.website_hero?.title_alighnement || 'center',
            title_block_width: refreshData.website_hero?.title_block_width || 'full',
            is_bg_gradient: refreshData.website_hero?.is_bg_gradient || false,
            is_image_full_page: refreshData.website_hero?.is_image_full_page || false,
            title_block_columns: refreshData.website_hero?.title_block_columns || 1,
            image_first: refreshData.website_hero?.image_first || false,
            background_color: refreshData.website_hero?.background_color || 'white',
            background_color_gradient_from: refreshData.website_hero?.background_color_gradient_from || 'white',
            background_color_gradient_to: refreshData.website_hero?.background_color_gradient_to || 'gray-100',
            background_color_gradient_via: refreshData.website_hero?.background_color_gradient_via || '',
            button_main_get_started: refreshData.website_hero?.button_main_get_started || 'Get Started',
            button_explore: refreshData.website_hero?.button_explore || 'Explore',
            animation_element: refreshData.website_hero?.animation_element || '',
            p_description_color: refreshData.website_hero?.p_description_color || 'gray-500',
            p_description_size: refreshData.website_hero?.p_description_size || 'text-base',
            p_description_size_mobile: refreshData.website_hero?.p_description_size_mobile || 'text-sm',
            p_description_weight: refreshData.website_hero?.p_description_weight || 'normal',
            
            // SEO & Analytics
            google_analytics_id: refreshData.settings?.google_analytics_id || '',
            google_tag: refreshData.settings?.google_tag || refreshData.settings?.google_tag_manager_id || '',
            seo_keywords: refreshData.settings?.seo_keywords || refreshData.settings?.meta_keywords || '',
            seo_title: refreshData.settings?.seo_title || refreshData.settings?.site || '',
            seo_description: refreshData.settings?.seo_description || refreshData.settings?.site_description || '',
            
            // Language & Localization
            language: refreshData.settings?.language || 'en',
            supported_locales: Array.isArray(refreshData.settings?.supported_locales) 
              ? refreshData.settings.supported_locales 
              : refreshData.settings?.supported_locales 
                ? [refreshData.settings.supported_locales] 
                : ['en'],
            with_language_switch: refreshData.settings?.with_language_switch || false,
            
            // Contact Information
            contact_email: refreshData.settings?.contact_email || '',
            contact_phone: refreshData.settings?.contact_phone || '',
            
            // Menu Items from database
            menu_items: refreshData.menu_items || [],
            submenu_items: refreshData.submenu_items || [],
            
            // Blog Posts from database
            blog_posts: refreshData.blog_posts || [],
            
            // Products from database
            products: refreshData.products || [],
            
            // Features from database
            features: refreshData.features || [],
            
            // FAQs from database
            faqs: refreshData.faqs || []
          }
        };

        console.log('[SiteManagement] Updated organization with fresh settings:', updatedOrgWithSettings);
        setSelectedOrganization(updatedOrgWithSettings);
      } else {
        console.warn('[SiteManagement] Failed to refresh organization data, falling back to local update');
      }

      // Refresh the organizations list for the grid
      await fetchOrganizations();

      // Force cache revalidation for deployed sites
      try {
        console.log('[SiteManagement] Triggering cache revalidation...');
        const revalidateResponse = await fetch('/api/revalidate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            organizationId: selectedOrganization.id,
            paths: ['/'],
            tags: [`hero-${selectedOrganization.id}`, `homepage-${selectedOrganization.id}`]
          })
        });

        if (revalidateResponse.ok) {
          const revalidateData = await revalidateResponse.json();
          console.log('[SiteManagement] Cache revalidation successful:', revalidateData);
        } else {
          console.warn('[SiteManagement] Cache revalidation failed:', revalidateResponse.status);
        }
      } catch (revalidateError) {
        console.warn('[SiteManagement] Cache revalidation error:', revalidateError);
        // Don't fail the save if revalidation fails
      }

      // Don't close modal anymore - let user continue editing
      // setIsEditModalOpen(false);
      // setSelectedOrganization(null);

    } catch (err: any) {
      console.error('Save settings error:', err); // Debug log
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        selectedOrganization: selectedOrganization?.id,
        settingsKeys: Object.keys(settings || {})
      });
      setError(err.message || 'Failed to update settings');
    } finally {
      setIsEditing(false);
    }
  };

  // Auto-save listener for menu changes
  useEffect(() => {
    let autoSaveTimeoutId: NodeJS.Timeout | null = null;
    
    const handleAutoSaveMenuChanges = async (event: Event) => {
      if (!selectedOrganization || !session?.access_token) return;
      
      const customEvent = event as CustomEvent;
      console.log('🔄 Auto-save triggered for menu changes:', customEvent.detail);
      
      // Clear any existing timeout to debounce rapid changes
      if (autoSaveTimeoutId) {
        clearTimeout(autoSaveTimeoutId);
      }
      
      // Set a new timeout to batch rapid operations
      autoSaveTimeoutId = setTimeout(async () => {
        try {
          // Get the current settings from the modal via a global variable
          const settingsData = (window as any).__currentEditSettings;
          if (settingsData) {
            console.log('💾 Auto-saving settings with updated menu data...');
            await handleSaveSettings(settingsData);
            console.log('✅ Auto-save completed successfully');
          }
        } catch (error) {
          console.warn('⚠️ Auto-save failed, changes remain in local state:', error);
          // Auto-save failures shouldn't interrupt the user experience
        }
      }, 300); // 300ms debounce to batch rapid changes
    };

    window.addEventListener('autoSaveMenuChanges', handleAutoSaveMenuChanges);
    
    return () => {
      if (autoSaveTimeoutId) {
        clearTimeout(autoSaveTimeoutId);
      }
      window.removeEventListener('autoSaveMenuChanges', handleAutoSaveMenuChanges);
    };
  }, [selectedOrganization, session, handleSaveSettings]);

  // Auto-save listener for blog post changes
  useEffect(() => {
    let blogPostSaveTimeoutId: NodeJS.Timeout | null = null;
    
    const handleAutoSaveBlogPostChanges = async (event: Event) => {
      if (!selectedOrganization || !session?.access_token) return;
      
      const customEvent = event as CustomEvent;
      console.log('🔄 Auto-save triggered for blog post changes:', customEvent.detail);
      
      // Clear any existing timeout to debounce rapid changes
      if (blogPostSaveTimeoutId) {
        clearTimeout(blogPostSaveTimeoutId);
      }
      
      // Set a new timeout to batch rapid operations
      blogPostSaveTimeoutId = setTimeout(async () => {
        try {
          // Get the current settings from the modal via a global variable
          const settingsData = (window as any).__currentEditSettings;
          if (settingsData) {
            console.log('💾 Auto-saving settings with updated blog post data...');
            await handleSaveSettings(settingsData);
            console.log('✅ Blog post auto-save completed successfully');
          }
        } catch (error) {
          console.warn('⚠️ Blog post auto-save failed, changes remain in local state:', error);
          // Auto-save failures shouldn't interrupt the user experience
        }
      }, 300); // 300ms debounce to batch rapid changes
    };

    window.addEventListener('autoSaveBlogPostChanges', handleAutoSaveBlogPostChanges);
    
    return () => {
      if (blogPostSaveTimeoutId) {
        clearTimeout(blogPostSaveTimeoutId);
      }
      window.removeEventListener('autoSaveBlogPostChanges', handleAutoSaveBlogPostChanges);
    };
  }, [selectedOrganization, session, handleSaveSettings]);

  // Auto-save listener for product changes
  useEffect(() => {
    let productSaveTimeoutId: NodeJS.Timeout | null = null;
    
    const handleAutoSaveProductChanges = async (event: Event) => {
      if (!selectedOrganization || !session?.access_token) return;
      
      const customEvent = event as CustomEvent;
      console.log('🔄 Auto-save triggered for product changes:', customEvent.detail);
      
      // Clear any existing timeout to debounce rapid changes
      if (productSaveTimeoutId) {
        clearTimeout(productSaveTimeoutId);
      }
      
      // Set a new timeout to batch rapid operations
      productSaveTimeoutId = setTimeout(async () => {
        try {
          // Get the current settings from the modal via a global variable
          const settingsData = (window as any).__currentEditSettings;
          if (settingsData) {
            console.log('💾 Auto-saving settings with updated product data...');
            await handleSaveSettings(settingsData);
            console.log('✅ Product auto-save completed successfully');
          }
        } catch (error) {
          console.warn('⚠️ Product auto-save failed, changes remain in local state:', error);
          // Auto-save failures shouldn't interrupt the user experience
        }
      }, 300); // 300ms debounce to batch rapid changes
    };

    window.addEventListener('autoSaveProductChanges', handleAutoSaveProductChanges);
    
    return () => {
      if (productSaveTimeoutId) {
        clearTimeout(productSaveTimeoutId);
      }
      window.removeEventListener('autoSaveProductChanges', handleAutoSaveProductChanges);
    };
  }, [selectedOrganization, session, handleSaveSettings]);

  // Auto-save listener for cookie service changes
  useEffect(() => {
    let cookieServiceSaveTimeoutId: NodeJS.Timeout | null = null;
    
    const handleAutoSaveCookieServiceChanges = async (event: Event) => {
      if (!selectedOrganization || !session?.access_token) return;
      
      const customEvent = event as CustomEvent;
      console.log('🔄 Auto-save triggered for cookie service changes:', customEvent.detail);
      
      // Clear any existing timeout to debounce rapid changes
      if (cookieServiceSaveTimeoutId) {
        clearTimeout(cookieServiceSaveTimeoutId);
      }
      
      // Set a new timeout to batch rapid operations
      cookieServiceSaveTimeoutId = setTimeout(async () => {
        try {
          // Get the current settings from the modal via a global variable
          const settingsData = (window as any).__currentEditSettings;
          if (settingsData) {
            console.log('💾 Auto-saving settings with updated cookie service data...');
            await handleSaveSettings(settingsData);
            console.log('✅ Cookie service auto-save completed successfully');
          }
        } catch (error) {
          console.warn('⚠️ Cookie service auto-save failed, changes remain in local state:', error);
          // Auto-save failures shouldn't interrupt the user experience
        }
      }, 300); // 300ms debounce to batch rapid changes
    };

    window.addEventListener('autoSaveCookieServiceChanges', handleAutoSaveCookieServiceChanges);
    
    return () => {
      if (cookieServiceSaveTimeoutId) {
        clearTimeout(cookieServiceSaveTimeoutId);
      }
      window.removeEventListener('autoSaveCookieServiceChanges', handleAutoSaveCookieServiceChanges);
    };
  }, [selectedOrganization, session, handleSaveSettings]);

  // Auto-save listener for banner changes
  useEffect(() => {
    let bannerSaveTimeoutId: NodeJS.Timeout | null = null;
    
    const handleAutoSaveBannerChanges = async (event: Event) => {
      if (!selectedOrganization || !session?.access_token) return;
      
      const customEvent = event as CustomEvent;
      console.log('🔄 Auto-save triggered for banner changes:', customEvent.detail);
      
      // Clear any existing timeout to debounce rapid changes
      if (bannerSaveTimeoutId) {
        clearTimeout(bannerSaveTimeoutId);
      }
      
      // Set a new timeout to batch rapid operations
      bannerSaveTimeoutId = setTimeout(async () => {
        try {
          // Get the current settings from the modal via a global variable
          const settingsData = (window as any).__currentEditSettings;
          if (settingsData) {
            console.log('💾 Auto-saving settings with updated banner data...');
            await handleSaveSettings(settingsData);
            console.log('✅ Banner auto-save completed successfully');
          }
        } catch (error) {
          console.warn('⚠️ Banner auto-save failed, changes remain in local state:', error);
          // Auto-save failures shouldn't interrupt the user experience
        }
      }, 300); // 300ms debounce to batch rapid changes
    };

    window.addEventListener('autoSaveBannerChanges', handleAutoSaveBannerChanges);
    
    return () => {
      if (bannerSaveTimeoutId) {
        clearTimeout(bannerSaveTimeoutId);
      }
      window.removeEventListener('autoSaveBannerChanges', handleAutoSaveBannerChanges);
    };
  }, [selectedOrganization, session, handleSaveSettings]);

  // Auto-save listener for feature changes
  useEffect(() => {
    let featureSaveTimeoutId: NodeJS.Timeout | null = null;
    let faqSaveTimeoutId: NodeJS.Timeout | null = null;
    
    const handleAutoSaveFeatureChanges = async (event: Event) => {
      if (!selectedOrganization || !session?.access_token) return;
      
      const customEvent = event as CustomEvent;
      console.log('🔄 Auto-save triggered for feature changes:', customEvent.detail);
      
      // Clear any existing timeout to debounce rapid changes
      if (featureSaveTimeoutId) {
        clearTimeout(featureSaveTimeoutId);
      }
      
      // Set a new timeout to batch rapid operations
      featureSaveTimeoutId = setTimeout(async () => {
        try {
          // Get the current settings from the modal via a global variable
          const settingsData = (window as any).__currentEditSettings;
          if (settingsData) {
            console.log('💾 Auto-saving settings with updated feature data...');
            await handleSaveSettings(settingsData);
            console.log('✅ Feature auto-save completed successfully');
          }
        } catch (error) {
          console.warn('⚠️ Feature auto-save failed, changes remain in local state:', error);
          // Auto-save failures shouldn't interrupt the user experience
        }
      }, 300); // 300ms debounce to batch rapid changes
    };

    const handleAutoSaveFAQChanges = async (event: Event) => {
      if (!selectedOrganization || !session?.access_token) return;
      
      const customEvent = event as CustomEvent;
      console.log('🔄 Auto-save triggered for FAQ changes:', customEvent.detail);
      
      // Clear any existing timeout to debounce rapid changes
      if (faqSaveTimeoutId) {
        clearTimeout(faqSaveTimeoutId);
      }
      
      // Set a new timeout to batch rapid operations
      faqSaveTimeoutId = setTimeout(async () => {
        try {
          // Get the current settings from the modal via a global variable
          const settingsData = (window as any).__currentEditSettings;
          if (settingsData) {
            console.log('💾 Auto-saving settings with updated FAQ data...');
            await handleSaveSettings(settingsData);
            console.log('✅ FAQ auto-save completed successfully');
          }
        } catch (error) {
          console.warn('⚠️ FAQ auto-save failed, changes remain in local state:', error);
          // Auto-save failures shouldn't interrupt the user experience
        }
      }, 300); // 300ms debounce to batch rapid changes
    };

    window.addEventListener('autoSaveFeatureChanges', handleAutoSaveFeatureChanges);
    window.addEventListener('autoSaveFAQChanges', handleAutoSaveFAQChanges);
    
    return () => {
      if (featureSaveTimeoutId) {
        clearTimeout(featureSaveTimeoutId);
      }
      if (faqSaveTimeoutId) {
        clearTimeout(faqSaveTimeoutId);
      }
      window.removeEventListener('autoSaveFeatureChanges', handleAutoSaveFeatureChanges);
      window.removeEventListener('autoSaveFAQChanges', handleAutoSaveFAQChanges);
    };
  }, [selectedOrganization, session, handleSaveSettings]);

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedOrganization(null);
    setError(null);
    setLoadingOrganizationId(null);
    setIsEditing(false);
    setIsReadOnlyMode(false); // Reset read-only mode when closing
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setError(null);
  };

  const closeDeploymentModal = () => {
    setIsDeploymentModalOpen(false);
    setCreatedOrganization(null);
  };

  // Close deployment modal after deployment complete
  const handleDeploymentComplete = () => {
    setIsDeploymentModalOpen(false);
    setCreatedOrganization(null);
  };

  // Loading state
  if (isLoading || fetchLoading) {
    return <LoadingStates type="single" message="Loading site management..." />;
  }

  // Not authenticated
  if (!session) {
    return <AccessRestricted message="Authentication Required" subtitle="Please log in to manage your sites." />;
  }

  // No site creation permissions
  if (!profile?.is_site_creator) {
    return <AccessRestricted />;
  }

  return (
    <div className="min-h-screen font-light">
      <div className="max-w-7xl mx-auto">


        {/* Header */}
        <Header 
          ref={headerRef}
          canCreateMore={canCreateMore}
          onCreateNew={handleCreateNew}
          onTestAuth={testAuth}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          totalOrganizations={organizations.length}
          organizations={organizations}
          activeFilter={activeFilter}
          activeSort={activeSort}
        />

        {/* Error Display */}
        <ErrorDisplay error={error} />

        {/* Main Content Area */}
        <div className="px-4 sm:px-6 lg:px-8 pt-80 sm:pt-48 pb-6">
          {/* Sample Organizations Horizontal Scroll */}
          <SampleOrganizationsInline 
            onExplore={handleExploreSample}
            onClone={handleCloneSample}
          />
          
          {/* Organizations Grid */}
          <OrganizationsGrid
            organizations={filteredOrganizations}
            canCreateMore={canCreateMore}
            onCreateNew={handleCreateNew}
            onEditOrganization={handleEditOrganization}
            onDeployOrganization={handleDeployOrganization}
            onCloneOrganization={handleCloneOrganization}
            onDeleteOrganization={handleDeleteOrganization}
            onLoadMore={handleLoadMore}
            hasMore={hasMoreOrganizations}
            isLoadingMore={isLoadingMore}
            loadingOrganizationId={loadingOrganizationId}
            mostRecentOrganizationId={mostRecentOrganizationId}
          />
          
          {/* Platform Stats Widget - Now below organization cards */}
          <PlatformStatsWidget 
            organizations={organizations}
            profile={profile}
            session={session}
          />
        </div>

                {/* Debug Panel - Remove in production */}
        {process.env.NODE_ENV === 'development' && profile && (
          <div className="mx-4 sm:mx-6 lg:mx-8 my-6 p-4 bg-sky-50/50 border border-sky-200/60 rounded-xl text-sm font-light backdrop-blur-sm">
            <strong className="font-medium text-sky-800">Debug Info:</strong> 
            <span className="text-sky-700">
              Email: {profile.email} | Role: {profile.role} | 
              Organization ID: {profile.organization_id || profile.current_organization_id || 'None'} | 
              Is Site Creator: {profile.is_site_creator ? 'Yes' : 'No'} | 
              Organizations Count: {organizations.length}
            </span>
            {(() => {
              const orgId = profile.organization_id || profile.current_organization_id;
              const userOrg = orgId ? organizations.find(org => org.id === orgId) : null;
              return userOrg ? (
                <span className={profile.role === 'admin' && userOrg.type === 'platform' ? 'font-medium text-emerald-600' : 'text-sky-700'}>
                  {' '}| Org Type: {userOrg.type} | Admin of Platform Org: {profile.role === 'admin' && userOrg.type === 'platform' ? 'YES' : 'No'}
                </span>
              ) : (
                <span className="text-red-500"> | No Organization Found</span>
              );
            })()}
          </div>
        )}

        {/* Create Modal */}
        <CreateModal
          isOpen={isCreateModalOpen}
          onClose={closeCreateModal}
          onSubmit={handleCreateOrganization}
          onOrganizationCreated={handleOrganizationCreated}
          isLoading={isCreating}
          session={session}
        />

        {/* Deployment Modal */}
        {createdOrganization && (
          <DeploymentModal
            isOpen={isDeploymentModalOpen}
            onClose={closeDeploymentModal}
            organization={createdOrganization}
            session={session}
            onDeploymentComplete={handleDeploymentComplete}
          />
        )}

        {/* Edit Modal */}
        <EditModal
          isOpen={isEditModalOpen}
          organization={selectedOrganization}
          onClose={closeEditModal}
          onSave={handleSaveSettings}
          isLoading={isEditing}
          session={session}
          readOnly={isReadOnlyMode}
        />
      </div>
    </div>
  );
}
