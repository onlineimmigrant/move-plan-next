import { useState, useCallback } from 'react';
import * as TicketAPI from '../utils/ticketApi';
import type { Ticket, Avatar, AdminUser } from '../types';

interface UseTicketDataProps {
  organizationId: string;
  ticketsPerPage: number;
  statuses: string[];
  selectedAvatar: Avatar | null;
  onToast: (message: string, type: 'success' | 'error') => void;
}

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
 * Custom hook for managing ticket data fetching
 * Handles tickets, avatars, admin users, and current user data
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
   * @param loadMore - Whether to append to existing tickets or replace
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
