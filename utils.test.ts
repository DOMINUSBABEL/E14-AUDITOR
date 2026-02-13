import { expect, test } from "bun:test";
import { generateId } from "./utils";

test("generateId returns a string", () => {
  const id = generateId();
  expect(typeof id).toBe("string");
});

test("generateId returns a string of correct length", () => {
  const id = generateId();
  // Math.random().toString(36) length is variable, but slice(2, 11) should return at most 9 chars.
  // It could be less if random string is short, but max 9.
  expect(id.length).toBeLessThanOrEqual(9);
  expect(id.length).toBeGreaterThan(0);
});

test("generateId does not contain '0.' prefix", () => {
  const id = generateId();
  expect(id).not.toContain(".");
});
