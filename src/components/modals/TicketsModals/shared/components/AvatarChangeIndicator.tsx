import React from 'react';
import { Avatar } from '../types';

interface AvatarChangeIndicatorProps {
  /**
   * Avatar object to display
   */
  avatar: Avatar | null;
  
  /**
   * Display name to show
   */
  displayName: string;
  
  /**
   * Whether this is an admin message
   */
  isAdmin: boolean;
  
  /**
   * Optional: Whether this is the current user's avatar (admin modal only)
   */
  isCurrentAvatar?: boolean;
  
  /**
   * Function to render the avatar (from shared utils)
   */
  renderAvatar: (avatar: Avatar | null, name: string, isAdmin: boolean) => React.ReactNode;
}

/**
 * AvatarChangeIndicator Component
 * 
 * Displays a visual indicator when a different avatar/admin joins the conversation.
 * Shows a divider line with the avatar and name in the center.
 * 
 * Used in both admin and customer ticket modals to show when the responding
 * admin changes (different avatar_id in consecutive admin responses).
 * 
 * @example
 * {avatarChanged && (
 *   <AvatarChangeIndicator
 *     avatar={avatar}
 *     displayName={displayName}
 *     isAdmin={response.is_admin}
 *     renderAvatar={renderAvatar}
 *   />
 * )}
 */
export default function AvatarChangeIndicator({
  avatar,
  displayName,
  isAdmin,
  isCurrentAvatar = false,
  renderAvatar,
}: AvatarChangeIndicatorProps) {
  return (
    <div className="flex items-center gap-3 my-3 animate-fade-in">
      <div className="flex-1 border-t border-slate-300"></div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        {renderAvatar(avatar, displayName, isAdmin)}
        <span>
          {displayName} {isCurrentAvatar ? '(You) ' : ''}joined the conversation
        </span>
      </div>
      <div className="flex-1 border-t border-slate-300"></div>
    </div>
  );
}
