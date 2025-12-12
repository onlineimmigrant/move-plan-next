/**
 * LeadsView Component
 *
 * Displays and manages leads
 * Part of the CRM modal - Leads tab
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Profile } from '../types';
import { Target, TrendingUp, CheckCircle, Clock, XCircle, UserCheck } from 'lucide-react';
import { AccountDetailModal } from './AccountDetailModal';
import { useCrm } from '../context/CrmContext';
import { useLeadsData } from '../hooks/useLeadsData';
import { convertLeadToCustomer } from '@/lib/api/crm';
import { FilterPanel, FilterGroup } from './shared';

interface LeadsViewProps {
  organizationId?: string;
  primary?: { base: string; hover: string };
  searchQuery?: string;
}

export default function LeadsView({ organizationId, primary, searchQuery = '' }: LeadsViewProps) {
  const { showToast, primary: ctxPrimary, refreshTrigger } = useCrm();
  const effectivePrimary = primary || ctxPrimary;
  const { leads, isLoading: loading, fetchLeadsData, setLeads } = useLeadsData({
    organizationId,
    onToast: showToast,
  });
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'score'>('name');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Profile | null>(null);

  useEffect(() => {
    fetchLeadsData();
  }, [fetchLeadsData, organizationId, refreshTrigger]);

  const filteredLeads = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    
    let filtered = leads.filter(lead => {
      // Search filter
      if (searchQuery && !(
        lead.full_name?.toLowerCase().includes(searchLower) ||
        lead.email?.toLowerCase().includes(searchLower) ||
        lead.customer?.company?.toLowerCase().includes(searchLower)
      )) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && lead.customer?.lead_status !== statusFilter) {
        return false;
      }

      return true;
    });

    // Sort in-place
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return (a.full_name || '').localeCompare(b.full_name || '');
      } else if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'score') {
        return (b.customer?.lead_score || 0) - (a.customer?.lead_score || 0);
      }
      return 0;
    });

    return filtered;
  }, [leads, searchQuery, statusFilter, sortBy]);

  const handleConvertToCustomer = useCallback(async (leadId: string) => {
    try {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) {
        showToast('Lead not found', 'error');
        return;
      }

      const result = await convertLeadToCustomer(leadId, lead.customer);
      
      if (result.error) {
        showToast(result.error, 'error');
      } else {
        showToast('Lead converted to customer successfully', 'success');
        fetchLeadsData();
      }
    } catch (error) {
      console.error('Error converting lead:', error);
      showToast('Failed to convert lead', 'error');
    }
  }, [leads, showToast, fetchLeadsData]);

  // Memoize helper functions
  const getStatusIcon = useCallback((status?: string) => {
    switch (status) {
      case 'new': return <Clock className="w-4 h-4" />;
      case 'contacted': return <TrendingUp className="w-4 h-4" />;
      case 'qualified': return <Target className="w-4 h-4" />;
      case 'converted': return <CheckCircle className="w-4 h-4" />;
      case 'lost': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  }, []);

  const getStatusColor = useCallback((status?: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'contacted': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'qualified': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'converted': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'lost': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  }, []);

  const getInitials = useCallback((name?: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  // Memoize lead counts for filter options (single-pass)
  const leadCounts = useMemo(() => {
    return leads.reduce(
      (counts, lead) => {
        counts.total++;
        const status = lead.customer?.lead_status;
        if (status === 'new') counts.new++;
        else if (status === 'contacted') counts.contacted++;
        else if (status === 'qualified') counts.qualified++;
        else if (status === 'converted') counts.converted++;
        else if (status === 'lost') counts.lost++;
        return counts;
      },
      { total: 0, new: 0, contacted: 0, qualified: 0, converted: 0, lost: 0 }
    );
  }, [leads]);

  const filterGroups: FilterGroup[] = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      value: statusFilter,
      options: [
        { value: 'all', label: 'All Statuses', count: leadCounts.total },
        { value: 'new', label: 'New', count: leadCounts.new },
        { value: 'contacted', label: 'Contacted', count: leadCounts.contacted },
        { value: 'qualified', label: 'Qualified', count: leadCounts.qualified },
        { value: 'converted', label: 'Converted', count: leadCounts.converted },
        { value: 'lost', label: 'Lost', count: leadCounts.lost },
      ],
      onChange: setStatusFilter,
    },
    {
      id: 'sort',
      label: 'Sort By',
      value: sortBy,
      options: [
        { value: 'name', label: 'Name' },
        { value: 'date', label: 'Date' },
        { value: 'score', label: 'Lead Score' },
      ],
      onChange: (val) => setSortBy(val as 'name' | 'date' | 'score'),
    },
  ], [statusFilter, sortBy, leadCounts]);

  const handleLeadClick = useCallback((lead: Profile) => {
    setSelectedLead(lead);
    setShowDetailModal(true);
  }, []);

  const handleToggleFilter = useCallback(() => {
    setIsFilterOpen(!isFilterOpen);
  }, [isFilterOpen]);

  return (
    <div className="flex flex-col h-full">
      {/* Leads Grid */}
      <div className="flex-1 px-6 pt-6 pb-24 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-600 dark:text-gray-400">Loading leads...</p>
            </div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No leads found' : 'No leads yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? 'Try adjusting your search terms' : 'Mark accounts as leads to see them here'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => handleLeadClick(lead)}
              >
                {/* Avatar and Name */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                    style={{
                      background: primary ? `linear-gradient(135deg, ${primary.base}, ${primary.hover})` : '#6b7280',
                    }}
                  >
                    {getInitials(lead.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {lead.full_name || 'Unnamed'}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(lead.customer?.lead_status)}`}>
                        {getStatusIcon(lead.customer?.lead_status)}
                        {lead.customer?.lead_status || 'new'}
                      </span>
                      {lead.customer?.lead_score && (
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium">
                          Score: {lead.customer.lead_score}/10
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Company */}
                {lead.customer?.company && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {lead.customer.company}
                    {lead.customer.job_title && ` • ${lead.customer.job_title}`}
                  </p>
                )}

                {/* Email */}
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
                  {lead.email}
                </p>

                {/* Source */}
                {lead.customer?.lead_source && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                    Source: {lead.customer.lead_source}
                  </p>
                )}

                {/* Notes */}
                {lead.customer?.lead_notes && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded line-clamp-2">
                    {lead.customer.lead_notes}
                  </p>
                )}

                {/* Convert to Customer Badge */}
                {lead.customer?.lead_status !== 'converted' && lead.customer?.lead_status !== 'lost' && primary && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConvertToCustomer(lead.id);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white transition-all hover:opacity-90 hover:scale-105 shadow-sm mt-3"
                    style={{ backgroundColor: primary.base }}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Convert to Customer
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed Bottom Panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 rounded-b-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Filters Button */}
          <div className="relative w-full sm:w-auto">
            <FilterPanel
              filters={filterGroups}
              isOpen={isFilterOpen}
              onToggle={handleToggleFilter}
              hoveredFilter={hoveredFilter}
              onHoverFilter={setHoveredFilter}
              primaryColor={effectivePrimary.base}
              primaryHover={effectivePrimary.hover}
            />
          </div>
        </div>
      </div>

      {/* Account Detail Modal */}
      <AccountDetailModal
        isOpen={showDetailModal}
        account={selectedLead}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedLead(null);
        }}
        onUpdate={fetchLeadsData}
      />
    </div>
  );
}