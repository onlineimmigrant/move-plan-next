/**
 * AccountsView Component
 *
 * Displays and manages all user accounts for the organization
 * Part of the CRM modal - Accounts tab
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, UserPlus, Download, Upload } from 'lucide-react';
import { Profile } from '../types';
import { AccountEditModal } from './AccountEditModal';
import { AccountDetailModal } from './AccountDetailModal';
import ImportExportMenu from './ImportExportMenu';
import { useCrm } from '../context/CrmContext';
import { useAccountsData } from '../hooks/useAccountsData';
import { FilterPanel, FilterGroup } from './shared';

interface AccountsViewProps {
  organizationId?: string;
  searchQuery?: string;
}

export default function AccountsView({ organizationId, searchQuery = '' }: AccountsViewProps) {
  const { showToast, primary, refreshTrigger } = useCrm();
  const { accounts, isLoading, resolvedOrgId, fetchAccounts, refreshAccounts } = useAccountsData({
    organizationId,
    onToast: showToast,
  });
  
  const [typeFilter, setTypeFilter] = useState<'all' | 'team' | 'customer' | 'regular'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'email'>('name');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Profile | null>(null);
  const [showImportExportMenu, setShowImportExportMenu] = useState(false);
  const [importExportMode, setImportExportMode] = useState<'import' | 'export'>('export');

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts, refreshTrigger]);

  const filteredAccounts = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    
    let filtered = accounts.filter(account => {
      // Search filter
      if (searchQuery && !(
        account.full_name?.toLowerCase().includes(searchLower) ||
        account.email?.toLowerCase().includes(searchLower) ||
        account.username?.toLowerCase().includes(searchLower) ||
        account.role?.toLowerCase().includes(searchLower)
      )) {
        return false;
      }

      // Type filter
      if (typeFilter === 'team' && account.team?.is_team_member !== true) return false;
      if (typeFilter === 'customer' && account.customer?.is_customer !== true) return false;
      if (typeFilter === 'regular' && (account.team?.is_team_member || account.customer?.is_customer)) return false;

      // Role filter
      if (roleFilter !== 'all' && account.role !== roleFilter) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return (a.full_name || '').localeCompare(b.full_name || '');
      } else if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'email') {
        return (a.email || '').localeCompare(b.email || '');
      }
      return 0;
    });

    return filtered;
  }, [accounts, searchQuery, typeFilter, roleFilter, sortBy]);

  // Memoize helper functions for better performance
  const getAccountImage = useCallback((account: Profile) => {
    return account.team?.image || account.customer?.image || null;
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

  // Memoize account counts for filter options (single-pass)
  const accountCounts = useMemo(() => {
    return accounts.reduce(
      (counts, account) => {
        counts.total++;
        if (account.team?.is_team_member) counts.team++;
        if (account.customer?.is_customer) counts.customer++;
        if (!account.team?.is_team_member && !account.customer?.is_customer) counts.regular++;
        if (account.role === 'admin') counts.admin++;
        if (account.role === 'user' || !account.role) counts.user++;
        return counts;
      },
      { total: 0, team: 0, customer: 0, regular: 0, admin: 0, user: 0 }
    );
  }, [accounts]);

  // Memoize callbacks
  const handleCardClick = useCallback((account: Profile) => {
    setSelectedAccount(account);
    setShowDetailModal(true);
  }, []);

  const handleToggleFilter = useCallback(() => {
    setIsFilterOpen(!isFilterOpen);
  }, [isFilterOpen]);

  const handleImportClick = useCallback(() => {
    setImportExportMode('import');
    setShowImportExportMenu(true);
  }, []);

  const handleExportClick = useCallback(() => {
    setImportExportMode('export');
    setShowImportExportMenu(true);
  }, []);

  const handleAddAccountClick = useCallback(() => {
    setShowAddModal(true);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Accounts Grid */}
      <div className="flex-1 px-6 pt-6 pb-24 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-600 dark:text-gray-400">Loading accounts...</p>
            </div>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No accounts found' : 'No accounts yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? 'Try adjusting your search terms' : 'Start by adding user accounts to your organization'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccounts.map((account) => {
              const accountImage = getAccountImage(account);
              
              return (
                <div
                  key={account.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all cursor-pointer group"
                  style={{
                    backgroundColor: account.role === 'admin' 
                      ? `${primary.base}15` 
                      : undefined
                  }}
                  onClick={() => handleCardClick(account)}
                >
                  {/* Avatar and Name */}
                  <div className="flex items-start gap-3 mb-3">
                    {accountImage ? (
                      <img
                        src={accountImage}
                        alt={account.full_name || 'Account'}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                        }}
                      >
                        {getInitials(account.full_name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {account.full_name || 'Unnamed'}
                      </h3>
                      {account.username && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          @{account.username}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {account.role === 'admin' && (
                          <span 
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded"
                            style={{
                              backgroundColor: `${primary.base}`,
                              color: 'white'
                            }}
                          >
                            Admin
                          </span>
                        )}
                        {account.team?.is_team_member && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded">
                            Team Member
                          </span>
                        )}
                        {(account.customer?.is_lead === true && account.customer?.is_customer !== true) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded">
                            Lead
                          </span>
                        )}
                        {account.customer?.is_customer === true && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded">
                            Customer
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                {/* Email */}
                <div className="mb-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {account.email}
                  </p>
                </div>

                {/* Location */}
                {(account.city || account.country) && (
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {[account.city, account.country].filter(Boolean).join(', ')}
                  </div>
                )}

                {/* Created Date */}
                {account.created_at && (
                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Joined {new Date(account.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Fixed Bottom Panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 rounded-b-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Filters Button */}
          <div className="relative w-full sm:w-auto">
            <FilterPanel
            filters={[
              {
                id: 'type',
                label: 'Account Type',
                value: typeFilter,
                options: [
                  { value: 'all', label: 'All Accounts', count: accountCounts.total },
                  { value: 'team', label: 'Team Members', count: accountCounts.team },
                  { value: 'customer', label: 'Customers', count: accountCounts.customer },
                  { value: 'regular', label: 'Regular Users', count: accountCounts.regular },
                ],
                onChange: (value) => setTypeFilter(value as 'all' | 'team' | 'customer' | 'regular'),
              },
              {
                id: 'role',
                label: 'Role',
                value: roleFilter,
                options: [
                  { value: 'all', label: 'All Roles', count: accountCounts.total },
                  { value: 'admin', label: 'Admin', count: accountCounts.admin },
                  { value: 'user', label: 'User', count: accountCounts.user },
                ],
                onChange: (value) => setRoleFilter(value as 'all' | 'admin' | 'user'),
              },
              {
                id: 'sort',
                label: 'Sort By',
                value: sortBy,
                options: [
                  { value: 'name', label: 'Name' },
                  { value: 'date', label: 'Join Date' },
                  { value: 'email', label: 'Email' },
                ],
                onChange: (value) => setSortBy(value as 'name' | 'date' | 'email'),
              },
            ]}
            isOpen={isFilterOpen}
            onToggle={handleToggleFilter}
            hoveredFilter={hoveredFilter}
            onHoverFilter={setHoveredFilter}
            primaryColor={primary.base}
            primaryHover={primary.hover}
          />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Import Button */}
            <button
              onClick={handleImportClick}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity text-sm"
              style={{
                backgroundColor: '#f3f4f6',
                color: primary.base,
              }}
            >
              <Upload className="w-4 h-4" />
              Import
            </button>

            {/* Export Button */}
            <button
              onClick={handleExportClick}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity text-sm"
              style={{
                backgroundColor: '#f3f4f6',
                color: primary.base,
              }}
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            {/* Add Account Button */}
            <button
              onClick={handleAddAccountClick}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity text-sm"
              style={{
                background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
              }}
            >
              <UserPlus className="w-4 h-4" />
              Add Account
            </button>
          </div>
        </div>
      </div>

      {/* Account Edit Modal */}
      {resolvedOrgId && (
        <AccountEditModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          organizationId={resolvedOrgId}
          onSuccess={refreshAccounts}
        />
      )}

      {/* Account Detail Modal */}
      <AccountDetailModal
        isOpen={showDetailModal}
        account={selectedAccount}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedAccount(null);
        }}
        onUpdate={refreshAccounts}
      />

      {/* Import/Export Menu */}
      {showImportExportMenu && resolvedOrgId && (
        <ImportExportMenu
          profiles={filteredAccounts}
          organizationId={resolvedOrgId}
          onImportComplete={refreshAccounts}
          onClose={() => setShowImportExportMenu(false)}
          mode={importExportMode}
          primary={primary}
        />
      )}
    </div>
  );
}