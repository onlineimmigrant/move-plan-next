import { useState, useCallback } from 'react';
import * as TicketAPI from '../utils/ticketApi';
import type { Ticket, Avatar, AdminUser } from '../types';

/**
 * Props for useTicketData hook
 * 
 * @interface UseTicketDataProps
 * @property {string} organizationId - Current organization ID for filtering tickets
 * @property {number} ticketsPerPage - Number of tickets to fetch per page (pagination)
 * @property {string[]} statuses - List of status filters to apply
 * @property {Avatar | null} selectedAvatar - Initially selected avatar for responses
 * @property {(message: string, type: 'success' | 'error') => void} onToast - Toast notification callback
 */
interface UseTicketDataProps {
  organizationId: string;
  ticketsPerPage: number;
  statuses: string[];
  selectedAvatar: Avatar | null;
  onToast: (message: string, type: 'success' | 'error') => void;
}

/**
 * Return type for useTicketData hook
 * 
 * @interface UseTicketDataReturn
 * @property {Ticket[]} tickets - Array of fetched tickets
 * @property {boolean} isLoadingTickets - Loading state for initial ticket fetch
 * @property {boolean} loadingMore - Loading state for pagination (load more)
 * @property {{ [key: string]: boolean }} hasMoreTickets - Map of status to hasMore boolean
 * @property {Avatar[]} avatars - Available support avatars for admin responses
 * @property {Avatar | null} selectedAvatar - Currently selected avatar
 * @property {AdminUser[]} adminUsers - List of admin users for assignment
 * @property {string} currentUserId - Current logged-in user ID
 * @property {React.Dispatch<React.SetStateAction<Ticket[]>>} setTickets - State setter for tickets
 * @property {React.Dispatch<React.SetStateAction<Avatar | null>>} setSelectedAvatar - State setter for avatar
 * @property {(loadMore?: boolean) => Promise<void>} fetchTickets - Fetch tickets from API
 * @property {() => Promise<void>} loadMoreTickets - Load next page of tickets
 * @property {() => Promise<void>} fetchAvatars - Fetch available avatars
 * @property {() => Promise<void>} fetchAdminUsers - Fetch admin users list
 * @property {() => Promise<void>} fetchCurrentUser - Fetch current user info
 */
interface UseTicketDataReturn {
  tickets: Ticket[];
  isLoadingTickets: boolean;
  loadingMore: boolean;
  hasMoreTickets: { [key: string]: boolean };
  avatars: Avatar[];
  selectedAvatar: Avatar | null;
  adminUsers: AdminUser[];
  currentUserId: string;
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  setSelectedAvatar: React.Dispatch<React.SetStateAction<Avatar | null>>;
  fetchTickets: (loadMore?: boolean) => Promise<void>;
  loadMoreTickets: () => Promise<void>;
  fetchAvatars: () => Promise<void>;
  fetchAdminUsers: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
}

/**
 * useTicketData Hook
 * 
 * Manages all ticket-related data fetching and state management for the admin modal.
 * Handles tickets, avatars, admin users, and current user data with pagination support.
 * 
 * @hook
 * @param {UseTicketDataProps} props - Hook configuration
 * @returns {UseTicketDataReturn} Ticket data and management functions
 * 
 * @example
 * ```typescript
 * const {
 *   tickets,
 *   isLoadingTickets,
 *   avatars,
 *   adminUsers,
 *   fetchTickets,
 *   loadMoreTickets
 * } = useTicketData({
 *   organizationId: 'org-123',
 *   ticketsPerPage: 20,
 *   statuses: ['open', 'in progress'],
 *   selectedAvatar: null,
 *   onToast: showToast
 * });
 * 
 * // Fetch initial tickets
 * useEffect(() => {
 *   fetchTickets();
 * }, [fetchTickets]);
 * 
 * // Load more on scroll
 * <button onClick={loadMoreTickets}>Load More</button>
 * ```
 * 
 * Features:
 * - Pagination with load more functionality
 * - Status-based filtering
 * - Avatar management for admin responses
 * - Admin user list for ticket assignment
 * - Current user identification
 * 
 * Performance:
 * - Memoized fetch functions with useCallback
 * - Optimistic UI updates
 * - Error handling with toast notifications
 */
