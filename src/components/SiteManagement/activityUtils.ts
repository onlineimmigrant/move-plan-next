// Activity tracking types and utilities
export interface Activity {
  id: string;
  organization_id: string;
  organization_name: string;
  action: 'created' | 'updated' | 'deployed' | 'deleted';
  details?: string;
  created_at: string;
  user_email?: string;
}

export interface ActivityResponse {
  activities: Activity[];
  total: number;
}

// Format relative time for display
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// Get activity color based on action type
export function getActivityColor(action: Activity['action']): string {
  switch (action) {
    case 'created':
      return 'bg-green-500';
    case 'updated':
      return 'bg-blue-500';
    case 'deployed':
      return 'bg-purple-500';
    case 'deleted':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

// Get activity display text (shorter format without "Organization")
export function getActivityText(action: Activity['action']): string {
  switch (action) {
    case 'created':
      return 'created';
    case 'updated':
      return 'updated';
    case 'deployed':
      return 'deployed';
    case 'deleted':
      return 'deleted';
    default:
      return 'action';
  }
}
