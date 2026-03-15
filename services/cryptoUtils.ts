/**
 * Secure random utility functions using the Web Crypto API.
 */

/**
 * Generates a secure unique identifier (UUID v4).
 */
export const generateSecureId = (): string => {
  return crypto.randomUUID();
};

/**
 * Generates a secure random integer between min (inclusive) and max (inclusive).
 */
export const getRandomInt = (min: number, max: number): number => {
  const range = max - min + 1;
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return min + (array[0] % range);
};

/**
 * Generates a secure random float between 0 (inclusive) and 1 (exclusive),
 * similar to Math.random().
 */
export const getSecureRandom = (): number => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  // Divide by 2^32 to get a float between 0 and 1
  return array[0] / (0xffffffff + 1);
};