export const useTicketData = ({
  organizationId,
  ticketsPerPage,
  statuses,
  selectedAvatar: initialSelectedAvatar,
  onToast,
}: UseTicketDataProps): UseTicketDataReturn => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreTickets, setHasMoreTickets] = useState<{ [key: string]: boolean }>({});
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(initialSelectedAvatar);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');

  /**
   * Fetch tickets from API
   * 
   * Fetches tickets based on current organization and status filters.
   * Supports pagination via loadMore parameter.
   * 
   * @param {boolean} loadMore - Whether to append to existing tickets or replace
   * @returns {Promise<void>}
   */
  const fetchTickets = useCallback(async (loadMore: boolean = false) => {
    if (!loadMore) {
      setIsLoadingTickets(true);
    }
    try {
      const result = await TicketAPI.fetchTickets({
        loadMore,
        currentTickets: tickets,
        ticketsPerPage,
        organizationId
      });

      if (loadMore) {
        setTickets(prev => [...prev, ...result.tickets]);
      } else {
        setTickets(result.tickets);
      }

      // Check if there are more tickets to load
      const hasMore: {[key: string]: boolean} = {};
      for (const status of statuses) {
        hasMore[status] = result.hasMore;
      }
      setHasMoreTickets(hasMore);
      
    } catch (error) {
      console.error('Unexpected error in fetchTickets:', error);
      onToast('An unexpected error occurred', 'error');
    } finally {
      setIsLoadingTickets(false);
    }
  }, [tickets, ticketsPerPage, organizationId, statuses, onToast]);

  /**
   * Load more tickets (pagination)
   */
  const loadMoreTickets = useCallback(async () => {
    setLoadingMore(true);
    await fetchTickets(true);
    setLoadingMore(false);
  }, [fetchTickets]);

  /**
   * Fetch avatars for admin responses
   * Includes default avatar and restores saved selection from localStorage
   */
  const fetchAvatars = useCallback(async () => {
    try {
      const avatarData = await TicketAPI.fetchAvatars(organizationId);
      const avatarList = [
        { id: 'default', title: 'Support', full_name: undefined, image: undefined }, 
        ...avatarData
      ];
      setAvatars(avatarList);
      
      // Try to restore previously selected avatar from localStorage
      const savedAvatarId = localStorage.getItem('admin_selected_avatar_id');
      if (savedAvatarId) {
        const savedAvatar = avatarList.find(a => a.id === savedAvatarId);
        if (savedAvatar) {
          setSelectedAvatar(savedAvatar);
          return;
        }
      }
      
      // Only set default if no avatar is currently selected
      if (!selectedAvatar) {
        setSelectedAvatar(avatarList[0]);
      }
    } catch (err) {
      // Silently handle if table doesn't exist
      const avatarList = [{ id: 'default', title: 'Support', full_name: undefined, image: undefined }];
      setAvatars(avatarList);
      if (!selectedAvatar) {
        setSelectedAvatar(avatarList[0]);
      }
    }
  }, [organizationId, selectedAvatar]);

  /**
   * Fetch admin users for ticket assignment
   */
  const fetchAdminUsers = useCallback(async () => {
    try {
      const users = await TicketAPI.fetchAdminUsers(organizationId);
      setAdminUsers(users);
    } catch (err) {
      console.error('Error fetching admin users:', err);
    }
  }, [organizationId]);

  /**
   * Fetch current user ID
   */
  const fetchCurrentUser = useCallback(async () => {
    try {
      const user = await TicketAPI.fetchCurrentUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  }, []);

  return {
    tickets,
    isLoadingTickets,
    loadingMore,
    hasMoreTickets,
    avatars,
    selectedAvatar,
    adminUsers,
    currentUserId,
    setTickets,
    setSelectedAvatar,
    fetchTickets,
    loadMoreTickets,
    fetchAvatars,
    fetchAdminUsers,
    fetchCurrentUser,
  };
};
