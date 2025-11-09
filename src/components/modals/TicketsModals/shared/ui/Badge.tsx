/**
 * Badge Component
 * 
 * Small labeled component for status, priority, tags, and counts.
 */

import React, { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'status' | 'priority' | 'tag' | 'count' | 'custom';
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  removable?: boolean;
  onRemove?: () => void;
}

/**
 * Get badge size classes
 */
const getSizeClasses = (size: BadgeProps['size']) => {
  switch (size) {
    case 'sm':
      return 'px-2 py-0.5 text-xs';
    case 'md':
      return 'px-2.5 py-1 text-xs';
    case 'lg':
      return 'px-3 py-1.5 text-sm';
    default:
      return 'px-2.5 py-1 text-xs';
  }
};

/**
 * Get predefined variant styles
 */
const getVariantClasses = (variant: BadgeProps['variant'], color?: string) => {
  if (variant === 'custom' && color) {
    return {
      backgroundColor: `${color}20`,
      borderColor: `${color}40`,
      color: color,
    };
  }

  switch (variant) {
    case 'status':
      return 'bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50';
    case 'priority':
      return 'bg-red-100/80 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200/50 dark:border-red-700/50';
    case 'tag':
      return 'bg-purple-100/80 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-700/50';
    case 'count':
      return 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50';
    default:
      return 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50';
  }
};

/**
 * Badge Component
 * 
 * Displays small labels for status, priority, tags, and counts
 * with glass morphism styling.
 * 
 * @example
 * ```tsx
 * <Badge variant="status">Open</Badge>
 * <Badge variant="priority" color="#ef4444">High</Badge>
 * <Badge variant="tag" removable onRemove={handleRemove}>
 *   Bug
 * </Badge>
 * <Badge variant="count">{unreadCount}</Badge>
 * ```
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'custom',
  color,
  size = 'md',
  className = '',
  onClick,
  removable = false,
  onRemove,
}) => {
  const sizeClasses = getSizeClasses(size);
  const variantClasses = variant === 'custom' && color ? '' : getVariantClasses(variant);
  const customStyles = variant === 'custom' && color ? getVariantClasses('custom', color) : {};

  const isClickable = !!onClick || removable;

  return (
    <span
      className={`
        inline-flex items-center gap-1
        rounded-full font-medium
        backdrop-blur-sm
        transition-all duration-200
        ${sizeClasses}
        ${variantClasses}
        ${isClickable ? 'cursor-pointer hover:shadow-sm' : ''}
        ${className}
      `.trim()}
      style={typeof customStyles === 'object' ? customStyles : undefined}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <span>{children}</span>
      
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex-shrink-0 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors"
          aria-label="Remove"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  );
};

/**
 * StatusBadge - Specialized badge for ticket status
 */
export const StatusBadge: React.FC<{
  status: string;
  className?: string;
}> = ({ status, className }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return { bg: 'bg-green-100/80 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-200/50 dark:border-green-700/50' };
      case 'in progress':
        return { bg: 'bg-yellow-100/80 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200/50 dark:border-yellow-700/50' };
      case 'closed':
        return { bg: 'bg-gray-100/80 dark:bg-gray-800/80', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-200/50 dark:border-gray-700/50' };
      case 'pending':
        return { bg: 'bg-blue-100/80 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200/50 dark:border-blue-700/50' };
      default:
        return { bg: 'bg-gray-100/80 dark:bg-gray-800/80', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200/50 dark:border-gray-700/50' };
    }
  };

  const colors = getStatusColor(status);

  return (
    <Badge
      variant="custom"
      className={`${colors.bg} ${colors.text} border ${colors.border} ${className}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

/**
 * PriorityBadge - Specialized badge for ticket priority
 */
export const PriorityBadge: React.FC<{
  priority?: string | null;
  className?: string;
}> = ({ priority, className }) => {
  if (!priority) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return { bg: 'bg-red-100/80 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-200/50 dark:border-red-700/50' };
      case 'medium':
        return { bg: 'bg-yellow-100/80 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200/50 dark:border-yellow-700/50' };
      case 'low':
        return { bg: 'bg-green-100/80 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-200/50 dark:border-green-700/50' };
      default:
        return { bg: 'bg-gray-100/80 dark:bg-gray-800/80', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200/50 dark:border-gray-700/50' };
    }
  };

  const colors = getPriorityColor(priority);

  return (
    <Badge
      variant="custom"
      className={`${colors.bg} ${colors.text} border ${colors.border} ${className}`}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
};

export default Badge;
