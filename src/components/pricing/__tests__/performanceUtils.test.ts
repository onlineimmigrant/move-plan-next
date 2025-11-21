/**
 * @jest-environment jsdom
 */

import {
  logRenderPerformance,
  measureTimeToInteractive,
  createCardObserver,
} from '../performanceUtils';

describe('performanceUtils', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('logRenderPerformance', () => {
    it('should warn in development when render time exceeds 16ms', () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
      });
      
      const startTime = performance.now() - 20; // 20ms ago
      logRenderPerformance('TestComponent', startTime);
      
      expect(console.warn).toHaveBeenCalled();
      
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
      });
    });

    it('should not warn in production', () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
      });
      
      const startTime = performance.now() - 20;
      logRenderPerformance('TestComponent', startTime);
      
      expect(console.warn).not.toHaveBeenCalled();
      
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
      });
    });

    it('should not warn when render time is under 16ms', () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
      });
      
      const startTime = performance.now() - 10; // 10ms ago
      logRenderPerformance('TestComponent', startTime);
      
      expect(console.warn).not.toHaveBeenCalled();
      
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
      });
    });
  });

  describe('measureTimeToInteractive', () => {
    it('should mark performance when mark is available', () => {
      const mockMark = jest.fn();
      global.performance.mark = mockMark;
      
      measureTimeToInteractive('test-component');
      
      expect(mockMark).toHaveBeenCalledWith('test-component-interactive');
    });

    it('should handle missing performance.mark gracefully', () => {
      const originalMark = global.performance.mark;
      // @ts-expect-error - Testing performance.mark unavailability
      delete global.performance.mark;
      
      expect(() => measureTimeToInteractive('test-component')).not.toThrow();
      
      global.performance.mark = originalMark;
    });

    it('should catch and log errors', () => {
      const mockMark = jest.fn(() => {
        throw new Error('Performance API error');
      });
      global.performance.mark = mockMark;
      
      measureTimeToInteractive('test-component');
      
      expect(console.error).toHaveBeenCalledWith(
        'Failed to measure performance:',
        expect.any(Error)
      );
    });
  });

  describe('createCardObserver', () => {
    it('should create IntersectionObserver when available', () => {
      const mockObserve = jest.fn();
      const mockObserver = {
        observe: mockObserve,
        disconnect: jest.fn(),
        unobserve: jest.fn(),
        takeRecords: jest.fn(),
        root: null,
        rootMargin: '',
        thresholds: [0.1],
      };

      global.IntersectionObserver = jest.fn((callback) => {
        return mockObserver;
      }) as any;

      const mockCallback = jest.fn();
      const observer = createCardObserver(mockCallback);

      expect(global.IntersectionObserver).toHaveBeenCalledWith(
        mockCallback,
        {
          root: null,
          rootMargin: '50px',
          threshold: 0.1,
        }
      );
      expect(observer).toBe(mockObserver);
    });

    it('should return null when IntersectionObserver not available', () => {
      const originalIO = global.IntersectionObserver;
      // @ts-expect-error - Testing IntersectionObserver unavailability
      delete global.IntersectionObserver;

      const mockCallback = jest.fn();
      const observer = createCardObserver(mockCallback);

      expect(observer).toBeNull();

      global.IntersectionObserver = originalIO;
    });

    it('should use correct observer options', () => {
      let observerOptions: IntersectionObserverInit | undefined;

      global.IntersectionObserver = jest.fn((callback, options) => {
        observerOptions = options;
        return {
          observe: jest.fn(),
          disconnect: jest.fn(),
          unobserve: jest.fn(),
          takeRecords: jest.fn(),
          root: null,
          rootMargin: '',
          thresholds: [0.1],
        };
      });

      const mockCallback = jest.fn();
      createCardObserver(mockCallback);

      expect(observerOptions).toEqual({
        root: null,
        rootMargin: '50px',
        threshold: 0.1,
      });
    });
  });
});
