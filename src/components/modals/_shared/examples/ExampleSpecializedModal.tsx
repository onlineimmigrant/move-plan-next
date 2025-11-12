/**
 * Example: Specialized Components Modal
 * 
 * Demonstrates search, filters, forms, and lists
 */

'use client';

import React, { useState } from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';
import {
  StandardModalContainer,
  StandardModalHeader,
  StandardModalBody,
  StandardModalFooter,
  useModalState,
  SearchBar,
  FilterSelect,
  FilterTags,
  FormInput,
  FormTextarea,
  FormCheckbox,
  DataList,
  Pagination,
  type FilterOption,
  type ActiveFilter,
  type DataListColumn,
} from '@/components/modals/_shared';

// Sample data
interface SampleItem {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'inactive';
  created: string;
}

const sampleData: SampleItem[] = [
  { id: '1', name: 'Item One', status: 'active', created: '2025-01-15' },
  { id: '2', name: 'Item Two', status: 'pending', created: '2025-02-20' },
  { id: '3', name: 'Item Three', status: 'inactive', created: '2025-03-10' },
  { id: '4', name: 'Item Four', status: 'active', created: '2025-04-05' },
  { id: '5', name: 'Item Five', status: 'pending', created: '2025-05-12' },
];

const statusOptions: FilterOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'inactive', label: 'Inactive' },
];

/**
 * Specialized Components Example Modal
 */
export const ExampleSpecializedModal: React.FC = () => {
  const { isOpen, open, close } = useModalState();
  const [currentTab, setCurrentTab] = useState<'list' | 'form'>('list');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: false,
  });

  // Filter data
  const filteredData = sampleData.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(item.status);
    return matchesSearch && matchesStatus;
  });

  // Active filters
  const activeFilters: ActiveFilter[] = statusFilter.map((status) => ({
    key: status,
    label: 'Status',
    value: statusOptions.find((opt) => opt.value === status)?.label || status,
  }));

  // Table columns
  const columns: DataListColumn<SampleItem>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (item) => (
        <span className={`
          px-2 py-1 rounded-full text-xs font-medium
          ${item.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : ''}
          ${item.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' : ''}
          ${item.status === 'inactive' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' : ''}
        `}>
          {item.status}
        </span>
      )
    },
    { key: 'created', label: 'Created', sortable: true },
  ];

  const handleRemoveFilter = (key: string) => {
    setStatusFilter(statusFilter.filter((s) => s !== key));
  };

  const handleClearAllFilters = () => {
    setStatusFilter([]);
    setSearchQuery('');
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={open}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Open Specialized Components
      </button>

      {/* Modal */}
      <StandardModalContainer
        isOpen={isOpen}
        onClose={close}
        size="xlarge"
        ariaLabel="Specialized Components Modal"
      >
        <StandardModalHeader
          title="Specialized Components"
          subtitle="Search, filters, forms, and lists in action"
          icon={FunnelIcon}
          iconColor="text-green-500"
          tabs={[
            { id: 'list', label: 'Data List', badge: filteredData.length },
            { id: 'form', label: 'Form Example' },
          ]}
          currentTab={currentTab}
          onTabChange={(tab) => setCurrentTab(tab as 'list' | 'form')}
          badges={[
            { id: 'list', count: filteredData.length, color: 'bg-blue-500' },
          ]}
          onClose={close}
        />

        <StandardModalBody noPadding={currentTab === 'list'}>
          {currentTab === 'list' ? (
            <div className="flex flex-col h-full">
              {/* Search & Filters */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex items-center gap-3">
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search items..."
                    debounce={300}
                    fullWidth={true}
                  />
                  <FilterSelect
                    label=""
                    options={statusOptions}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    multiple={true}
                    placeholder="Filter by status"
                  />
                </div>

                {/* Active Filters */}
                <FilterTags
                  filters={activeFilters}
                  onRemove={handleRemoveFilter}
                  onClearAll={handleClearAllFilters}
                />
              </div>

              {/* Data List */}
              <div className="flex-1 overflow-auto">
                <DataList
                  data={filteredData}
                  columns={columns}
                  keyField="id"
                  selectable={true}
                  selectedKeys={selectedItems}
                  onSelect={setSelectedItems}
                  onRowClick={(item) => console.log('Clicked:', item)}
                  emptyText="No items match your filters"
                />
              </div>

              {/* Pagination */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredData.length / pageSize)}
                  onPageChange={setCurrentPage}
                  totalItems={filteredData.length}
                  pageSize={pageSize}
                  showPageSize={true}
                  onPageSizeChange={setPageSize}
                />
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6 max-w-2xl">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create New Item
              </h3>

              {/* Form Fields */}
              <FormInput
                label="Item Name"
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: value })}
                placeholder="Enter item name"
                required={true}
                helperText="Choose a unique name for this item"
              />

              <FormTextarea
                label="Description"
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Describe this item..."
                rows={4}
                maxLength={500}
                showCount={true}
                helperText="Provide a detailed description"
              />

              <FormCheckbox
                label="Active Status"
                checked={formData.active}
                onChange={(checked) => setFormData({ ...formData, active: checked })}
                helperText="Enable this item immediately after creation"
              />
            </div>
          )}
        </StandardModalBody>

        <StandardModalFooter
          primaryAction={{
            label: currentTab === 'list' ? 'Close' : 'Create Item',
            onClick: currentTab === 'list' ? close : () => console.log('Create:', formData),
            variant: 'primary',
          }}
          secondaryAction={
            currentTab === 'form'
              ? {
                  label: 'Cancel',
                  onClick: close,
                  variant: 'secondary',
                }
              : undefined
          }
          align="right"
        />
      </StandardModalContainer>
    </>
  );
};
