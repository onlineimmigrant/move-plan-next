import { renderHook, waitFor } from '@testing-library/react';
import { useProfile } from '../useProfile';

// Mock fetch
global.fetch = jest.fn();

describe('useProfile', () => {
  const mockAccessToken = 'test-access-token';
  const mockProfile = {
    id: '123',
    uuid: 'uuid-123',
    username: 'testuser',
    full_name: 'Test User',
    created_at: '2024-01-01T00:00:00Z',
    email: 'test@example.com',
    city: 'New York',
    postal_code: '10001',
    country: 'USA',
    role: 'user',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with undefined profile and no loading/error', () => {
      const { result } = renderHook(() => useProfile(null));

      expect(result.current.profile).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Successful Fetch', () => {
    it('should fetch profile successfully with valid token', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      });

      const { result } = renderHook(() => useProfile(mockAccessToken));

      // Should start loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have fetched profile
      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.error).toBeNull();
    });

    it('should include authorization header in request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      });

      renderHook(() => useProfile(mockAccessToken));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/profiles',
          {
            headers: { Authorization: `Bearer ${mockAccessToken}` },
          }
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch error with error response', async () => {
      const errorMessage = 'Profile not found';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      });

      const { result } = renderHook(() => useProfile(mockAccessToken));

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });

      expect(result.current.profile).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle fetch error without error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useProfile(mockAccessToken));

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch profile');
      });
    });

    it('should handle network error', async () => {
      const networkError = new Error('Network error');
      (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useProfile(mockAccessToken));

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });

      expect(result.current.profile).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Token Changes', () => {
    it('should not fetch when token is null', () => {
      renderHook(() => useProfile(null));

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should refetch when token changes', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockProfile,
      });

      const { rerender } = renderHook(
        ({ token }) => useProfile(token),
        { initialProps: { token: null } }
      );

      expect(global.fetch).not.toHaveBeenCalled();

      // Update token
      rerender({ token: mockAccessToken });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Manual Refetch', () => {
    it('should allow manual profile refetch', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockProfile,
      });

      const { result } = renderHook(() => useProfile(mockAccessToken));

      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile);
      });

      // Clear mock to track new calls
      (global.fetch as jest.Mock).mockClear();

      // Manual refetch
      await result.current.fetchProfile();

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should not fetch when token is null on manual refetch', async () => {
      const { result } = renderHook(() => useProfile(null));

      await result.current.fetchProfile();

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('setProfile', () => {
    it('should allow manual profile updates', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      });

      const { result } = renderHook(() => useProfile(mockAccessToken));

      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile);
      });

      const updatedProfile = { ...mockProfile, full_name: 'Updated Name' };
      result.current.setProfile(updatedProfile);

      expect(result.current.profile).toEqual(updatedProfile);
    });
  });

  describe('Loading States', () => {
    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(promise);

      const { result } = renderHook(() => useProfile(mockAccessToken));

      // Should be loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => mockProfile,
      });

      // Should finish loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should clear loading state after error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

      const { result } = renderHook(() => useProfile(mockAccessToken));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('Test error');
      });
    });
  });

  describe('Error State Management', () => {
    it('should clear previous error on successful refetch', async () => {
      // First call fails
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useProfile(mockAccessToken));

      await waitFor(() => {
        expect(result.current.error).toBe('First error');
      });

      // Second call succeeds
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      });

      await result.current.fetchProfile();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.profile).toEqual(mockProfile);
      });
    });
  });
});
