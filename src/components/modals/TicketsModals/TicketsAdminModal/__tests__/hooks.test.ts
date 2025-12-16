import { renderHook, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import * as SupabaseClientModule from '@/lib/supabaseClient';

// Mock Supabase
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      }),
    },
    from: jest.fn((table) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      insert: jest.fn().mockImplementation(() => Promise.resolve({ data: { id: 'new-id' }, error: null })),
      update: jest.fn().mockImplementation(() => Promise.resolve({ data: {}, error: null })),
      delete: jest.fn().mockImplementation(() => Promise.resolve({ data: {}, error: null })),
      single: jest.fn().mockReturnThis(),
      then: jest.fn((fn) => Promise.resolve({ data: [], error: null }).then(fn)),
    })),
    channel: jest.fn(() => ({
      send: jest.fn().mockReturnValue(Promise.resolve()),
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      unsubscribe: jest.fn().mockReturnValue(Promise.resolve()),
    })),
  },
}));

jest.mock('@/context/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      organization_id: 'org-1',
      timeFormat: '12h',
      dateFormat: 'MM/dd/yyyy',
    },
  }),
}));

// Mock TicketAPI
jest.mock('../utils/ticketApi', () => ({
  addTagToTicket: jest.fn().mockResolvedValue(undefined),
  removeTagFromTicket: jest.fn().mockResolvedValue(undefined),
  updateTicketStatus: jest.fn().mockResolvedValue(undefined),
  updateTicketPriority: jest.fn().mockResolvedValue(undefined),
  assignTicket: jest.fn().mockResolvedValue(undefined),
  saveInternalNote: jest.fn().mockResolvedValue({ id: 'note-1' }),
  deleteInternalNote: jest.fn().mockResolvedValue(undefined),
}));

// Import hooks after mocks
import { useTicketOperations } from '../hooks/useTicketOperations';
import { useMessageHandling } from '../hooks/useMessageHandling';
import { useInternalNotes } from '../hooks/useInternalNotes';
import { useTagManagement } from '../hooks/useTagManagement';

describe('useTicketOperations', () => {
  const mockProps = {
    organizationId: 'org-1',
    onToast: jest.fn(),
    onRefreshTickets: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useTicketOperations(mockProps));
    
    expect(result.current.handleAssignTicket).toBeDefined();
    expect(result.current.handlePriorityChange).toBeDefined();
    expect(result.current.handleStatusChange).toBeDefined();
    expect(result.current.confirmCloseTicket).toBeDefined();
    expect(result.current.isChangingStatus).toBe(false);
    expect(result.current.isChangingPriority).toBe(false);
    expect(result.current.isAssigning).toBe(false);
  });

  it('should handle ticket assignment', async () => {
    const { result } = renderHook(() => useTicketOperations(mockProps));
    
    await act(async () => {
      await result.current.handleAssignTicket('ticket-1', 'admin-1');
    });
    
    // Should call toast on success
    expect(mockProps.onToast).toHaveBeenCalled();
  });

  it('should handle priority change', async () => {
    const { result } = renderHook(() => useTicketOperations(mockProps));
    
    await act(async () => {
      await result.current.handlePriorityChange('ticket-1', 'high');
    });
    
    expect(mockProps.onToast).toHaveBeenCalled();
  });

  it('should handle status change with state updates', async () => {
    const mockSetTickets = jest.fn();
    const mockSetSelectedTicket = jest.fn();
    const tickets = [{ 
      id: 'ticket-1', 
      status: 'open',
      subject: 'Test',
      customer_id: 'customer-1',
      created_at: new Date().toISOString(),
      message: 'Test message',
      messages: [],
      organization_id: 'org-1',
      preferred_contact_method: null,
      email: 'customer@test.com',
      ticket_responses: [],
    }];
    
    const { result } = renderHook(() => useTicketOperations(mockProps));
    
    await act(async () => {
      await result.current.handleStatusChange(
        'ticket-1',
        'in progress',
        tickets,
        mockSetTickets,
        mockSetSelectedTicket,
        'ticket-1'
      );
    });
    
    // Should update state
    expect(mockSetTickets).toHaveBeenCalled();
  });
});

