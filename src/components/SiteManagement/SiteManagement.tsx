'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Header,
  ErrorDisplay,
  OrganizationsGrid,
  CreateModal,
  EditModal,
  LoadingStates,
  AccessRestricted,
  Organization,
  Settings,
  UserProfile
} from '.';

export default function SiteManagement() {
  const { session, isLoading } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [canCreateMore, setCanCreateMore] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayLimit, setDisplayLimit] = useState(6);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    console.log('Session state:', session);
    if (session) {
      fetchOrganizations();
    }
  }, [session]);

  // Update filtered organizations when organizations change or search is empty
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrganizations(organizations.slice(0, displayLimit));
    }
  }, [organizations, searchQuery, displayLimit]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      // If no search query, show limited organizations
      setFilteredOrganizations(organizations.slice(0, displayLimit));
    } else {
      // Filter organizations based on search query (show all matching results)
      const filtered = organizations.filter((org: Organization) =>
        org.name.toLowerCase().includes(query.toLowerCase()) ||
        org.type.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredOrganizations(filtered);
    }
  };

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
            console.log(`Is admin of general org: ${data.profile.role === 'admin' && userOrganization.type === 'general'}`);
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

      // Close modal and refresh
      setIsCreateModalOpen(false);
      await fetchOrganizations();
      // Reset search and display limit to show the new organization
      setDisplayLimit(6);
      handleSearch('');

    } catch (err: any) {
      setError(err.message || 'Failed to create organization');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditOrganization = async (organization: Organization) => {
    try {
      setError(null);
      
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
          // Map existing settings or provide defaults
          ...data.settings,
          // Basic Information
          site: data.settings?.site || data.organization.name || '',
          primary_color: data.settings?.primary_color || 'sky',
          secondary_color: data.settings?.secondary_color || 'gray',
          
          // Layout & Design
          header_style: data.settings?.header_style || 'default',
          footer_color: data.settings?.footer_color || 'gray',
          menu_width: data.settings?.menu_width || '280px',
          font_family: data.settings?.font_family || '',
          
          // Images - map both new and legacy field names
          image: data.settings?.image || data.settings?.logo_url || null,
          favicon: data.settings?.favicon || data.settings?.favicon_url || null,
          // Hero image from website_hero table
          hero_image: data.website_hero?.image || null,
          
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
          seo_twitter_card: data.settings?.seo_twitter_card || 'summary'
        }
      };
      
      console.log('Processed organization with settings:', orgWithSettings); // Debug log
      setSelectedOrganization(orgWithSettings);
      setIsEditModalOpen(true);

    } catch (err: any) {
      setError(err.message || 'Failed to load organization details');
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

      // Separate organization fields and hero_image from settings
      const { 
        hero_image, 
        name, 
        base_url, 
        base_url_local, 
        type,
        ...pureSettings 
      } = settings;

      // Use the correct API structure that expects organization and settings
      const requestBody = {
        organization: {
          name: name || selectedOrganization.name,
          type: type || selectedOrganization.type,
          base_url: base_url || selectedOrganization.base_url,
          base_url_local: base_url_local || selectedOrganization.base_url_local
        },
        settings: pureSettings,
        // Send hero_image separately so the API can handle it for website_hero table
        website_hero: hero_image ? { image: hero_image } : null
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

      // Refresh the organizations list
      await fetchOrganizations();
      
      // Also refresh the currently selected organization with updated data
      if (data.organization || data.settings) {
        const updatedOrgData = {
          ...selectedOrganization,
          // Update organization fields if they were returned
          ...(data.organization && data.organization),
          settings: {
            ...selectedOrganization.settings,
            // Update settings if they were returned
            ...(data.settings && data.settings)
          }
        };
        setSelectedOrganization(updatedOrgData);
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

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedOrganization(null);
    setError(null);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setError(null);
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
    <div className="min-h-screen bg-white font-light">
      <div className="max-w-7xl mx-auto">


        {/* Header */}
        <Header 
          canCreateMore={canCreateMore}
          onCreateNew={handleCreateNew}
          onTestAuth={testAuth}
          onSearch={handleSearch}
        />

        {/* Error Display */}
        <ErrorDisplay error={error} />

        {/* Main Content Area */}
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Organizations Grid */}
          <OrganizationsGrid
            organizations={filteredOrganizations}
            canCreateMore={canCreateMore}
            onCreateNew={handleCreateNew}
            onEditOrganization={handleEditOrganization}
            onLoadMore={handleLoadMore}
            hasMore={hasMoreOrganizations}
            isLoadingMore={isLoadingMore}
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
                <span className={profile.role === 'admin' && userOrg.type === 'general' ? 'font-medium text-emerald-600' : 'text-sky-700'}>
                  {' '}| Org Type: {userOrg.type} | Admin of General Org: {profile.role === 'admin' && userOrg.type === 'general' ? 'YES' : 'No'}
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
          isLoading={isCreating}
        />


        {/* Edit Modal */}
        <EditModal
          isOpen={isEditModalOpen}
          organization={selectedOrganization}
          onClose={closeEditModal}
          onSave={handleSaveSettings}
          isLoading={isEditing}
          session={session}
        />
      </div>
    </div>
  );
}
