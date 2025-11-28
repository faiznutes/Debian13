/**
 * Retry Logic Utilities
 * Implements retry pattern for transient errors
 */

export interface RetryOptions {
  maxAttempts?: number;
  delay?: number; // Initial delay in ms
  backoff?: 'linear' | 'exponential';
  maxDelay?: number; // Maximum delay in ms
  retryable?: (error: any) => boolean; // Function to determine if error is retryable
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delay: 1000,
  backoff: 'exponential',
  maxDelay: 10000,
  retryable: (error: any) => {
    // Retry on network errors, timeouts, and 5xx errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      return true;
    }
    if (error.response?.status >= 500 && error.response?.status < 600) {
      return true;
    }
    // Retry on Prisma connection errors
    if (error.code?.startsWith('P1')) {
      return true;
    }
    return false;
  },
};

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if error is retryable
      if (!opts.retryable(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === opts.maxAttempts) {
        break;
      }

      // Calculate delay
      let delay: number;
      if (opts.backoff === 'exponential') {
        delay = Math.min(opts.delay * Math.pow(2, attempt - 1), opts.maxDelay);
      } else {
        delay = Math.min(opts.delay * attempt, opts.maxDelay);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Circuit Breaker Pattern
 * Prevents cascading failures by stopping requests when service is down
 */
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5, // Number of failures before opening
    private timeout: number = 60000, // Time to wait before half-open (60 seconds)
    private resetTimeout: number = 30000 // Time to wait before resetting failures (30 seconds)
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check circuit state
    if (this.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure < this.timeout) {
        throw new Error('Circuit breaker is OPEN. Service unavailable.');
      }
      // Move to half-open
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();
      // Success - reset failures and close circuit
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
      }
      this.failures = 0;
      return result;
    } catch (error: any) {
      this.failures++;
      this.lastFailureTime = Date.now();

      // Open circuit if threshold exceeded
      if (this.failures >= this.threshold) {
        this.state = 'OPEN';
      }

      throw error;
    }
  }

  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.state;
  }

  reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = 0;
  }
}

