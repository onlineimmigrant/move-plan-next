'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Task {
  name: string;
  system_message: string;
}

interface SystemModel {
  id: string;
  name: string;
  role: string;
  system_message: string;
  api_key: string;
  endpoint: string;
  max_tokens: number;
  icon: string;
  organization_types: string[];
  required_plan: string;
  token_limit_period: string | null;
  token_limit_amount: number | null;
  is_free: boolean;
  is_trial: boolean;
  trial_expires_days: number | null;
  is_active: boolean;
  is_featured: boolean;
  description: string;
  tags: string[];
  sort_order: number;
  task: Task[] | null;
  created_at: string;
  updated_at: string;
}

export default function SystemModelsPage() {
  const { isAdmin, isSuperadmin, organizationId } = useAuth();
  const router = useRouter();
  
  const [models, setModels] = useState<SystemModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAccessAndFetchModels();
  }, [isSuperadmin, isAdmin]);

  async function checkAccessAndFetchModels() {
    // Only superadmin can access this page
    if (!isAdmin) {
      router.push('/login');
      return;
    }

    if (!isSuperadmin) {
      setError('Access Denied: Superadmin privileges required');
      setLoading(false);
      return;
    }

    await fetchSystemModels();
  }

  async function fetchSystemModels() {
    try {
      setLoading(true);
      
      console.log('🔍 Fetching system models...');
      console.log('Auth context:', { isAdmin, isSuperadmin, organizationId });
      
      const { data, error } = await supabase
        .from('ai_models_system')
        .select('*')
        .order('sort_order', { ascending: true });

      console.log('📊 Supabase response:', { 
        dataCount: data?.length, 
        error: error?.message,
        errorDetails: error 
      });

      if (error) {
        console.error('❌ Error fetching system models:', error);
        setError(error.message);
        return;
      }

      console.log('✅ Models fetched successfully:', data?.length || 0);
      setModels(data || []);
    } catch (err) {
      console.error('❌ Failed to fetch system models:', err);
      setError('Failed to load system models');
    } finally {
      setLoading(false);
    }
  }

  async function toggleModelActive(modelId: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('ai_models_system')
      .update({ is_active: !currentStatus })
      .eq('id', modelId);

    if (error) {
      console.error('Error toggling model:', error);
      alert('Failed to update model status');
      return;
    }

    // Refresh the list
    fetchSystemModels();
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading system models...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-900 mb-2">
            {error.includes('Access Denied') ? '🔒 Access Denied' : '❌ Error'}
          </h2>
          <p className="text-red-700">{error}</p>
          {error.includes('Access Denied') && (
            <p className="text-red-600 mt-2 text-sm">
              This page is only accessible to superadmin users. Contact your system administrator.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Superadmin Header */}
      <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👑</span>
            <div>
              <h1 className="text-2xl font-bold text-purple-900">
                System AI Models Management
              </h1>
              <p className="text-purple-700 text-sm mt-1">
                Superadmin Control Panel - Manage global AI model templates
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-purple-900">
              Your Organization: {organizationId?.substring(0, 8)}...
            </p>
            <p className="text-xs text-purple-700">
              Viewing system-wide models
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-3xl font-bold text-blue-600">{models.length}</div>
          <div className="text-sm text-gray-600">Total Models</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-3xl font-bold text-green-600">
            {models.filter(m => m.is_active).length}
          </div>
          <div className="text-sm text-gray-600">Active Models</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-3xl font-bold text-purple-600">
            {models.filter(m => m.is_free).length}
          </div>
          <div className="text-sm text-gray-600">Free Models</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-3xl font-bold text-orange-600">
            {models.filter(m => m.is_trial).length}
          </div>
          <div className="text-sm text-gray-600">Trial Models</div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">All System Models</h2>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => {
            // TODO: Open add model modal
            alert('Add Model Modal - To be implemented');
          }}
        >
          + Add System Model
        </button>
      </div>

      {/* Models List */}
      {models.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <p className="text-gray-600 text-lg mb-2">No system models found</p>
          <p className="text-gray-500 text-sm">
            Deploy migration 006 to seed sample models, or create new ones manually.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {models.map((model) => (
            <div
              key={model.id}
              className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                {/* Model Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{model.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {model.name}
                      </h3>
                      <p className="text-sm text-gray-600">Role: {model.role}</p>
                    </div>
                  </div>

                  <p className="text-gray-700 text-sm mb-3">{model.description}</p>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {model.is_active ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        ✓ Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                        ○ Inactive
                      </span>
                    )}
                    {model.is_free && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Free
                      </span>
                    )}
                    {model.is_trial && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                        {model.trial_expires_days}-day Trial
                      </span>
                    )}
                    {model.is_featured && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        ⭐ Featured
                      </span>
                    )}
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                      Plan: {model.required_plan}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Organization Types:</span>{' '}
                      <span className="font-medium">
                        {model.organization_types.length === 0
                          ? 'All types'
                          : model.organization_types.join(', ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Max Tokens:</span>{' '}
                      <span className="font-medium">{model.max_tokens}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Token Limit:</span>{' '}
                      <span className="font-medium">
                        {model.token_limit_amount
                          ? `${model.token_limit_amount.toLocaleString()}/${model.token_limit_period}`
                          : 'Unlimited'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tasks:</span>{' '}
                      <span className="font-medium">
                        {model.task && Array.isArray(model.task) ? model.task.length : 0} defined
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  {model.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {model.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    onClick={() => {
                      // TODO: Open edit modal
                      alert('Edit Model - To be implemented');
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className={`px-3 py-1 text-sm rounded ${
                      model.is_active
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                    onClick={() => toggleModelActive(model.id, model.is_active)}
                  >
                    {model.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
                    onClick={() => {
                      if (
                        confirm(
                          `Are you sure you want to delete "${model.name}"? This will affect all organizations using this model.`
                        )
                      ) {
                        // TODO: Implement delete
                        alert('Delete Model - To be implemented');
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
