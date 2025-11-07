import {
  MeetingsError,
  MeetingsErrorType,
  getErrorMessage,
  handleApiError,
  safeAsync,
  validateResponse,
  withRetry,
  logError,
} from '../utils/errorHandling';

describe('MeetingsError', () => {
  it('creates error with correct properties', () => {
    const error = new MeetingsError(
      'Test error',
      MeetingsErrorType.VALIDATION_ERROR,
      400,
      { field: 'email' }
    );

    expect(error.message).toBe('Test error');
    expect(error.type).toBe(MeetingsErrorType.VALIDATION_ERROR);
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual({ field: 'email' });
    expect(error.name).toBe('MeetingsError');
  });

  it('defaults to UNKNOWN_ERROR type', () => {
    const error = new MeetingsError('Test error');
    expect(error.type).toBe(MeetingsErrorType.UNKNOWN_ERROR);
  });
});

describe('getErrorMessage', () => {
  it('extracts message from MeetingsError', () => {
    const error = new MeetingsError('Custom error', MeetingsErrorType.NETWORK_ERROR);
    expect(getErrorMessage(error)).toBe('Custom error');
  });

  it('extracts message from standard Error', () => {
    const error = new Error('Standard error');
    expect(getErrorMessage(error)).toBe('Standard error');
  });

  it('handles string errors', () => {
    expect(getErrorMessage('String error')).toBe('String error');
  });

  it('handles objects with message property', () => {
    expect(getErrorMessage({ message: 'Object error' })).toBe('Object error');
  });

  it('returns default message for unknown errors', () => {
    expect(getErrorMessage(123)).toBe('An unexpected error occurred. Please try again.');
    expect(getErrorMessage(null)).toBe('An unexpected error occurred. Please try again.');
    expect(getErrorMessage(undefined)).toBe('An unexpected error occurred. Please try again.');
  });
});

describe('handleApiError', () => {
  it('throws MeetingsError with JSON error message', async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: jest.fn().mockResolvedValue({ error: 'Invalid input' }),
    } as unknown as Response;

    await expect(handleApiError(mockResponse)).rejects.toThrow(MeetingsError);
    await expect(handleApiError(mockResponse)).rejects.toThrow('Invalid input');
  });

  it('handles 401 as AUTH_ERROR', async () => {
    const mockResponse = {
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: jest.fn().mockResolvedValue({ error: 'Not authenticated' }),
    } as unknown as Response;

    try {
      await handleApiError(mockResponse);
    } catch (error) {
      expect(error).toBeInstanceOf(MeetingsError);
      expect((error as MeetingsError).type).toBe(MeetingsErrorType.AUTH_ERROR);
    }
  });

  it('handles 404 as NOT_FOUND', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: jest.fn().mockResolvedValue({ error: 'Resource not found' }),
    } as unknown as Response;

    try {
      await handleApiError(mockResponse);
    } catch (error) {
      expect(error).toBeInstanceOf(MeetingsError);
      expect((error as MeetingsError).type).toBe(MeetingsErrorType.NOT_FOUND);
    }
  });

  it('handles 409 as BOOKING_CONFLICT', async () => {
    const mockResponse = {
      ok: false,
      status: 409,
      statusText: 'Conflict',
      json: jest.fn().mockResolvedValue({ error: 'Time slot already booked' }),
    } as unknown as Response;

    try {
      await handleApiError(mockResponse);
    } catch (error) {
      expect(error).toBeInstanceOf(MeetingsError);
      expect((error as MeetingsError).type).toBe(MeetingsErrorType.BOOKING_CONFLICT);
    }
  });

  it('handles non-JSON responses', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: jest.fn().mockRejectedValue(new Error('Not JSON')),
    } as unknown as Response;

    try {
      await handleApiError(mockResponse);
    } catch (error) {
      expect(error).toBeInstanceOf(MeetingsError);
      expect((error as MeetingsError).message).toContain('Internal Server Error');
    }
  });
});

describe('safeAsync', () => {
  it('returns result on success', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const result = await safeAsync(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalled();
  });

  it('returns undefined on error', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Failed'));
    const result = await safeAsync(fn);

    expect(result).toBeUndefined();
  });

  it('calls custom error handler', async () => {
    const error = new Error('Failed');
    const fn = jest.fn().mockRejectedValue(error);
    const errorHandler = jest.fn();

    await safeAsync(fn, errorHandler);

    expect(errorHandler).toHaveBeenCalledWith(error);
  });
});

describe('validateResponse', () => {
  it('returns response when ok', async () => {
    const mockResponse = { ok: true } as Response;
    const result = await validateResponse(mockResponse);

    expect(result).toBe(mockResponse);
  });

  it('throws MeetingsError when not ok', async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: jest.fn().mockResolvedValue({ error: 'Invalid' }),
    } as unknown as Response;

    await expect(validateResponse(mockResponse)).rejects.toThrow(MeetingsError);
  });
});

describe('withRetry', () => {
  it('returns result on first success', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const result = await withRetry(fn, 3, 10);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and eventually succeeds', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue('success');

    const result = await withRetry(fn, 3, 10);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  }, 10000); // Increase timeout to 10 seconds

  it('throws error after max retries', async () => {
    const error = new Error('Always fails');
    const fn = jest.fn().mockRejectedValue(error);

    await expect(withRetry(fn, 2, 10)).rejects.toThrow('Always fails');
    expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  }, 10000); // Increase timeout to 10 seconds

  it('does not retry on client errors (4xx)', async () => {
    const error = new MeetingsError('Validation failed', MeetingsErrorType.VALIDATION_ERROR, 400);
    const fn = jest.fn().mockRejectedValue(error);

    await expect(withRetry(fn, 3, 10)).rejects.toThrow('Validation failed');
    expect(fn).toHaveBeenCalledTimes(1); // No retries
  });
});

describe('logError', () => {
  const originalEnv = process.env.NODE_ENV;
  const consoleError = console.error;

  beforeEach(() => {
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = consoleError;
    process.env.NODE_ENV = originalEnv;
  });

  it('logs error in development mode', () => {
    process.env.NODE_ENV = 'development';
    const error = new Error('Test error');

    logError(error, { userId: '123' });

    expect(console.error).toHaveBeenCalledWith(
      'Meetings Module Error:',
      expect.objectContaining({
        error: expect.any(Error),
        message: 'Test error',
        context: { userId: '123' },
        timestamp: expect.any(String),
      })
    );
  });

  it('does not log in production mode', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('Test error');

    logError(error);

    expect(console.error).not.toHaveBeenCalled();
  });
});
