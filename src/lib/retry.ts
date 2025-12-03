// Generic retry utilities with exponential backoff
// Focused, minimal implementation for fetch + arbitrary async functions.

export interface RetryOptions {
  retries?: number;            // total attempts (default 3)
  baseDelayMs?: number;        // initial delay (default 300ms)
  maxDelayMs?: number;         // cap delay (default 4000ms)
  jitter?: boolean;            // add random jitter (default true)
  abortSignal?: AbortSignal;   // optional abort
  onAttempt?: (attempt: number, error: unknown) => void; // hook
  shouldRetry?: (error: unknown) => boolean;             // custom predicate
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function retry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const {
    retries = 3,
    baseDelayMs = 300,
    maxDelayMs = 4000,
    jitter = true,
    abortSignal,
    onAttempt,
    shouldRetry = () => true,
  } = opts;

  let attempt = 0;
  let lastError: unknown;
  while (attempt < retries) {
    if (abortSignal?.aborted) {
      throw lastError || new Error('Aborted');
    }
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (onAttempt) onAttempt(attempt, err);
      const offline = typeof navigator !== 'undefined' && !navigator.onLine;
      if (offline || attempt === retries - 1 || !shouldRetry(err)) break;
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs) * (jitter ? (0.75 + Math.random() * 0.5) : 1);
      await sleep(delay);
      attempt++;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

// Convenience wrapper for fetch with JSON response
export async function fetchWithRetry<T = any>(input: RequestInfo | URL, init?: RequestInit, opts?: RetryOptions): Promise<T> {
  return retry(async () => {
    const res = await fetch(input, init);
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return (text ? JSON.parse(text) : {}) as T;
  }, opts);
}
