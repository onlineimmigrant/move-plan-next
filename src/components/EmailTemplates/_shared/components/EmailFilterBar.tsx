/**
 * Email Filter Bar Component
 * Filters for email templates (category, type, active status)
 */

'use client';

import React from 'react';
import type { FilterCategoryType, FilterActiveType, FilterTypeType, SortByType, SortOrderType } from '../types/emailTemplate';

interface EmailFilterBarProps {
  filterCategory: FilterCategoryType;
  filterActive: FilterActiveType;
  filterType: FilterTypeType;
  sortBy: SortByType;
  sortOrder: SortOrderType;
  onFilterCategoryChange: (value: FilterCategoryType) => void;
  onFilterActiveChange: (value: FilterActiveType) => void;
  onFilterTypeChange: (value: FilterTypeType) => void;
  onSortByChange: (value: SortByType) => void;
  onSortOrderChange: (value: SortOrderType) => void;
}

export const EmailFilterBar: React.FC<EmailFilterBarProps> = ({
  filterCategory,
  filterActive,
  filterType,
  sortBy,
  sortOrder,
  onFilterCategoryChange,
  onFilterActiveChange,
  onFilterTypeChange,
  onSortByChange,
  onSortOrderChange,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={filterCategory}
            onChange={(e) => onFilterCategoryChange(e.target.value as FilterCategoryType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="transactional">Transactional</option>
            <option value="system">System</option>
            <option value="marketing">Marketing</option>
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <select
            value={filterType}
            onChange={(e) => onFilterTypeChange(e.target.value as FilterTypeType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="welcome">Welcome</option>
            <option value="reset_email">Password Reset</option>
            <option value="email_confirmation">Email Confirmation</option>
            <option value="order_confirmation">Order Confirmation</option>
            <option value="ticket_confirmation">Ticket Confirmation</option>
            <option value="ticket_response">Ticket Response</option>
            <option value="meeting_invitation">Meeting Invitation</option>
            <option value="meeting_reminder">Meeting Reminder</option>
            <option value="meeting_cancellation">Meeting Cancellation</option>
            <option value="newsletter">Newsletter</option>
          </select>
        </div>

        {/* Active Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={filterActive}
            onChange={(e) => onFilterActiveChange(e.target.value as FilterActiveType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as SortByType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="created">Created Date</option>
            <option value="subject">Subject</option>
            <option value="type">Type</option>
            <option value="category">Category</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
          <select
            value={sortOrder}
            onChange={(e) => onSortOrderChange(e.target.value as SortOrderType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>
    </div>
  );
};
