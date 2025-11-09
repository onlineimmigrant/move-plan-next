import { renderHook, waitFor } from '@testing-library/react';
import { useTransactions } from '../useTransactions';
import { supabase } from '@/lib/supabaseClient';

// Mock dependencies
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('useTransactions', () => {
  const mockFrom = supabase.from as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockChain = (data: any, count: number | null = null, error: any = null) => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue({ data, error, count }),
  });

  it('should fetch succeeded transactions by default', async () => {
    const mockTransactions = [
      {
        id: 'txn-1',
        user_id: 'user-123',
        amount: 100,
        currency: 'usd',
        status: 'succeeded',
        created_at: '2024-01-01',
        stripe_transaction_id: 'stripe-123',
        payment_method: 'card',
        refunded_date: null,
        metadata: {},
      },
    ];

    mockFrom.mockImplementation(() => createMockChain(mockTransactions, 1));

    const { result } = renderHook(() =>
      useTransactions({
        userId: 'user-123',
        accessToken: 'test-token',
        itemsPerPage: 10,
        currentPage: 1,
        showAllPayments: false,
      })
    );

    await waitFor(() => {
      result.current.fetchTransactions();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0].status).toBe('succeeded');
  });

  it('should fetch all transactions when showAllPayments is true', async () => {
    const mockTransactions = [
      {
        id: 'txn-1',
        user_id: 'user-123',
        amount: 100,
        currency: 'usd',
        status: 'succeeded',
        created_at: '2024-01-01',
        stripe_transaction_id: 'stripe-123',
        payment_method: 'card',
        refunded_date: null,
        metadata: {},
      },
      {
        id: 'txn-2',
        user_id: 'user-123',
        amount: 50,
        currency: 'usd',
        status: 'pending',
        created_at: '2024-01-02',
        stripe_transaction_id: 'stripe-456',
        payment_method: 'card',
        refunded_date: null,
        metadata: {},
      },
    ];

    mockFrom.mockImplementation(() => createMockChain(mockTransactions, 2));

    const { result } = renderHook(() =>
      useTransactions({
        userId: 'user-123',
        accessToken: 'test-token',
        itemsPerPage: 10,
        currentPage: 1,
        showAllPayments: true,
      })
    );

    await waitFor(() => {
      result.current.fetchTransactions();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.transactions).toHaveLength(2);
  });

  it('should handle fetch errors', async () => {
    mockFrom.mockImplementation(() =>
      createMockChain(null, null, { message: 'Database error' })
    );

    const { result } = renderHook(() =>
      useTransactions({
        userId: 'user-123',
        accessToken: 'test-token',
        itemsPerPage: 10,
        currentPage: 1,
      })
    );

    await waitFor(() => {
      result.current.fetchTransactions();
    });

    await waitFor(() => {
      expect(result.current.error).toContain('Database error');
    });
  });

  it('should skip fetch when no credentials provided', async () => {
    const { result } = renderHook(() =>
      useTransactions({
        userId: null,
        accessToken: null,
        itemsPerPage: 10,
        currentPage: 1,
      })
    );

    await result.current.fetchTransactions();

    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should detect non-succeeded transactions', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'transactions') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          is: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({ 
            data: [], 
            error: null,
            count: null 
          }),
        };
      }
      return createMockChain([], 0);
    });

    // Mock to return different counts for succeeded vs all
    let callCount = 0;
    mockFrom.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ 
        data: [], 
        error: null,
        count: callCount++ === 0 ? null : (callCount === 2 ? 5 : 10)
      }),
    }));

    const { result } = renderHook(() =>
      useTransactions({
        userId: 'user-123',
        accessToken: 'test-token',
        itemsPerPage: 10,
        currentPage: 1,
      })
    );

    await waitFor(() => {
      result.current.fetchTransactions();
    });

    await waitFor(() => {
      expect(result.current.hasNonSucceeded).toBe(true);
    });
  });
});
