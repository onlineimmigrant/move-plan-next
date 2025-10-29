// Example: Cross-Tenant Data Table Component
// Location: src/components/admin/CrossTenantDataTable.tsx
// Demonstrates superadmin cross-tenant access patterns

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

interface Organization {
  id: string;
  name: string;
  type: string;
}

interface DataRow {
  id: string;
  name: string;
  organization_id: string;
  created_at: string;
  organizations?: {
    name: string;
  };
}

export function CrossTenantDataTable({ tableName }: { tableName: string }) {
  const { isAdmin, isSuperadmin, organizationId } = useAuth();
  const [data, setData] = useState<DataRow[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize selected org to user's home organization
  useEffect(() => {
    if (organizationId && !selectedOrgId) {
      setSelectedOrgId(organizationId);
    }
  }, [organizationId, selectedOrgId]);

  // Fetch organizations list (superadmin only)
  useEffect(() => {
    if (isSuperadmin) {
      fetchOrganizations();
    }
  }, [isSuperadmin]);

  // Fetch data when selected org changes
  useEffect(() => {
    if (selectedOrgId) {
      fetchData();
    }
  }, [selectedOrgId, isSuperadmin]);

  async function fetchOrganizations() {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, type')
      .order('name');

    if (!error && data) {
      setOrganizations(data);
    }
  }

  async function fetchData() {
    try {
      setLoading(true);

      // Build query based on role
      let query = supabase
        .from(tableName)
        .select(`
          *,
          organizations (
            name
          )
        `)
        .order('created_at', { ascending: false });

      // Apply organization filter based on user role
      if (isSuperadmin && selectedOrgId) {
        // Superadmin: Filter by selected organization
        query = query.eq('organization_id', selectedOrgId);
      } else if (isAdmin && !isSuperadmin) {
        // Regular admin: Always filter by their own organization
        query = query.eq('organization_id', organizationId);
      }

      const { data: rows, error } = await query;

      if (error) {
        console.error('Error fetching data:', error);
        return;
      }

      setData(rows || []);
    } finally {
      setLoading(false);
    }
  }

  // Only admins can access this component
  if (!isAdmin) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-800">Unauthorized: Admin access required</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Superadmin Header */}
      {isSuperadmin && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👑</span>
              <div>
                <h3 className="font-semibold text-purple-900">
                  Superadmin Mode
                </h3>
                <p className="text-sm text-purple-700">
                  You have cross-tenant access to all organizations
                </p>
              </div>
            </div>

            {/* Organization Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-purple-900">
                Viewing:
              </label>
              <select
                value={selectedOrgId || ''}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="px-3 py-2 border border-purple-300 rounded-md bg-white"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Warning for cross-tenant viewing */}
          {selectedOrgId !== organizationId && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Cross-Tenant Access:</strong> You are viewing data
                from another organization. Changes will affect their data.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Regular Admin Header */}
      {isAdmin && !isSuperadmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔐</span>
            <div>
              <h3 className="font-semibold text-blue-900">Admin Mode</h3>
              <p className="text-sm text-blue-700">
                Viewing data for your organization only
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading data...
          </div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No data found for this organization
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                {isSuperadmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {row.name}
                  </td>
                  {isSuperadmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.organizations?.name || 'Unknown'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(row.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Data Summary */}
      <div className="bg-gray-50 border rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{data.length}</p>
            <p className="text-sm text-gray-600">Total Records</p>
          </div>
          {isSuperadmin && (
            <>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {organizations.length}
                </p>
                <p className="text-sm text-gray-600">Total Organizations</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {selectedOrgId === organizationId ? 'Home' : 'Remote'}
                </p>
                <p className="text-sm text-gray-600">Current View</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

// Example 1: In an admin page
/*
import { CrossTenantDataTable } from '@/components/admin/CrossTenantDataTable';

export default function AdminProductsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Products Management</h1>
      <CrossTenantDataTable tableName="products" />
    </div>
  );
}
*/

// Example 2: Custom hook for cross-tenant queries
/*
export function useCrossTenantQuery<T>(
  tableName: string,
  select: string = '*'
) {
  const { isSuperadmin, organizationId } = useAuth();
  const [selectedOrgId, setSelectedOrgId] = useState(organizationId);

  async function fetchData() {
    let query = supabase.from(tableName).select(select);

    // Apply org filter based on role
    if (!isSuperadmin) {
      query = query.eq('organization_id', organizationId);
    } else if (selectedOrgId) {
      query = query.eq('organization_id', selectedOrgId);
    }

    return query;
  }

  return {
    selectedOrgId,
    setSelectedOrgId,
    fetchData,
  };
}
*/

// Example 3: Superadmin confirmation dialog
/*
function ConfirmCrossTenantAction({
  targetOrgId,
  targetOrgName,
  action,
  onConfirm,
  onCancel,
}: {
  targetOrgId: string;
  targetOrgName: string;
  action: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { organizationId } = useAuth();
  const isCrossTenant = targetOrgId !== organizationId;

  if (!isCrossTenant) {
    // Not cross-tenant, proceed immediately
    onConfirm();
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md">
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          ⚠️ Cross-Tenant Action
        </h3>
        <p className="text-gray-700 mb-4">
          You are about to {action} for <strong>{targetOrgName}</strong>.
          <br />
          This will affect another organization's data.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Confirm Action
          </button>
        </div>
      </div>
    </div>
  );
}
*/
