import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { afterEach, mock } from 'bun:test';
import { cleanup } from '@testing-library/react';

// Set dummy API key for testing
process.env.API_KEY = 'dummy-key-for-testing';

GlobalRegistrator.register();

// Global mock for @google/genai to prevent API calls during tests
mock.module("@google/genai", () => {
  return {
    GoogleGenAI: class {
      constructor() {}
      models = {
        generateContent: () => Promise.resolve({ text: "{}" })
      }
    },
    Type: {
      OBJECT: "OBJECT",
      STRING: "STRING",
      ARRAY: "ARRAY",
      INTEGER: "INTEGER",
      BOOLEAN: "BOOLEAN",
      NUMBER: "NUMBER"
    }
  };
});

afterEach(() => {
    cleanup();
});
