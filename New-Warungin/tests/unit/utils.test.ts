/**
 * Unit tests for utility functions
 */

import { describe, it, expect } from 'vitest';
import { debounce, throttle } from '../../client/src/utils/performance';

describe('Performance Utilities', () => {
  describe('debounce', () => {
    it('should delay function execution', (done) => {
      let callCount = 0;
      const debouncedFn = debounce(() => {
        callCount++;
        expect(callCount).toBe(1);
        done();
      }, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();
    });

    it('should cancel previous calls', (done) => {
      let callCount = 0;
      const debouncedFn = debounce(() => {
        callCount++;
      }, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 150);
    });
  });

  describe('throttle', () => {
    it('should limit function execution rate', (done) => {
      let callCount = 0;
      const throttledFn = throttle(() => {
        callCount++;
      }, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      setTimeout(() => {
        expect(callCount).toBeLessThanOrEqual(2);
        done();
      }, 150);
    });
  });
});

