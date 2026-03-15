import { describe, it, expect } from 'bun:test';
import { generateSecureId, getRandomInt, getSecureRandom } from './cryptoUtils';

describe('cryptoUtils', () => {
  describe('generateSecureId', () => {
    it('should generate a valid UUID v4', () => {
      const id = generateSecureId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        const id = generateSecureId();
        expect(ids.has(id)).toBe(false);
        ids.add(id);
      }
    });
  });

  describe('getRandomInt', () => {
    it('should generate integers within the specified range', () => {
      const min = 10;
      const max = 20;
      for (let i = 0; i < 100; i++) {
        const val = getRandomInt(min, max);
        expect(Number.isInteger(val)).toBe(true);
        expect(val).toBeGreaterThanOrEqual(min);
        expect(val).toBeLessThanOrEqual(max);
      }
    });

    it('should include both min and max', () => {
      const min = 1;
      const max = 2;
      const seen = new Set();
      for (let i = 0; i < 100; i++) {
        seen.add(getRandomInt(min, max));
      }
      expect(seen.has(1)).toBe(true);
      expect(seen.has(2)).toBe(true);
    });
  });

  describe('getSecureRandom', () => {
    it('should generate numbers between 0 and 1', () => {
      for (let i = 0; i < 100; i++) {
        const val = getSecureRandom();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });
  });
});
