import { renderHook, waitFor } from '@testing-library/react';
import { usePurchases } from '../usePurchases';
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
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('usePurchases', () => {
  const mockFrom = supabase.from as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockChain = (data: any, error: any = null) => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue({ data, error }),
  });

  it('should fetch and group purchases correctly', async () => {
    const mockPricingPlans = [
      {
        id: 'pp-1',
        product_id: 'prod-1',
        package: 'Premium',
        measure: 'Monthly',
        price: 99.99,
        currency: 'usd',
      },
    ];

    const mockProducts = [
      {
        id: 'prod-1',
        product_name: 'Test Product',
        slug: 'test-product',
        links_to_image: 'https://example.com/image.jpg',
      },
    ];

    const mockPurchases = [
      {
        id: 'purchase-1',
        purchased_item_id: 'pp-1',
        profiles_id: 'user-123',
        transaction_id: 'txn-1',
        start_date: '2024-01-01',
        end_date: '2024-02-01',
        is_active: true,
      },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === 'pricingplan') {
        return createMockChain(mockPricingPlans);
      }
      if (table === 'product') {
        return createMockChain(mockProducts);
      }
      if (table === 'purchases') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({ data: mockPurchases, error: null }),
        };
      }
      return createMockChain([], null);
    });

    const { result } = renderHook(() =>
      usePurchases({
        userId: 'user-123',
        accessToken: 'test-token',
        itemsPerPage: 10,
        currentPage: 1,
      })
    );

    // Initial loading state
    expect(result.current.isLoading).toBe(false);

    // Fetch purchases
    await waitFor(() => {
      result.current.fetchPurchases();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.groupedPurchases).toHaveLength(1);
    expect(result.current.groupedPurchases[0].transaction_id).toBe('txn-1');
  });

  it('should handle fetch errors gracefully', async () => {
    mockFrom.mockImplementation(() =>
      createMockChain(null, { message: 'Database error' })
    );

    const { result } = renderHook(() =>
      usePurchases({
        userId: 'user-123',
        accessToken: 'test-token',
        itemsPerPage: 10,
        currentPage: 1,
      })
    );

    await waitFor(() => {
      result.current.fetchPurchases();
    });

    await waitFor(() => {
      expect(result.current.error).toContain('Database error');
    });
  });

  it('should skip fetch when no access token provided', async () => {
    const { result } = renderHook(() =>
      usePurchases({
        userId: 'user-123',
        accessToken: null,
        itemsPerPage: 10,
        currentPage: 1,
      })
    );

    await result.current.fetchPurchases();

    expect(mockFrom).not.toHaveBeenCalled();
  });
});