describe('useMessageHandling', () => {
  const mockProps = {
    selectedTicket: null,
    selectedAvatar: null,
    setSelectedTicket: jest.fn(),
    setTickets: jest.fn(),
    setToast: jest.fn(),
    getCurrentISOString: jest.fn(() => new Date().toISOString()),
    loadAttachmentUrls: jest.fn(),
    fetchInternalNotes: jest.fn(),
    setShowInternalNotes: jest.fn(),
    setInternalNotes: jest.fn(),
    messagesContainerRef: { current: null } as React.RefObject<HTMLDivElement>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default message state', () => {
    const { result } = renderHook(() => useMessageHandling(mockProps));
    
    expect(result.current.responseMessage).toBe('');
    expect(result.current.isSending).toBe(false);
  });

  it('should update message on change', () => {
    const { result } = renderHook(() => useMessageHandling(mockProps));
    
    act(() => {
      const event = {
        target: { value: 'Test message' },
      } as React.ChangeEvent<HTMLTextAreaElement>;
      result.current.handleMessageChange(event);
    });
    
    expect(result.current.responseMessage).toBe('Test message');
  });

  it('should have broadcast typing function', () => {
    const { result } = renderHook(() => useMessageHandling(mockProps));
    
    expect(result.current.broadcastTyping).toBeDefined();
    expect(typeof result.current.broadcastTyping).toBe('function');
  });

  it('should handle admin respond', async () => {
    const { result } = renderHook(() => useMessageHandling(mockProps));
    
    await act(async () => {
      await result.current.handleAdminRespond();
    });
    
    // Should not crash on empty message
    expect(result.current.isSending).toBe(false);
  });
});describe('useInternalNotes', () => {
  const mockProps = {
    organizationId: 'org-1',
    currentUserId: 'admin-1',
    onToast: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty notes', () => {
    const { result } = renderHook(() => useInternalNotes(mockProps));
    
    expect(result.current.internalNotes).toEqual([]);
    expect(result.current.isAddingNote).toBe(false);
  });

  it('should have fetch internal notes function', () => {
    const { result } = renderHook(() => useInternalNotes(mockProps));
    
    expect(result.current.fetchInternalNotes).toBeDefined();
    expect(typeof result.current.fetchInternalNotes).toBe('function');
  });

  it('should handle add internal note', async () => {
    const { result } = renderHook(() => useInternalNotes(mockProps));
    const onSuccess = jest.fn();
    
    await act(async () => {
      await result.current.handleAddInternalNote('ticket-1', 'Test note', onSuccess);
    });
    
    // Should call success callback on successful add
    expect(onSuccess).toHaveBeenCalled();
  });

  it('should handle delete internal note', async () => {
    const { result } = renderHook(() => useInternalNotes(mockProps));
    
    await act(async () => {
      await result.current.handleDeleteInternalNote('note-1');
    });
    
    // Should call toast on success
    expect(mockProps.onToast).toHaveBeenCalled();
  });
});

describe('useTagManagement', () => {
  const mockProps = {
    organizationId: 'org-1',
    onToast: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty tags', () => {
    const { result } = renderHook(() => useTagManagement(mockProps));
    
    expect(result.current.availableTags).toEqual([]);
    expect(result.current.isLoadingTags).toBe(false);
  });

  it('should have fetch tags function', () => {
    const { result } = renderHook(() => useTagManagement(mockProps));
    
    expect(result.current.fetchTags).toBeDefined();
    expect(typeof result.current.fetchTags).toBe('function');
  });

  it('should create tag', async () => {
    const { result } = renderHook(() => useTagManagement(mockProps));
    
    await act(async () => {
      await result.current.handleCreateTag('New Tag', 'green');
    });
    
    // Should call toast on success
    expect(mockProps.onToast).toHaveBeenCalled();
  });

  it('should assign tag to ticket', async () => {
    const mockUpdateTickets = jest.fn();
    const mockUpdateSelectedTicket = jest.fn();
    
    // Mock Supabase to return tags when fetching
    const supabaseMock = SupabaseClientModule.supabase as any;
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'ticket_tags') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          then: jest.fn((fn) => Promise.resolve({ 
            data: [{ id: 'tag-1', name: 'Test Tag', color: 'blue' }], 
            error: null 
          }).then(fn)),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      };
    });
    
    const { result } = renderHook(() => useTagManagement(mockProps));
    
    // First fetch tags so availableTags is populated
    await act(async () => {
      await result.current.fetchTags();
    });
    
    // Now assign the tag
    await act(async () => {
      await result.current.handleAssignTag('ticket-1', 'tag-1', mockUpdateTickets, mockUpdateSelectedTicket);
    });
    
    // Should update tickets
    expect(mockUpdateTickets).toHaveBeenCalled();
  });

  it('should remove tag from ticket', async () => {
    const mockUpdateTickets = jest.fn();
    const mockUpdateSelectedTicket = jest.fn();
    
    const { result } = renderHook(() => useTagManagement(mockProps));
    
    await act(async () => {
      await result.current.handleRemoveTag('ticket-1', 'tag-1', mockUpdateTickets, mockUpdateSelectedTicket);
    });
    
    // Should call toast on success
    expect(mockProps.onToast).toHaveBeenCalled();
  });
});
