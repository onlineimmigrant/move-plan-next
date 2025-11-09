/**
 * Empty State Component
 * 
 * Displays friendly empty states with icons and call-to-action
 * when there's no data to show.
 */

import React from 'react';
import { Inbox, Search, CheckCircle2, AlertCircle, Mail } from 'lucide-react';

interface EmptyStateProps {
  variant?: 'no-tickets' | 'no-results' | 'all-resolved' | 'error' | 'no-messages';
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Icon mapping for different empty state variants
 */
const getIcon = (variant: EmptyStateProps['variant']) => {
  switch (variant) {
    case 'no-tickets':
      return <Inbox className="w-16 h-16 text-gray-400 dark:text-gray-500" />;
    case 'no-results':
      return <Search className="w-16 h-16 text-gray-400 dark:text-gray-500" />;
    case 'all-resolved':
      return <CheckCircle2 className="w-16 h-16 text-green-500 dark:text-green-400" />;
    case 'error':
      return <AlertCircle className="w-16 h-16 text-red-500 dark:text-red-400" />;
    case 'no-messages':
      return <Mail className="w-16 h-16 text-gray-400 dark:text-gray-500" />;
    default:
      return <Inbox className="w-16 h-16 text-gray-400 dark:text-gray-500" />;
  }
};

/**
 * Default content for each variant
 */
const getDefaultContent = (variant: EmptyStateProps['variant']) => {
  switch (variant) {
    case 'no-tickets':
      return {
        title: 'No tickets yet',
        description: 'When customers create support tickets, they will appear here.',
      };
    case 'no-results':
      return {
        title: 'No tickets found',
        description: 'Try adjusting your search or filter criteria.',
      };
    case 'all-resolved':
      return {
        title: 'All caught up!',
        description: 'You have no pending tickets. Great work!',
      };
    case 'error':
      return {
        title: 'Unable to load tickets',
        description: 'Please try again or contact support if the problem persists.',
      };
    case 'no-messages':
      return {
        title: 'No messages yet',
        description: 'Start the conversation by sending a message.',
      };
    default:
      return {
        title: 'No data available',
        description: 'There is no data to display at this time.',
      };
  }
};

/**
 * EmptyState Component
 * 
 * Displays friendly empty states with glass morphism styling.
 * 
 * @example
 * ```tsx
 * {tickets.length === 0 && (
 *   <EmptyState 
 *     variant="no-tickets"
 *     action={{
 *       label: 'Refresh',
 *       onClick: handleRefresh
 *     }}
 *   />
 * )}
 * ```
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'no-tickets',
  title,
  description,
  action,
  className = '',
}) => {
  const defaultContent = getDefaultContent(variant);
  const displayTitle = title || defaultContent.title;
  const displayDescription = description || defaultContent.description;
  const icon = getIcon(variant);

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-2xl border border-white/20 dark:border-gray-700/20">
            {icon}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {displayTitle}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {displayDescription}
        </p>

        {/* Action Button */}
        {action && (
          <button
            onClick={action.onClick}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium text-sm"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
