import { renderHook, waitFor } from '@testing-library/react';
import { useAccountAuth } from '../useAccountAuth';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      refreshSession: jest.fn(),
    },
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('useAccountAuth', () => {
  const mockPush = jest.fn();
  const mockGetSession = supabase.auth.getSession as jest.Mock;
  const mockRefreshSession = supabase.auth.refreshSession as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it('should return session data when session exists', async () => {
    const mockSession = {
      access_token: 'test-token',
      user: { id: 'user-123' },
    };

    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAccountAuth());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.accessToken).toBe('test-token');
    expect(result.current.userId).toBe('user-123');
    expect(result.current.error).toBeNull();
  });

  it('should refresh session when getSession returns null', async () => {
    const mockRefreshedSession = {
      access_token: 'refreshed-token',
      user: { id: 'user-456' },
    };

    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    mockRefreshSession.mockResolvedValue({
      data: { session: mockRefreshedSession },
      error: null,
    });

    const { result } = renderHook(() => useAccountAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.accessToken).toBe('refreshed-token');
    expect(result.current.userId).toBe('user-456');
    expect(mockRefreshSession).toHaveBeenCalled();
  });

  it('should redirect to login when session cannot be retrieved', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    mockRefreshSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'No session' },
    });

    const { result } = renderHook(() => useAccountAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should handle session errors gracefully', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Session error' },
    });

    const { result } = renderHook(() => useAccountAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toContain('Session error');
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
