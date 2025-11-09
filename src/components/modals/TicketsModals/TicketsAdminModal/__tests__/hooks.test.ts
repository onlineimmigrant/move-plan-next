import { renderHook, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      then: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
}));

// Import hooks after mocks
import { useTicketOperations } from '../hooks/useTicketOperations';
import { useMessageHandling } from '../hooks/useMessageHandling';
import { useInternalNotes } from '../hooks/useInternalNotes';
import { useTagManagement } from '../hooks/useTagManagement';

describe('useTicketOperations', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useTicketOperations());
    
    expect(result.current.handleAssignTicket).toBeDefined();
    expect(result.current.handlePriorityChange).toBeDefined();
    expect(result.current.handleStatusChange).toBeDefined();
    expect(result.current.confirmCloseTicket).toBeDefined();
  });

  it('should handle ticket assignment', async () => {
    const { result } = renderHook(() => useTicketOperations());
    
    await act(async () => {
      await result.current.handleAssignTicket('ticket-1', 'admin-1');
    });
    
    // Verify Supabase was called
    const { supabase } = require('@/lib/supabase');
    expect(supabase.from).toHaveBeenCalledWith('tickets');
  });

  it('should handle priority change', async () => {
    const { result } = renderHook(() => useTicketOperations());
    
    await act(async () => {
      await result.current.handlePriorityChange('ticket-1', 'high');
    });
    
    const { supabase } = require('@/lib/supabase');
    expect(supabase.from).toHaveBeenCalledWith('tickets');
  });

  it('should handle status change with state updates', async () => {
    const mockSetTickets = jest.fn();
    const mockSetSelectedTicket = jest.fn();
    const tickets = [{ id: 'ticket-1', status: 'open' }];
    
    const { result } = renderHook(() => useTicketOperations());
    
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
  it('should initialize with default message state', () => {
    const { result } = renderHook(() => useMessageHandling(null, jest.fn(), jest.fn()));
    
    expect(result.current.responseMessage).toBe('');
    expect(result.current.isSending).toBe(false);
  });

  it('should update message on change', () => {
    const { result } = renderHook(() => useMessageHandling(null, jest.fn(), jest.fn()));
    
    act(() => {
      const event = {
        target: { value: 'Test message' },
      } as React.ChangeEvent<HTMLTextAreaElement>;
      result.current.handleMessageChange(event);
    });
    
    expect(result.current.responseMessage).toBe('Test message');
  });

  it('should broadcast typing status', () => {
    const mockBroadcast = jest.fn();
    const { result } = renderHook(() => useMessageHandling(null, jest.fn(), mockBroadcast));
    
    act(() => {
      result.current.broadcastTyping();
    });
    
    expect(mockBroadcast).toHaveBeenCalled();
  });

  it('should handle message send', async () => {
    const selectedTicket = { id: 'ticket-1', subject: 'Test' };
    const mockSetTickets = jest.fn();
    
    const { result } = renderHook(() => 
      useMessageHandling(selectedTicket as any, mockSetTickets, jest.fn())
    );
    
    // Set a message
    act(() => {
      const event = {
        target: { value: 'Test response' },
      } as React.ChangeEvent<HTMLTextAreaElement>;
      result.current.handleMessageChange(event);
    });
    
    await act(async () => {
      await result.current.handleAdminRespond();
    });
    
    // Message should be cleared after sending
    expect(result.current.responseMessage).toBe('');
  });
});

describe('useInternalNotes', () => {
  const selectedTicket = { id: 'ticket-1', subject: 'Test' };

  it('should initialize with empty notes', () => {
    const { result } = renderHook(() => useInternalNotes(selectedTicket as any));
    
    expect(result.current.internalNotes).toEqual([]);
    expect(result.current.isAddingNote).toBe(false);
  });

  it('should add internal note', async () => {
    const { result } = renderHook(() => useInternalNotes(selectedTicket as any));
    
    await act(async () => {
      await result.current.handleAddInternalNote('ticket-1', 'Test note', jest.fn());
    });
    
    const { supabase } = require('@/lib/supabase');
    expect(supabase.from).toHaveBeenCalledWith('ticket_internal_notes');
  });

  it('should toggle pin note', async () => {
    const { result } = renderHook(() => useInternalNotes(selectedTicket as any));
    
    await act(async () => {
      await result.current.handleTogglePinNote('note-1', false, 'ticket-1');
    });
    
    const { supabase } = require('@/lib/supabase');
    expect(supabase.from).toHaveBeenCalledWith('ticket_internal_notes');
  });

  it('should delete internal note', async () => {
    const { result } = renderHook(() => useInternalNotes(selectedTicket as any));
    
    await act(async () => {
      await result.current.handleDeleteInternalNote('note-1', 'ticket-1');
    });
    
    const { supabase } = require('@/lib/supabase');
    expect(supabase.from).toHaveBeenCalledWith('ticket_internal_notes');
  });
});

describe('useTagManagement', () => {
  it('should initialize with empty tags', () => {
    const { result } = renderHook(() => useTagManagement());
    
    expect(result.current.availableTags).toEqual([]);
  });

  it('should fetch tags', async () => {
    const mockTags = [
      { id: 'tag-1', name: 'Bug', color: 'red' },
      { id: 'tag-2', name: 'Feature', color: 'blue' },
    ];
    
    const { supabase } = require('@/lib/supabase');
    supabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      then: jest.fn(() => Promise.resolve({ data: mockTags, error: null })),
    }));
    
    const { result } = renderHook(() => useTagManagement());
    
    await act(async () => {
      await result.current.fetchTags();
    });
    
    await waitFor(() => {
      expect(result.current.availableTags).toEqual(mockTags);
    });
  });

  it('should create tag', async () => {
    const { result } = renderHook(() => useTagManagement());
    
    await act(async () => {
      await result.current.handleCreateTag('New Tag', 'green');
    });
    
    const { supabase } = require('@/lib/supabase');
    expect(supabase.from).toHaveBeenCalledWith('ticket_tags');
  });

  it('should assign tag to ticket', async () => {
    const mockSetTickets = jest.fn();
    const mockSetSelectedTicket = jest.fn();
    
    const { result } = renderHook(() => useTagManagement());
    
    await act(async () => {
      await result.current.handleAssignTag('ticket-1', 'tag-1', mockSetTickets, mockSetSelectedTicket);
    });
    
    const { supabase } = require('@/lib/supabase');
    expect(supabase.from).toHaveBeenCalledWith('ticket_tag_assignments');
  });

  it('should remove tag from ticket', async () => {
    const mockSetTickets = jest.fn();
    const mockSetSelectedTicket = jest.fn();
    
    const { result } = renderHook(() => useTagManagement());
    
    await act(async () => {
      await result.current.handleRemoveTag('ticket-1', 'tag-1', mockSetTickets, mockSetSelectedTicket);
    });
    
    const { supabase } = require('@/lib/supabase');
    expect(supabase.from).toHaveBeenCalledWith('ticket_tag_assignments');
  });
});
